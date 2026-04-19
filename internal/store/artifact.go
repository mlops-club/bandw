package store

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// GetOrCreateArtifactType finds or creates an artifact type by name within a project.
func GetOrCreateArtifactType(db *gorm.DB, projectID, typeName string) (*ArtifactType, error) {
	var artType ArtifactType
	err := db.Where("project_id = ? AND name = ?", projectID, typeName).First(&artType).Error
	if err == nil {
		return &artType, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}
	artType = ArtifactType{
		Name:      typeName,
		ProjectID: projectID,
	}
	if err := db.Create(&artType).Error; err != nil {
		// Race condition: another request created it first, try to fetch again.
		if err2 := db.Where("project_id = ? AND name = ?", projectID, typeName).First(&artType).Error; err2 != nil {
			return nil, fmt.Errorf("create artifact type: %w", err)
		}
	}
	return &artType, nil
}

// GetOrCreateArtifactCollection finds or creates a collection (sequence) by name.
func GetOrCreateArtifactCollection(db *gorm.DB, projectID, artifactTypeID, collectionName, description string) (*ArtifactCollection, error) {
	var coll ArtifactCollection
	err := db.Where("project_id = ? AND name = ?", projectID, collectionName).First(&coll).Error
	if err == nil {
		return &coll, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}
	coll = ArtifactCollection{
		Name:           collectionName,
		Description:    description,
		Type:           "sequence",
		ArtifactTypeID: artifactTypeID,
		ProjectID:      projectID,
		State:          "active",
	}
	if err := db.Create(&coll).Error; err != nil {
		if err2 := db.Where("project_id = ? AND name = ?", projectID, collectionName).First(&coll).Error; err2 != nil {
			return nil, fmt.Errorf("create collection: %w", err)
		}
	}
	return &coll, nil
}

// CreateArtifact creates a new artifact version in PENDING state.
// It auto-increments the version index within the collection.
// If a clientID match exists, it returns the existing artifact (dedup).
func CreateArtifact(db *gorm.DB, input CreateArtifactInput) (*Artifact, bool, error) {
	// Client ID dedup: check if this clientID already exists.
	if input.ClientID != "" {
		var existing Artifact
		if err := db.Where("client_id = ?", input.ClientID).First(&existing).Error; err == nil {
			return &existing, false, nil // already exists
		}
	}

	// Compute next version index.
	var maxVersion *int
	db.Model(&Artifact{}).
		Where("collection_id = ?", input.CollectionID).
		Select("MAX(version_index)").
		Scan(&maxVersion)

	nextVersion := 0
	if maxVersion != nil {
		nextVersion = *maxVersion + 1
	}

	art := Artifact{
		CollectionID:       input.CollectionID,
		Digest:             input.Digest,
		State:              "PENDING",
		Description:        input.Description,
		Metadata:           input.Metadata,
		VersionIndex:       nextVersion,
		CreatedByRunID:     input.CreatedByRunID,
		ClientID:           input.ClientID,
		SequenceClientID:   input.SequenceClientID,
		DistributedID:      input.DistributedID,
		TtlDurationSeconds: input.TtlDurationSeconds,
		HistoryStep:        input.HistoryStep,
	}

	if err := db.Create(&art).Error; err != nil {
		return nil, false, fmt.Errorf("create artifact: %w", err)
	}

	// Record output lineage if there's a creating run.
	if input.CreatedByRunID != nil && *input.CreatedByRunID != "" {
		usage := ArtifactUsage{
			RunID:      *input.CreatedByRunID,
			ArtifactID: art.ID,
			Type:       "output",
		}
		db.Create(&usage) // ignore duplicate errors
	}

	return &art, true, nil
}

// CreateArtifactInput holds the parameters for creating an artifact.
type CreateArtifactInput struct {
	CollectionID       string
	Digest             string
	Description        string
	Metadata           []byte
	CreatedByRunID     *string
	ClientID           string
	SequenceClientID   string
	DistributedID      string
	TtlDurationSeconds *int64
	HistoryStep        *int64
}

// CreateArtifactManifestRecord creates a manifest record for an artifact.
func CreateArtifactManifestRecord(db *gorm.DB, artifactID, manifestType, digest string, baseArtifactID *string) (*ArtifactManifest, error) {
	manifest := ArtifactManifest{
		ArtifactID:     artifactID,
		Type:           manifestType,
		Digest:         digest,
		BaseArtifactID: baseArtifactID,
	}
	if err := db.Create(&manifest).Error; err != nil {
		return nil, fmt.Errorf("create manifest: %w", err)
	}
	return &manifest, nil
}

// CreateArtifactFileRecord creates a stored file record and returns it.
func CreateArtifactFileRecord(db *gorm.DB, artifactID, name, storagePath, md5, uploadURL, directURL string) (*ArtifactFileStored, error) {
	file := ArtifactFileStored{
		ArtifactID:  artifactID,
		Name:        name,
		StoragePath: storagePath,
		MD5:         md5,
		UploadURL:   uploadURL,
		DirectURL:   directURL,
	}
	if err := db.Create(&file).Error; err != nil {
		return nil, fmt.Errorf("create artifact file: %w", err)
	}
	return &file, nil
}

// UpdateManifestDigest updates the digest on a manifest and optionally sets the file ID.
func UpdateManifestDigest(db *gorm.DB, manifestID string, digest *string, fileID *string) (*ArtifactManifest, error) {
	updates := map[string]interface{}{}
	if digest != nil {
		updates["digest"] = *digest
	}
	if fileID != nil {
		updates["file_id"] = *fileID
	}
	if len(updates) > 0 {
		if err := db.Model(&ArtifactManifest{}).Where("id = ?", manifestID).Updates(updates).Error; err != nil {
			return nil, err
		}
	}
	var manifest ArtifactManifest
	if err := db.First(&manifest, "id = ?", manifestID).Error; err != nil {
		return nil, err
	}
	return &manifest, nil
}

// CommitArtifact transitions an artifact from PENDING to COMMITTED.
// Updates the "latest" alias to point to this version, and assigns a "vN" alias.
func CommitArtifact(db *gorm.DB, artifactID string) (*Artifact, error) {
	var art Artifact
	if err := db.First(&art, "id = ?", artifactID).Error; err != nil {
		return nil, fmt.Errorf("artifact not found: %w", err)
	}

	// Compute total size and file count from stored files.
	var totalSize int64
	var fileCount int64
	db.Model(&ArtifactFileStored{}).
		Where("artifact_id = ?", artifactID).
		Select("COALESCE(SUM(size), 0)").
		Scan(&totalSize)
	db.Model(&ArtifactFileStored{}).
		Where("artifact_id = ?", artifactID).
		Count(&fileCount)

	now := time.Now()
	if err := db.Model(&art).Updates(map[string]interface{}{
		"state":        "COMMITTED",
		"committed_at": now,
		"size":         totalSize,
		"file_count":   int(fileCount),
	}).Error; err != nil {
		return nil, err
	}
	art.State = "COMMITTED"
	art.CommittedAt = &now
	art.Size = totalSize
	art.FileCount = int(fileCount)

	// Move "latest" alias to this version.
	// First remove "latest" from any other version in the same collection.
	db.Where("collection_id = ? AND alias = ?", art.CollectionID, "latest").Delete(&ArtifactAlias{})

	// Create "latest" alias on this version.
	db.Create(&ArtifactAlias{
		ArtifactID:   art.ID,
		CollectionID: art.CollectionID,
		Alias:        "latest",
	})

	// Create "vN" alias.
	vAlias := fmt.Sprintf("v%d", art.VersionIndex)
	var existingVAlias ArtifactAlias
	if db.Where("collection_id = ? AND alias = ?", art.CollectionID, vAlias).First(&existingVAlias).Error == gorm.ErrRecordNotFound {
		db.Create(&ArtifactAlias{
			ArtifactID:   art.ID,
			CollectionID: art.CollectionID,
			Alias:        vAlias,
		})
	}

	return &art, nil
}

// CreateArtifactUsage records that a run used (consumed) an artifact.
func CreateArtifactUsage(db *gorm.DB, runID, artifactID, usageType string) error {
	usage := ArtifactUsage{
		RunID:      runID,
		ArtifactID: artifactID,
		Type:       usageType,
	}
	// Ignore duplicate errors (unique constraint on run_id, artifact_id, type).
	db.Create(&usage)
	return nil
}

// GetArtifactByClientID looks up an artifact by its client-assigned dedup ID.
func GetArtifactByClientID(db *gorm.DB, clientID string) (*Artifact, error) {
	var art Artifact
	if err := db.Where("client_id = ?", clientID).First(&art).Error; err != nil {
		return nil, err
	}
	return &art, nil
}

// GetArtifactByName resolves an artifact by "collection:versionOrAlias" within a project.
// The name can be:
//   - "my-dataset:v0"       — resolve by version alias
//   - "my-dataset:latest"   — resolve by alias
//   - "my-dataset:v3"       — resolve by version alias (vN format)
func GetArtifactByName(db *gorm.DB, projectID, name string) (*Artifact, error) {
	// Split "collection:versionOrAlias"
	parts := splitArtifactName(name)
	collectionName := parts[0]
	versionOrAlias := parts[1]

	// Find the collection.
	var coll ArtifactCollection
	if err := db.Where("project_id = ? AND name = ?", projectID, collectionName).First(&coll).Error; err != nil {
		return nil, err
	}

	// Try to resolve by alias.
	var alias ArtifactAlias
	if err := db.Where("collection_id = ? AND alias = ?", coll.ID, versionOrAlias).First(&alias).Error; err == nil {
		var art Artifact
		if err := db.First(&art, "id = ?", alias.ArtifactID).Error; err != nil {
			return nil, err
		}
		return &art, nil
	}

	return nil, gorm.ErrRecordNotFound
}

// splitArtifactName splits "collection:version" into ["collection", "version"].
// If no colon, returns ["name", "latest"].
func splitArtifactName(name string) [2]string {
	for i := len(name) - 1; i >= 0; i-- {
		if name[i] == ':' {
			return [2]string{name[:i], name[i+1:]}
		}
	}
	return [2]string{name, "latest"}
}

// GetArtifactsByRunUsage returns artifacts linked to a run by usage type ("input" or "output").
func GetArtifactsByRunUsage(db *gorm.DB, runID, usageType string) ([]Artifact, error) {
	var usages []ArtifactUsage
	if err := db.Where("run_id = ? AND type = ?", runID, usageType).Find(&usages).Error; err != nil {
		return nil, err
	}
	if len(usages) == 0 {
		return nil, nil
	}
	artIDs := make([]string, len(usages))
	for i, u := range usages {
		artIDs[i] = u.ArtifactID
	}
	var arts []Artifact
	if err := db.Where("id IN ?", artIDs).Find(&arts).Error; err != nil {
		return nil, err
	}
	return arts, nil
}

// GetRunsByArtifactUsage returns runs that used a specific artifact as the given type.
func GetRunsByArtifactUsage(db *gorm.DB, artifactID, usageType string) ([]Run, error) {
	var usages []ArtifactUsage
	if err := db.Where("artifact_id = ? AND type = ?", artifactID, usageType).Find(&usages).Error; err != nil {
		return nil, err
	}
	if len(usages) == 0 {
		return nil, nil
	}
	runIDs := make([]string, len(usages))
	for i, u := range usages {
		runIDs[i] = u.RunID
	}
	var runs []Run
	if err := db.Where("id IN ?", runIDs).Find(&runs).Error; err != nil {
		return nil, err
	}
	return runs, nil
}

// GetArtifactFilesByArtifactID returns all stored files for an artifact.
func GetArtifactFilesByArtifactID(db *gorm.DB, artifactID string) ([]ArtifactFileStored, error) {
	var files []ArtifactFileStored
	if err := db.Where("artifact_id = ?", artifactID).Find(&files).Error; err != nil {
		return nil, err
	}
	return files, nil
}

// GetRunByEntityProjectName resolves entity + project + run name to a Run.
func GetRunByEntityProjectName(db *gorm.DB, entityName, projectName, runName string) (*Run, error) {
	project, err := GetProjectByEntityAndName(db, entityName, projectName)
	if err != nil {
		return nil, err
	}
	return GetRunByName(db, project.ID, runName)
}
