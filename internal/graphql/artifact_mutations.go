package graphql

import (
	"fmt"
	"regexp"

	gql "github.com/graph-gophers/graphql-go"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

var versionAliasRe = regexp.MustCompile(`^v\d+$`)

// ─── Top-level artifact queries ──────────────────────────────────

func (r *Resolver) Artifact(args struct{ ID gql.ID }) (*ArtifactResolver, error) {
	var art store.Artifact
	if err := r.db.First(&art, "id = ?", string(args.ID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &ArtifactResolver{artifact: &art, db: r.db}, nil
}

func (r *Resolver) ArtifactCollection(args struct{ ID gql.ID }) (*ArtifactCollectionResolver, error) {
	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ?", string(args.ID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &ArtifactCollectionResolver{coll: &coll, db: r.db}, nil
}

func (r *Resolver) ClientIDMapping(args struct{ ClientID gql.ID }) (*ClientIDMappingResultResolver, error) {
	art, err := store.GetArtifactByClientID(r.db, string(args.ClientID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &ClientIDMappingResultResolver{id: art.ID}, nil
}

// ─── Input types ─────────────────────────────────────────────────

type createArtifactInput struct {
	EntityName                string
	ProjectName               string
	RunName                   *string
	ArtifactTypeName          string
	ArtifactCollectionName    string
	ArtifactCollectionNames   *[]string
	Digest                    string
	DigestAlgorithm           string
	Description               *string
	Metadata                  *JSONString
	Labels                    *JSONString
	Aliases                   []artifactAliasInput
	ClientID                  string
	SequenceClientID          string
	EnableDigestDeduplication bool
	HistoryStep               *Int64Scalar
	DistributedID             *string
	ClientMutationId          *string
	TtlDurationSeconds        *Int64Scalar
	Tags                      *[]tagInput
	StorageRegion             *string
}

type artifactAliasInput struct {
	Alias                  string
	ArtifactCollectionName string
}

type tagInput struct {
	TagName         string
	TagCategoryName *string
	Attributes      *string
}

type createArtifactManifestInput struct {
	ArtifactID     gql.ID
	BaseArtifactID *gql.ID
	Name           string
	Digest         string
	EntityName     string
	ProjectName    string
	RunName        string
	Type           string
	IncludeUpload  *bool
}

type createArtifactFilesInput struct {
	ArtifactFiles []createArtifactFileSpecInput
	StorageLayout string
}

type createArtifactFileSpecInput struct {
	ArtifactID         gql.ID
	ArtifactManifestID *gql.ID
	Name               string
	Md5                string
	Mimetype           *string
	UploadPartsInput   *[]uploadPartsInput
}

type uploadPartsInput struct {
	HexMD5     string
	PartNumber Int64Scalar
}

type completeMultipartUploadArtifactInput struct {
	CompleteMultipartAction string
	CompletedParts          []uploadPartsInput
	ArtifactID              gql.ID
	StoragePath             string
	UploadID                string
}

type updateArtifactManifestInput struct {
	ArtifactManifestID gql.ID
	Digest             *string
	BaseArtifactID     *gql.ID
}

type commitArtifactInput struct {
	ArtifactID gql.ID
}

type useArtifactInput struct {
	EntityName          string
	ProjectName         string
	RunName             string
	ArtifactID          gql.ID
	UsedAs              *string
	ClientMutationId    *string
	ArtifactEntityName  *string
	ArtifactProjectName *string
}

type updateArtifactInput struct {
	ArtifactID         gql.ID
	Description        *string
	Metadata           *JSONString
	Aliases            *[]artifactAliasInput
	TtlDurationSeconds *Int64Scalar
	Tags               *[]tagInput
}

type addAliasesInput struct {
	ArtifactID gql.ID
	Aliases    []artifactAliasInput
}

type deleteAliasesInput struct {
	ArtifactID gql.ID
	Aliases    []artifactAliasInput
}

type linkArtifactInput struct {
	ArtifactPortfolioName string
	EntityName            string
	ProjectName           string
	ArtifactID            *gql.ID
	ClientID              *gql.ID
	Aliases               *[]artifactAliasInput
}

type unlinkArtifactInput struct {
	ArtifactID    gql.ID
	PortfolioName string
	EntityName    string
	ProjectName   string
}

type deleteArtifactInput struct {
	ArtifactID    gql.ID
	DeleteAliases *bool
}

type deleteArtifactSequenceInput struct {
	ArtifactSequenceID gql.ID
}

type deleteArtifactPortfolioInput struct {
	ArtifactPortfolioID gql.ID
}

type updateArtifactSequenceInput struct {
	ArtifactSequenceID gql.ID
	Name               *string
	Description        *string
	Tags               *[]tagInput
}

type updateArtifactPortfolioInput struct {
	ArtifactPortfolioID gql.ID
	Name                *string
	Description         *string
}

type moveArtifactSequenceInput struct {
	ArtifactSequenceID          gql.ID
	DestinationArtifactTypeName string
}

type createArtifactTypeInput struct {
	EntityName  string
	ProjectName string
	Name        string
	Description *string
}

type createArtifactCollectionTagAssignmentsInput struct {
	ArtifactCollectionID gql.ID
	Tags                 []tagInput
}

type deleteArtifactCollectionTagAssignmentsInput struct {
	ArtifactCollectionID gql.ID
	Tags                 []tagInput
}

// ─── Mutation payload resolvers ──────────────────────────────────

type createArtifactPayloadResolver struct{ a *ArtifactResolver }

func (r *createArtifactPayloadResolver) Artifact() *ArtifactResolver { return r.a }

type createArtifactManifestPayloadResolver struct{ m *ArtifactManifestResolver }

func (r *createArtifactManifestPayloadResolver) ArtifactManifest() *ArtifactManifestResolver {
	return r.m
}

type createArtifactFilesPayloadResolver struct{ fc *FileConnectionResolver }

func (r *createArtifactFilesPayloadResolver) Files() *FileConnectionResolver { return r.fc }

type completeMultipartUploadArtifactPayloadResolver struct{ d *string }

func (r *completeMultipartUploadArtifactPayloadResolver) Digest() *string { return r.d }

type updateArtifactManifestPayloadResolver struct{ m *ArtifactManifestResolver }

func (r *updateArtifactManifestPayloadResolver) ArtifactManifest() *ArtifactManifestResolver {
	return r.m
}

type commitArtifactPayloadResolver struct{ a *ArtifactResolver }

func (r *commitArtifactPayloadResolver) Artifact() *ArtifactResolver { return r.a }

type useArtifactPayloadResolver struct{ a *ArtifactResolver }

func (r *useArtifactPayloadResolver) Artifact() *ArtifactResolver { return r.a }

type updateArtifactPayloadResolver struct{ a *ArtifactResolver }

func (r *updateArtifactPayloadResolver) Artifact() *ArtifactResolver { return r.a }

type addAliasesPayloadResolver struct{ ok bool }

func (r *addAliasesPayloadResolver) Success() bool { return r.ok }

type deleteAliasesPayloadResolver struct{ ok bool }

func (r *deleteAliasesPayloadResolver) Success() bool { return r.ok }

type linkArtifactPayloadResolver struct {
	versionIndex int32
}

func (r *linkArtifactPayloadResolver) VersionIndex() *int32 { return &r.versionIndex }
func (r *linkArtifactPayloadResolver) ArtifactMembership() *ArtifactCollectionMembershipResolver {
	return nil
}

type unlinkArtifactPayloadResolver struct{ ok bool }

func (r *unlinkArtifactPayloadResolver) Success() bool { return r.ok }

type deleteArtifactPayloadResolver struct{ a *ArtifactResolver }

func (r *deleteArtifactPayloadResolver) Artifact() *ArtifactResolver { return r.a }

type deleteArtifactSequencePayloadResolver struct{ c *ArtifactCollectionResolver }

func (r *deleteArtifactSequencePayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return r.c
}

type deleteArtifactPortfolioPayloadResolver struct{ c *ArtifactCollectionResolver }

func (r *deleteArtifactPortfolioPayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return r.c
}

type updateArtifactSequencePayloadResolver struct{ c *ArtifactCollectionResolver }

func (r *updateArtifactSequencePayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return r.c
}

type updateArtifactPortfolioPayloadResolver struct{ c *ArtifactCollectionResolver }

func (r *updateArtifactPortfolioPayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return r.c
}

type moveArtifactSequencePayloadResolver struct{ c *ArtifactCollectionResolver }

func (r *moveArtifactSequencePayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return r.c
}

type createArtifactTypePayloadResolver struct{ t *ArtifactTypeResolver }

func (r *createArtifactTypePayloadResolver) ArtifactType() *ArtifactTypeResolver { return r.t }

type createArtifactCollectionTagAssignmentsPayloadResolver struct {
	tags []*TagResolver
}

func (r *createArtifactCollectionTagAssignmentsPayloadResolver) Tags() *[]*TagResolver {
	return &r.tags
}

type deleteArtifactCollectionTagAssignmentsPayloadResolver struct{ ok bool }

func (r *deleteArtifactCollectionTagAssignmentsPayloadResolver) Success() bool { return r.ok }

// ─── Implemented mutations ───────────────────────────────────────

func (r *Resolver) CreateArtifact(args struct{ Input createArtifactInput }) (*createArtifactPayloadResolver, error) {
	in := args.Input

	// Resolve project.
	project, err := store.GetProjectByEntityAndName(r.db, in.EntityName, in.ProjectName)
	if err != nil {
		// Auto-create project if needed.
		var entity store.Entity
		if err := r.db.Where("name = ?", in.EntityName).First(&entity).Error; err != nil {
			return nil, fmt.Errorf("entity %q not found: %w", in.EntityName, err)
		}
		var user store.User
		r.db.Where("default_entity_id = ?", entity.ID).First(&user)
		project, err = store.GetOrCreateProject(r.db, in.EntityName, in.ProjectName, user.ID)
		if err != nil {
			return nil, err
		}
	}

	// Resolve or create run if provided.
	var runID *string
	if in.RunName != nil && *in.RunName != "" {
		run, err := store.GetRunByName(r.db, project.ID, *in.RunName)
		if err != nil {
			return nil, fmt.Errorf("run %q not found: %w", *in.RunName, err)
		}
		runID = &run.ID
	}

	// Auto-create type and collection.
	artType, err := store.GetOrCreateArtifactType(r.db, project.ID, in.ArtifactTypeName)
	if err != nil {
		return nil, err
	}

	desc := ""
	if in.Description != nil {
		desc = *in.Description
	}

	coll, err := store.GetOrCreateArtifactCollection(r.db, project.ID, artType.ID, in.ArtifactCollectionName, desc)
	if err != nil {
		return nil, err
	}

	// Build metadata bytes.
	var metadata []byte
	if in.Metadata != nil {
		metadata = []byte(in.Metadata.Value)
	}

	var ttl *int64
	if in.TtlDurationSeconds != nil {
		v := int64(*in.TtlDurationSeconds)
		ttl = &v
	}
	var histStep *int64
	if in.HistoryStep != nil {
		v := int64(*in.HistoryStep)
		histStep = &v
	}
	distID := ""
	if in.DistributedID != nil {
		distID = *in.DistributedID
	}

	art, _, err := store.CreateArtifact(r.db, store.CreateArtifactInput{
		CollectionID:       coll.ID,
		Digest:             in.Digest,
		Description:        desc,
		Metadata:           metadata,
		CreatedByRunID:     runID,
		ClientID:           in.ClientID,
		SequenceClientID:   in.SequenceClientID,
		DistributedID:      distID,
		TtlDurationSeconds: ttl,
		HistoryStep:        histStep,
	})
	if err != nil {
		return nil, err
	}

	return &createArtifactPayloadResolver{
		a: &ArtifactResolver{artifact: art, db: r.db},
	}, nil
}

func (r *Resolver) CreateArtifactManifest(args struct{ Input createArtifactManifestInput }) (*createArtifactManifestPayloadResolver, error) {
	in := args.Input
	artifactID := string(in.ArtifactID)

	var baseID *string
	if in.BaseArtifactID != nil {
		s := string(*in.BaseArtifactID)
		baseID = &s
	}

	manifest, err := store.CreateArtifactManifestRecord(r.db, artifactID, in.Type, in.Digest, baseID)
	if err != nil {
		return nil, err
	}

	// If includeUpload is true (or not specified — SDK often omits it on first call),
	// create a file record for the manifest itself so it has an uploadUrl.
	includeUpload := true
	if in.IncludeUpload != nil {
		includeUpload = *in.IncludeUpload
	}

	if includeUpload && r.store != nil {
		storagePath := r.store.StoragePath(artifactID, in.Name)
		uploadURL := r.store.UploadURL(storagePath)
		directURL := r.store.DirectURL(storagePath)
		file, err := store.CreateArtifactFileRecord(r.db, artifactID, in.Name, storagePath, "", uploadURL, directURL)
		if err != nil {
			return nil, err
		}
		manifest.FileID = &file.ID
		r.db.Model(manifest).Update("file_id", file.ID)
	}

	return &createArtifactManifestPayloadResolver{
		m: &ArtifactManifestResolver{manifest: manifest, db: r.db},
	}, nil
}

func (r *Resolver) CreateArtifactFiles(args struct{ Input createArtifactFilesInput }) (*createArtifactFilesPayloadResolver, error) {
	in := args.Input
	edges := make([]*FileEdgeResolver, 0, len(in.ArtifactFiles))

	for _, spec := range in.ArtifactFiles {
		artifactID := string(spec.ArtifactID)
		storagePath := ""
		uploadURL := ""
		directURL := ""

		if r.store != nil {
			storagePath = r.store.StoragePath(artifactID, spec.Name)
			uploadURL = r.store.UploadURL(storagePath)
			directURL = r.store.DirectURL(storagePath)
		}

		file, err := store.CreateArtifactFileRecord(r.db, artifactID, spec.Name, storagePath, spec.Md5, uploadURL, directURL)
		if err != nil {
			return nil, err
		}

		edges = append(edges, &FileEdgeResolver{
			node: &FileResolver{file: file, db: r.db},
		})
	}

	return &createArtifactFilesPayloadResolver{
		fc: &FileConnectionResolver{edges: edges},
	}, nil
}

func (r *Resolver) CompleteMultipartUploadArtifact(args struct {
	Input completeMultipartUploadArtifactInput
}) (*completeMultipartUploadArtifactPayloadResolver, error) {
	// For local storage, multipart is not needed. Just acknowledge.
	return &completeMultipartUploadArtifactPayloadResolver{}, nil
}

func (r *Resolver) UpdateArtifactManifest(args struct{ Input updateArtifactManifestInput }) (*updateArtifactManifestPayloadResolver, error) {
	in := args.Input
	manifestID := string(in.ArtifactManifestID)

	var digest *string
	if in.Digest != nil {
		digest = in.Digest
	}

	// Look up the manifest to get the artifact ID for storage path.
	var existingManifest store.ArtifactManifest
	if err := r.db.First(&existingManifest, "id = ?", manifestID).Error; err != nil {
		return nil, err
	}

	// Create/update the file record for the manifest so the SDK can upload it.
	var fileID *string
	if r.store != nil {
		// Look up the existing file record or create a new one.
		var existingFile store.ArtifactFileStored
		if existingManifest.FileID != nil {
			if err := r.db.First(&existingFile, "id = ?", *existingManifest.FileID).Error; err == nil {
				// Update the upload URL (it may have changed).
				uploadURL := r.store.UploadURL(existingFile.StoragePath)
				r.db.Model(&existingFile).Update("upload_url", uploadURL)
				fileID = &existingFile.ID
			}
		}
		if fileID == nil {
			// Need to determine manifest filename.
			manifestName := "wandb_manifest.json"
			storagePath := r.store.StoragePath(existingManifest.ArtifactID, manifestName)
			uploadURL := r.store.UploadURL(storagePath)
			directURL := r.store.DirectURL(storagePath)
			file, err := store.CreateArtifactFileRecord(r.db, existingManifest.ArtifactID, manifestName, storagePath, "", uploadURL, directURL)
			if err != nil {
				return nil, err
			}
			fileID = &file.ID
		}
	}

	manifest, err := store.UpdateManifestDigest(r.db, manifestID, digest, fileID)
	if err != nil {
		return nil, err
	}

	return &updateArtifactManifestPayloadResolver{
		m: &ArtifactManifestResolver{manifest: manifest, db: r.db},
	}, nil
}

func (r *Resolver) CommitArtifact(args struct{ Input commitArtifactInput }) (*commitArtifactPayloadResolver, error) {
	art, err := store.CommitArtifact(r.db, string(args.Input.ArtifactID))
	if err != nil {
		return nil, err
	}
	return &commitArtifactPayloadResolver{
		a: &ArtifactResolver{artifact: art, db: r.db},
	}, nil
}

func (r *Resolver) UseArtifact(args struct{ Input useArtifactInput }) (*useArtifactPayloadResolver, error) {
	in := args.Input

	// Resolve the run.
	run, err := store.GetRunByEntityProjectName(r.db, in.EntityName, in.ProjectName, in.RunName)
	if err != nil {
		return nil, fmt.Errorf("run not found: %w", err)
	}

	artifactID := string(in.ArtifactID)
	_ = store.CreateArtifactUsage(r.db, run.ID, artifactID, "input")

	var art store.Artifact
	if err := r.db.First(&art, "id = ?", artifactID).Error; err != nil {
		return nil, err
	}

	return &useArtifactPayloadResolver{
		a: &ArtifactResolver{artifact: &art, db: r.db},
	}, nil
}

func (r *Resolver) UpdateArtifact(args struct{ Input updateArtifactInput }) (*updateArtifactPayloadResolver, error) {
	in := args.Input
	id := string(in.ArtifactID)

	// Look up the artifact.
	var art store.Artifact
	if err := r.db.First(&art, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("artifact %q not found: %w", id, err)
	}

	// Build update map for scalar fields.
	updates := map[string]interface{}{}
	if in.Description != nil {
		updates["description"] = *in.Description
	}
	if in.Metadata != nil {
		updates["metadata"] = []byte(in.Metadata.Value)
	}
	if in.TtlDurationSeconds != nil {
		v := int64(*in.TtlDurationSeconds)
		updates["ttl_duration_seconds"] = &v
	}

	if len(updates) > 0 {
		if err := r.db.Model(&art).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("failed to update artifact: %w", err)
		}
	}

	// Sync aliases if provided.
	if in.Aliases != nil {
		// Load the artifact's collection to get the project ID.
		var coll store.ArtifactCollection
		if err := r.db.First(&coll, "id = ?", art.CollectionID).Error; err != nil {
			return nil, fmt.Errorf("artifact collection not found: %w", err)
		}

		// Delete existing user-managed aliases (not "latest" and not "vN").
		var existingAliases []store.ArtifactAlias
		r.db.Where("artifact_id = ?", art.ID).Find(&existingAliases)
		for _, a := range existingAliases {
			if a.Alias == "latest" || versionAliasRe.MatchString(a.Alias) {
				continue
			}
			r.db.Delete(&a)
		}

		// Create new aliases from input.
		for _, ai := range *in.Aliases {
			// Skip auto-managed aliases in input.
			if ai.Alias == "latest" || versionAliasRe.MatchString(ai.Alias) {
				continue
			}

			// Resolve collection by name within the same project.
			var targetColl store.ArtifactCollection
			if err := r.db.Where("project_id = ? AND name = ?", coll.ProjectID, ai.ArtifactCollectionName).First(&targetColl).Error; err != nil {
				return nil, fmt.Errorf("collection %q not found in project: %w", ai.ArtifactCollectionName, err)
			}

			r.db.Create(&store.ArtifactAlias{
				ArtifactID:   art.ID,
				CollectionID: targetColl.ID,
				Alias:        ai.Alias,
			})
		}
	}

	// Reload the artifact to pick up all changes.
	if err := r.db.First(&art, "id = ?", id).Error; err != nil {
		return nil, err
	}

	return &updateArtifactPayloadResolver{
		a: &ArtifactResolver{artifact: &art, db: r.db},
	}, nil
}

func (r *Resolver) AddAliases(args struct{ Input addAliasesInput }) (*addAliasesPayloadResolver, error) {
	artID := string(args.Input.ArtifactID)

	// Look up the artifact.
	var art store.Artifact
	if err := r.db.First(&art, "id = ?", artID).Error; err != nil {
		return nil, fmt.Errorf("artifact %q not found: %w", artID, err)
	}

	// Get the artifact's collection to find the project ID.
	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ?", art.CollectionID).Error; err != nil {
		return nil, fmt.Errorf("artifact collection not found: %w", err)
	}

	for _, ai := range args.Input.Aliases {
		// Reject manually adding "latest" alias.
		if ai.Alias == "latest" {
			return nil, fmt.Errorf("cannot manually add the \"latest\" alias; it is auto-managed")
		}

		// Resolve the target collection by name within the same project.
		var targetColl store.ArtifactCollection
		if err := r.db.Where("project_id = ? AND name = ?", coll.ProjectID, ai.ArtifactCollectionName).First(&targetColl).Error; err != nil {
			return nil, fmt.Errorf("collection %q not found in project: %w", ai.ArtifactCollectionName, err)
		}

		// Check if alias already exists (idempotent).
		var existing store.ArtifactAlias
		err := r.db.Where("artifact_id = ? AND collection_id = ? AND alias = ?", artID, targetColl.ID, ai.Alias).First(&existing).Error
		if err == nil {
			continue // already exists
		}
		if err != gorm.ErrRecordNotFound {
			return nil, err
		}

		// Create the alias.
		if err := r.db.Create(&store.ArtifactAlias{
			ArtifactID:   artID,
			CollectionID: targetColl.ID,
			Alias:        ai.Alias,
		}).Error; err != nil {
			return nil, fmt.Errorf("failed to create alias %q: %w", ai.Alias, err)
		}
	}

	return &addAliasesPayloadResolver{ok: true}, nil
}

func (r *Resolver) DeleteAliases(args struct{ Input deleteAliasesInput }) (*deleteAliasesPayloadResolver, error) {
	artID := string(args.Input.ArtifactID)

	// Look up the artifact to get the project ID via its collection.
	var art store.Artifact
	if err := r.db.First(&art, "id = ?", artID).Error; err != nil {
		return nil, fmt.Errorf("artifact %q not found: %w", artID, err)
	}

	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ?", art.CollectionID).Error; err != nil {
		return nil, fmt.Errorf("artifact collection not found: %w", err)
	}

	for _, ai := range args.Input.Aliases {
		// Resolve the target collection by name within the same project.
		var targetColl store.ArtifactCollection
		if err := r.db.Where("project_id = ? AND name = ?", coll.ProjectID, ai.ArtifactCollectionName).First(&targetColl).Error; err != nil {
			// If collection doesn't exist, nothing to delete.
			continue
		}

		// Delete the alias if it exists.
		r.db.Where("artifact_id = ? AND collection_id = ? AND alias = ?", artID, targetColl.ID, ai.Alias).Delete(&store.ArtifactAlias{})
	}

	return &deleteAliasesPayloadResolver{ok: true}, nil
}

func (r *Resolver) LinkArtifact(args struct{ Input linkArtifactInput }) (*linkArtifactPayloadResolver, error) {
	in := args.Input

	// Resolve project.
	project, err := store.GetProjectByEntityAndName(r.db, in.EntityName, in.ProjectName)
	if err != nil {
		return nil, fmt.Errorf("project %q/%q not found: %w", in.EntityName, in.ProjectName, err)
	}

	// Find or create the portfolio collection.
	// We need an artifact type for the portfolio; use a generic "portfolio" type.
	artType, err := store.GetOrCreateArtifactType(r.db, project.ID, "portfolio")
	if err != nil {
		return nil, err
	}

	var portfolio store.ArtifactCollection
	err = r.db.Where("project_id = ? AND name = ?", project.ID, in.ArtifactPortfolioName).First(&portfolio).Error
	if err == gorm.ErrRecordNotFound {
		portfolio = store.ArtifactCollection{
			Name:           in.ArtifactPortfolioName,
			Type:           "portfolio",
			ArtifactTypeID: artType.ID,
			ProjectID:      project.ID,
			State:          "active",
		}
		if err := r.db.Create(&portfolio).Error; err != nil {
			// Race: try fetch again.
			if err2 := r.db.Where("project_id = ? AND name = ?", project.ID, in.ArtifactPortfolioName).First(&portfolio).Error; err2 != nil {
				return nil, fmt.Errorf("create portfolio: %w", err)
			}
		}
	} else if err != nil {
		return nil, err
	}

	// Resolve the artifact by ArtifactID or ClientID.
	var art store.Artifact
	if in.ArtifactID != nil {
		if err := r.db.First(&art, "id = ?", string(*in.ArtifactID)).Error; err != nil {
			return nil, fmt.Errorf("artifact %q not found: %w", string(*in.ArtifactID), err)
		}
	} else if in.ClientID != nil {
		a, err := store.GetArtifactByClientID(r.db, string(*in.ClientID))
		if err != nil {
			return nil, fmt.Errorf("artifact with clientID %q not found: %w", string(*in.ClientID), err)
		}
		art = *a
	} else {
		return nil, fmt.Errorf("either artifactID or clientID must be provided")
	}

	// Create a "linked" alias in the portfolio pointing to the artifact.
	// Use "v{N}" style alias based on how many artifacts are already linked.
	var linkedCount int64
	r.db.Model(&store.ArtifactAlias{}).Where("collection_id = ?", portfolio.ID).Count(&linkedCount)
	linkAlias := fmt.Sprintf("v%d", linkedCount)

	// Check if this artifact is already linked (idempotent).
	var existing store.ArtifactAlias
	err = r.db.Where("collection_id = ? AND artifact_id = ? AND alias = ?", portfolio.ID, art.ID, linkAlias).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		r.db.Create(&store.ArtifactAlias{
			ArtifactID:   art.ID,
			CollectionID: portfolio.ID,
			Alias:        linkAlias,
		})
	}

	// Create additional aliases if provided.
	if in.Aliases != nil {
		for _, ai := range *in.Aliases {
			var existingAlias store.ArtifactAlias
			err := r.db.Where("collection_id = ? AND alias = ?", portfolio.ID, ai.Alias).First(&existingAlias).Error
			if err == gorm.ErrRecordNotFound {
				r.db.Create(&store.ArtifactAlias{
					ArtifactID:   art.ID,
					CollectionID: portfolio.ID,
					Alias:        ai.Alias,
				})
			} else if err == nil {
				// Update existing alias to point to new artifact.
				r.db.Model(&existingAlias).Update("artifact_id", art.ID)
			}
		}
	}

	return &linkArtifactPayloadResolver{versionIndex: safeInt64ToInt32(linkedCount)}, nil
}

func (r *Resolver) UnlinkArtifact(args struct{ Input unlinkArtifactInput }) (*unlinkArtifactPayloadResolver, error) {
	in := args.Input

	// Resolve project.
	project, err := store.GetProjectByEntityAndName(r.db, in.EntityName, in.ProjectName)
	if err != nil {
		return nil, fmt.Errorf("project %q/%q not found: %w", in.EntityName, in.ProjectName, err)
	}

	// Find the portfolio.
	var portfolio store.ArtifactCollection
	if err := r.db.Where("project_id = ? AND name = ? AND type = ?", project.ID, in.PortfolioName, "portfolio").First(&portfolio).Error; err != nil {
		return nil, fmt.Errorf("portfolio %q not found: %w", in.PortfolioName, err)
	}

	// Delete all aliases in this portfolio that point to the given artifact.
	artID := string(in.ArtifactID)
	if err := r.db.Where("collection_id = ? AND artifact_id = ?", portfolio.ID, artID).Delete(&store.ArtifactAlias{}).Error; err != nil {
		return nil, fmt.Errorf("failed to unlink artifact: %w", err)
	}

	return &unlinkArtifactPayloadResolver{ok: true}, nil
}

func (r *Resolver) DeleteArtifact(args struct{ Input deleteArtifactInput }) (*deleteArtifactPayloadResolver, error) {
	artID := string(args.Input.ArtifactID)

	var art store.Artifact
	if err := r.db.First(&art, "id = ?", artID).Error; err != nil {
		return nil, fmt.Errorf("artifact %q not found: %w", artID, err)
	}

	// Default deleteAliases to true when nil.
	deleteAliases := true
	if args.Input.DeleteAliases != nil {
		deleteAliases = *args.Input.DeleteAliases
	}

	if deleteAliases {
		if err := r.db.Where("artifact_id = ?", artID).Delete(&store.ArtifactAlias{}).Error; err != nil {
			return nil, fmt.Errorf("failed to delete aliases: %w", err)
		}
	}

	art.State = "DELETED"
	if err := r.db.Save(&art).Error; err != nil {
		return nil, fmt.Errorf("failed to delete artifact: %w", err)
	}

	return &deleteArtifactPayloadResolver{
		a: &ArtifactResolver{artifact: &art, db: r.db},
	}, nil
}

func (r *Resolver) DeleteArtifactSequence(args struct{ Input deleteArtifactSequenceInput }) (*deleteArtifactSequencePayloadResolver, error) {
	collID := string(args.Input.ArtifactSequenceID)

	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ? AND type = ?", collID, "sequence").Error; err != nil {
		return nil, fmt.Errorf("artifact sequence %q not found: %w", collID, err)
	}

	coll.State = "deleted"
	if err := r.db.Save(&coll).Error; err != nil {
		return nil, fmt.Errorf("failed to delete artifact sequence: %w", err)
	}

	return &deleteArtifactSequencePayloadResolver{
		c: &ArtifactCollectionResolver{coll: &coll, db: r.db},
	}, nil
}

func (r *Resolver) DeleteArtifactPortfolio(args struct{ Input deleteArtifactPortfolioInput }) (*deleteArtifactPortfolioPayloadResolver, error) {
	collID := string(args.Input.ArtifactPortfolioID)

	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ? AND type = ?", collID, "portfolio").Error; err != nil {
		return nil, fmt.Errorf("artifact portfolio %q not found: %w", collID, err)
	}

	coll.State = "deleted"
	if err := r.db.Save(&coll).Error; err != nil {
		return nil, fmt.Errorf("failed to delete artifact portfolio: %w", err)
	}

	return &deleteArtifactPortfolioPayloadResolver{
		c: &ArtifactCollectionResolver{coll: &coll, db: r.db},
	}, nil
}

func (r *Resolver) UpdateArtifactSequence(args struct{ Input updateArtifactSequenceInput }) (*updateArtifactSequencePayloadResolver, error) {
	in := args.Input
	collID := string(in.ArtifactSequenceID)

	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ?", collID).Error; err != nil {
		return nil, fmt.Errorf("artifact sequence %q not found: %w", collID, err)
	}

	updates := map[string]interface{}{}
	if in.Name != nil {
		updates["name"] = *in.Name
	}
	if in.Description != nil {
		updates["description"] = *in.Description
	}
	if len(updates) > 0 {
		if err := r.db.Model(&coll).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("failed to update sequence: %w", err)
		}
	}

	// Sync tags if provided.
	if in.Tags != nil {
		// Clear existing tag assignments.
		r.db.Where("collection_id = ?", coll.ID).Delete(&store.ArtifactCollectionTag{})

		for _, ti := range *in.Tags {
			tag, err := getOrCreateTag(r.db, ti.TagName)
			if err != nil {
				return nil, err
			}
			r.db.Create(&store.ArtifactCollectionTag{
				CollectionID: coll.ID,
				TagID:        tag.ID,
			})
		}
	}

	// Reload.
	if err := r.db.First(&coll, "id = ?", collID).Error; err != nil {
		return nil, err
	}

	return &updateArtifactSequencePayloadResolver{
		c: &ArtifactCollectionResolver{coll: &coll, db: r.db},
	}, nil
}

func (r *Resolver) UpdateArtifactPortfolio(args struct{ Input updateArtifactPortfolioInput }) (*updateArtifactPortfolioPayloadResolver, error) {
	in := args.Input
	collID := string(in.ArtifactPortfolioID)

	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ? AND type = ?", collID, "portfolio").Error; err != nil {
		return nil, fmt.Errorf("artifact portfolio %q not found: %w", collID, err)
	}

	updates := map[string]interface{}{}
	if in.Name != nil {
		updates["name"] = *in.Name
	}
	if in.Description != nil {
		updates["description"] = *in.Description
	}
	if len(updates) > 0 {
		if err := r.db.Model(&coll).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("failed to update portfolio: %w", err)
		}
	}

	// Reload.
	if err := r.db.First(&coll, "id = ?", collID).Error; err != nil {
		return nil, err
	}

	return &updateArtifactPortfolioPayloadResolver{
		c: &ArtifactCollectionResolver{coll: &coll, db: r.db},
	}, nil
}

func (r *Resolver) MoveArtifactSequence(args struct{ Input moveArtifactSequenceInput }) (*moveArtifactSequencePayloadResolver, error) {
	in := args.Input
	collID := string(in.ArtifactSequenceID)

	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ?", collID).Error; err != nil {
		return nil, fmt.Errorf("artifact sequence %q not found: %w", collID, err)
	}

	// Look up or create the destination artifact type within the same project.
	destType, err := store.GetOrCreateArtifactType(r.db, coll.ProjectID, in.DestinationArtifactTypeName)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve destination type: %w", err)
	}

	if err := r.db.Model(&coll).Update("artifact_type_id", destType.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to move sequence: %w", err)
	}
	coll.ArtifactTypeID = destType.ID

	return &moveArtifactSequencePayloadResolver{
		c: &ArtifactCollectionResolver{coll: &coll, db: r.db},
	}, nil
}

func (r *Resolver) CreateArtifactType(args struct{ Input createArtifactTypeInput }) (*createArtifactTypePayloadResolver, error) {
	in := args.Input
	project, err := store.GetProjectByEntityAndName(r.db, in.EntityName, in.ProjectName)
	if err != nil {
		return nil, err
	}
	artType, err := store.GetOrCreateArtifactType(r.db, project.ID, in.Name)
	if err != nil {
		return nil, err
	}
	return &createArtifactTypePayloadResolver{
		t: &ArtifactTypeResolver{artType: artType, db: r.db},
	}, nil
}

func (r *Resolver) CreateArtifactCollectionTagAssignments(args struct {
	Input createArtifactCollectionTagAssignmentsInput
}) (*createArtifactCollectionTagAssignmentsPayloadResolver, error) {
	collID := string(args.Input.ArtifactCollectionID)

	// Verify collection exists.
	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ?", collID).Error; err != nil {
		return nil, fmt.Errorf("collection %q not found: %w", collID, err)
	}

	var tagResolvers []*TagResolver
	for _, ti := range args.Input.Tags {
		tag, err := getOrCreateTag(r.db, ti.TagName)
		if err != nil {
			return nil, err
		}

		// Create join record (ignore duplicate).
		r.db.FirstOrCreate(&store.ArtifactCollectionTag{
			CollectionID: collID,
			TagID:        tag.ID,
		}, store.ArtifactCollectionTag{CollectionID: collID, TagID: tag.ID})

		tagResolvers = append(tagResolvers, &TagResolver{tag: tag})
	}

	return &createArtifactCollectionTagAssignmentsPayloadResolver{tags: tagResolvers}, nil
}

func (r *Resolver) DeleteArtifactCollectionTagAssignments(args struct {
	Input deleteArtifactCollectionTagAssignmentsInput
}) (*deleteArtifactCollectionTagAssignmentsPayloadResolver, error) {
	collID := string(args.Input.ArtifactCollectionID)

	for _, ti := range args.Input.Tags {
		var tag store.Tag
		if err := r.db.Where("name = ?", ti.TagName).First(&tag).Error; err != nil {
			continue // tag doesn't exist, nothing to delete
		}
		r.db.Where("collection_id = ? AND tag_id = ?", collID, tag.ID).Delete(&store.ArtifactCollectionTag{})
	}

	return &deleteArtifactCollectionTagAssignmentsPayloadResolver{ok: true}, nil
}

// getOrCreateTag finds or creates a Tag by name.
func getOrCreateTag(db *gorm.DB, name string) (*store.Tag, error) {
	var tag store.Tag
	if err := db.Where("name = ?", name).First(&tag).Error; err == nil {
		return &tag, nil
	}
	tag = store.Tag{Name: name}
	if err := db.Create(&tag).Error; err != nil {
		// Race: try fetch again.
		if err2 := db.Where("name = ?", name).First(&tag).Error; err2 != nil {
			return nil, fmt.Errorf("create tag: %w", err)
		}
	}
	return &tag, nil
}

func errNotImplemented(name string) error {
	return &notImplementedError{mutation: name}
}

type notImplementedError struct {
	mutation string
}

func (e *notImplementedError) Error() string {
	return e.mutation + " is not yet implemented"
}
