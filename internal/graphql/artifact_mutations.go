package graphql

import (
	"fmt"

	gql "github.com/graph-gophers/graphql-go"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

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
	ArtifactCollectionNames   []string
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

type linkArtifactPayloadResolver struct{}

func (r *linkArtifactPayloadResolver) VersionIndex() *int32 { return nil }
func (r *linkArtifactPayloadResolver) ArtifactMembership() *ArtifactCollectionMembershipResolver {
	return nil
}

type unlinkArtifactPayloadResolver struct{}

func (r *unlinkArtifactPayloadResolver) Success() bool { return false }

type deleteArtifactPayloadResolver struct{ a *ArtifactResolver }

func (r *deleteArtifactPayloadResolver) Artifact() *ArtifactResolver { return r.a }

type deleteArtifactSequencePayloadResolver struct{}

func (r *deleteArtifactSequencePayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return nil
}

type deleteArtifactPortfolioPayloadResolver struct{}

func (r *deleteArtifactPortfolioPayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return nil
}

type updateArtifactSequencePayloadResolver struct{ c *ArtifactCollectionResolver }

func (r *updateArtifactSequencePayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return r.c
}

type updateArtifactPortfolioPayloadResolver struct{}

func (r *updateArtifactPortfolioPayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return nil
}

type moveArtifactSequencePayloadResolver struct{}

func (r *moveArtifactSequencePayloadResolver) ArtifactCollection() *ArtifactCollectionResolver {
	return nil
}

type createArtifactTypePayloadResolver struct{ t *ArtifactTypeResolver }

func (r *createArtifactTypePayloadResolver) ArtifactType() *ArtifactTypeResolver { return r.t }

type createArtifactCollectionTagAssignmentsPayloadResolver struct{}

func (r *createArtifactCollectionTagAssignmentsPayloadResolver) Tags() *[]*TagResolver {
	empty := make([]*TagResolver, 0)
	return &empty
}

type deleteArtifactCollectionTagAssignmentsPayloadResolver struct{}

func (r *deleteArtifactCollectionTagAssignmentsPayloadResolver) Success() bool { return false }

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
	return nil, errNotImplemented("updateArtifact")
}

func (r *Resolver) AddAliases(args struct{ Input addAliasesInput }) (*addAliasesPayloadResolver, error) {
	return nil, errNotImplemented("addAliases")
}

func (r *Resolver) DeleteAliases(args struct{ Input deleteAliasesInput }) (*deleteAliasesPayloadResolver, error) {
	return nil, errNotImplemented("deleteAliases")
}

func (r *Resolver) LinkArtifact(args struct{ Input linkArtifactInput }) (*linkArtifactPayloadResolver, error) {
	return nil, errNotImplemented("linkArtifact")
}

func (r *Resolver) UnlinkArtifact(args struct{ Input unlinkArtifactInput }) (*unlinkArtifactPayloadResolver, error) {
	return nil, errNotImplemented("unlinkArtifact")
}

func (r *Resolver) DeleteArtifact(args struct{ Input deleteArtifactInput }) (*deleteArtifactPayloadResolver, error) {
	return nil, errNotImplemented("deleteArtifact")
}

func (r *Resolver) DeleteArtifactSequence(args struct{ Input deleteArtifactSequenceInput }) (*deleteArtifactSequencePayloadResolver, error) {
	return nil, errNotImplemented("deleteArtifactSequence")
}

func (r *Resolver) DeleteArtifactPortfolio(args struct{ Input deleteArtifactPortfolioInput }) (*deleteArtifactPortfolioPayloadResolver, error) {
	return nil, errNotImplemented("deleteArtifactPortfolio")
}

func (r *Resolver) UpdateArtifactSequence(args struct{ Input updateArtifactSequenceInput }) (*updateArtifactSequencePayloadResolver, error) {
	return nil, errNotImplemented("updateArtifactSequence")
}

func (r *Resolver) UpdateArtifactPortfolio(args struct{ Input updateArtifactPortfolioInput }) (*updateArtifactPortfolioPayloadResolver, error) {
	return nil, errNotImplemented("updateArtifactPortfolio")
}

func (r *Resolver) MoveArtifactSequence(args struct{ Input moveArtifactSequenceInput }) (*moveArtifactSequencePayloadResolver, error) {
	return nil, errNotImplemented("moveArtifactSequence")
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
	return nil, errNotImplemented("createArtifactCollectionTagAssignments")
}

func (r *Resolver) DeleteArtifactCollectionTagAssignments(args struct {
	Input deleteArtifactCollectionTagAssignmentsInput
}) (*deleteArtifactCollectionTagAssignmentsPayloadResolver, error) {
	return nil, errNotImplemented("deleteArtifactCollectionTagAssignments")
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
