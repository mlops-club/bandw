package graphql

import (
	gql "github.com/graph-gophers/graphql-go"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// ─── ArtifactResolver ────────────────────────────────────────────

type ArtifactResolver struct {
	artifact *store.Artifact
	db       *gorm.DB
}

func (r *ArtifactResolver) ID() gql.ID            { return gql.ID(r.artifact.ID) }
func (r *ArtifactResolver) State() string         { return r.artifact.State }
func (r *ArtifactResolver) Digest() string        { return r.artifact.Digest }
func (r *ArtifactResolver) CommitHash() *string   { return strPtr(r.artifact.CommitHash) }
func (r *ArtifactResolver) Description() *string  { return strPtr(r.artifact.Description) }
func (r *ArtifactResolver) VersionIndex() *int32  { v := safeInt32(r.artifact.VersionIndex); return &v }
func (r *ArtifactResolver) FileCount() *int32     { v := safeInt32(r.artifact.FileCount); return &v }
func (r *ArtifactResolver) TtlIsInherited() *bool { return &r.artifact.TtlIsInherited }
func (r *ArtifactResolver) CreatedAt() *DateTime  { return timeToDateTime(r.artifact.CreatedAt) }
func (r *ArtifactResolver) UpdatedAt() *DateTime  { return timeToDateTime(r.artifact.UpdatedAt) }

func (r *ArtifactResolver) Metadata() *JSONString {
	s := string(r.artifact.Metadata)
	if s == "" || s == "null" {
		return nil
	}
	return &JSONString{Value: s}
}

func (r *ArtifactResolver) Size() *Int64Scalar {
	if r.artifact.Size == 0 {
		return nil
	}
	v := Int64Scalar(r.artifact.Size)
	return &v
}

func (r *ArtifactResolver) TtlDurationSeconds() *Int64Scalar {
	if r.artifact.TtlDurationSeconds == nil {
		return nil
	}
	v := Int64Scalar(*r.artifact.TtlDurationSeconds)
	return &v
}

func (r *ArtifactResolver) HistoryStep() *Int64Scalar {
	if r.artifact.HistoryStep == nil {
		return nil
	}
	v := Int64Scalar(*r.artifact.HistoryStep)
	return &v
}

func (r *ArtifactResolver) ArtifactType() (*ArtifactTypeResolver, error) {
	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ?", r.artifact.CollectionID).Error; err != nil {
		return nil, err
	}
	var artType store.ArtifactType
	if err := r.db.First(&artType, "id = ?", coll.ArtifactTypeID).Error; err != nil {
		return nil, err
	}
	return &ArtifactTypeResolver{artType: &artType, db: r.db}, nil
}

func (r *ArtifactResolver) ArtifactSequence() (*ArtifactSequenceResolver, error) {
	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ?", r.artifact.CollectionID).Error; err != nil {
		return nil, err
	}
	return &ArtifactSequenceResolver{coll: &coll, db: r.db}, nil
}

func (r *ArtifactResolver) CurrentManifest() (*ArtifactManifestResolver, error) {
	var manifest store.ArtifactManifest
	if err := r.db.Where("artifact_id = ?", r.artifact.ID).Order("created_at DESC").First(&manifest).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &ArtifactManifestResolver{manifest: &manifest, db: r.db}, nil
}

func (r *ArtifactResolver) Aliases() (*[]*ArtifactAliasResolver, error) {
	var aliases []store.ArtifactAlias
	if err := r.db.Where("artifact_id = ?", r.artifact.ID).Find(&aliases).Error; err != nil {
		return nil, err
	}
	resolvers := make([]*ArtifactAliasResolver, len(aliases))
	for i := range aliases {
		resolvers[i] = &ArtifactAliasResolver{alias: &aliases[i], db: r.db}
	}
	return &resolvers, nil
}

func (r *ArtifactResolver) Tags() (*[]*TagResolver, error) {
	// TODO: implement artifact-level tags (currently only collection-level tags exist)
	empty := make([]*TagResolver, 0)
	return &empty, nil
}

func (r *ArtifactResolver) Files(args struct {
	Names *[]*string
	After *string
	First *int32
}) (*FileConnectionResolver, error) {
	files, err := store.GetArtifactFilesByArtifactID(r.db, r.artifact.ID)
	if err != nil {
		return nil, err
	}

	// Filter by names if provided.
	if args.Names != nil && len(*args.Names) > 0 {
		nameSet := make(map[string]bool)
		for _, n := range *args.Names {
			if n != nil {
				nameSet[*n] = true
			}
		}
		var filtered []store.ArtifactFileStored
		for _, f := range files {
			if nameSet[f.Name] {
				filtered = append(filtered, f)
			}
		}
		files = filtered
	}

	edges := make([]*FileEdgeResolver, len(files))
	for i := range files {
		edges[i] = &FileEdgeResolver{
			node: &FileResolver{file: &files[i], db: r.db},
		}
	}
	return &FileConnectionResolver{edges: edges}, nil
}

func (r *ArtifactResolver) FilesByManifestEntries(args struct {
	StorageLayout   string
	ManifestVersion string
	Entries         *[]artifactManifestEntryInput
	StorageRegion   *string
}) (*FileConnectionResolver, error) {
	// Look up stored files for this artifact by name matching the requested entries.
	allFiles, err := store.GetArtifactFilesByArtifactID(r.db, r.artifact.ID)
	if err != nil {
		return nil, err
	}

	// Build a map of name -> file for fast lookup.
	fileByName := make(map[string]*store.ArtifactFileStored, len(allFiles))
	for i := range allFiles {
		fileByName[allFiles[i].Name] = &allFiles[i]
	}

	var edges []*FileEdgeResolver
	if args.Entries != nil {
		for _, entry := range *args.Entries {
			if f, ok := fileByName[entry.Name]; ok {
				edges = append(edges, &FileEdgeResolver{
					node: &FileResolver{file: f, db: r.db},
				})
			}
		}
	}

	return &FileConnectionResolver{edges: edges}, nil
}

type artifactManifestEntryInput struct {
	Name            string
	Digest          string
	BirthArtifactID *string
	StorageRegion   *string
}

func (r *ArtifactResolver) CreatedBy() (*RunResolver, error) {
	if r.artifact.CreatedByRunID == nil {
		return nil, nil
	}
	var run store.Run
	if err := r.db.First(&run, "id = ?", *r.artifact.CreatedByRunID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &RunResolver{run: &run, db: r.db}, nil
}

func (r *ArtifactResolver) UsedBy() (*RunConnectionResolver, error) {
	runs, err := store.GetRunsByArtifactUsage(r.db, r.artifact.ID, "input")
	if err != nil {
		return nil, err
	}
	edges := make([]*RunEdgeResolver, len(runs))
	for i := range runs {
		edges[i] = &RunEdgeResolver{
			node: &RunResolver{run: &runs[i], db: r.db},
		}
	}
	return &RunConnectionResolver{
		edges:      edges,
		totalCount: safeInt32(len(edges)),
	}, nil
}

func (r *ArtifactResolver) ArtifactMemberships() (*ArtifactMembershipConnectionResolver, error) {
	return &ArtifactMembershipConnectionResolver{}, nil
}

// ──��� ArtifactTypeResolver ────────────────────────────────────────

type ArtifactTypeResolver struct {
	artType *store.ArtifactType
	db      *gorm.DB
}

func (r *ArtifactTypeResolver) ID() gql.ID           { return gql.ID(r.artType.ID) }
func (r *ArtifactTypeResolver) Name() string         { return r.artType.Name }
func (r *ArtifactTypeResolver) Description() *string { return nil }
func (r *ArtifactTypeResolver) CreatedAt() *DateTime { return timeToDateTime(r.artType.CreatedAt) }

func (r *ArtifactTypeResolver) Artifact(args struct{ Name string }) (*ArtifactResolver, error) {
	// Find a collection of this type, then resolve the artifact by name within it.
	var colls []store.ArtifactCollection
	if err := r.db.Where("artifact_type_id = ?", r.artType.ID).Find(&colls).Error; err != nil {
		return nil, err
	}
	for _, coll := range colls {
		art, err := store.GetArtifactByName(r.db, coll.ProjectID, args.Name)
		if err == nil {
			return &ArtifactResolver{artifact: art, db: r.db}, nil
		}
	}
	return nil, nil
}

func (r *ArtifactTypeResolver) ArtifactCollection(args struct{ Name string }) (*ArtifactCollectionResolver, error) {
	var coll store.ArtifactCollection
	if err := r.db.Where("artifact_type_id = ? AND name = ?", r.artType.ID, args.Name).First(&coll).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &ArtifactCollectionResolver{coll: &coll, db: r.db}, nil
}

func (r *ArtifactTypeResolver) ArtifactCollections(args struct {
	After   *string
	First   *int32
	Filters *JSONString
	Order   *string
}) (*ArtifactCollectionConnectionResolver, error) {
	var colls []store.ArtifactCollection
	if err := r.db.Where("artifact_type_id = ?", r.artType.ID).Find(&colls).Error; err != nil {
		return nil, err
	}
	edges := make([]*ArtifactCollectionEdgeResolver, len(colls))
	for i := range colls {
		edges[i] = &ArtifactCollectionEdgeResolver{
			node: &ArtifactCollectionResolver{coll: &colls[i], db: r.db},
		}
	}
	return &ArtifactCollectionConnectionResolver{edges: edges}, nil
}

// ���── ArtifactSequenceResolver ────────────────────────────────────

type ArtifactSequenceResolver struct {
	coll *store.ArtifactCollection
	db   *gorm.DB
}

func (r *ArtifactSequenceResolver) ID() gql.ID           { return gql.ID(r.coll.ID) }
func (r *ArtifactSequenceResolver) Name() string         { return r.coll.Name }
func (r *ArtifactSequenceResolver) Description() *string { return strPtr(r.coll.Description) }
func (r *ArtifactSequenceResolver) CreatedAt() *DateTime { return timeToDateTime(r.coll.CreatedAt) }
func (r *ArtifactSequenceResolver) UpdatedAt() *DateTime { return timeToDateTime(r.coll.UpdatedAt) }

func (r *ArtifactSequenceResolver) Project() (*ProjectResolver, error) {
	var project store.Project
	if err := r.db.First(&project, "id = ?", r.coll.ProjectID).Error; err != nil {
		return nil, err
	}
	return &ProjectResolver{project: &project, db: r.db}, nil
}

func (r *ArtifactSequenceResolver) LatestArtifact() (*ArtifactResolver, error) {
	var art store.Artifact
	if err := r.db.Where("collection_id = ? AND state = 'COMMITTED'", r.coll.ID).
		Order("version_index DESC").First(&art).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &ArtifactResolver{artifact: &art, db: r.db}, nil
}

func (r *ArtifactSequenceResolver) DefaultArtifactType() (*ArtifactTypeResolver, error) {
	var artType store.ArtifactType
	if err := r.db.First(&artType, "id = ?", r.coll.ArtifactTypeID).Error; err != nil {
		return nil, err
	}
	return &ArtifactTypeResolver{artType: &artType, db: r.db}, nil
}

func (r *ArtifactSequenceResolver) Tags() (*TagConnectionResolver, error) {
	return &TagConnectionResolver{}, nil
}

// ─── ArtifactCollectionResolver ──���───────────────────────────────

type ArtifactCollectionResolver struct {
	coll *store.ArtifactCollection
	db   *gorm.DB
}

func (r *ArtifactCollectionResolver) ID() gql.ID           { return gql.ID(r.coll.ID) }
func (r *ArtifactCollectionResolver) Name() string         { return r.coll.Name }
func (r *ArtifactCollectionResolver) Description() *string { return strPtr(r.coll.Description) }
func (r *ArtifactCollectionResolver) State() *string       { return strPtr(r.coll.State) }
func (r *ArtifactCollectionResolver) CreatedAt() *DateTime { return timeToDateTime(r.coll.CreatedAt) }
func (r *ArtifactCollectionResolver) UpdatedAt() *DateTime { return timeToDateTime(r.coll.UpdatedAt) }

func (r *ArtifactCollectionResolver) Project() (*ProjectResolver, error) {
	var project store.Project
	if err := r.db.First(&project, "id = ?", r.coll.ProjectID).Error; err != nil {
		return nil, err
	}
	return &ProjectResolver{project: &project, db: r.db}, nil
}

func (r *ArtifactCollectionResolver) DefaultArtifactType() (*ArtifactTypeResolver, error) {
	var artType store.ArtifactType
	if err := r.db.First(&artType, "id = ?", r.coll.ArtifactTypeID).Error; err != nil {
		return nil, err
	}
	return &ArtifactTypeResolver{artType: &artType, db: r.db}, nil
}

func (r *ArtifactCollectionResolver) Aliases(args struct {
	After *string
	First *int32
}) (*ArtifactAliasConnectionResolver, error) {
	return &ArtifactAliasConnectionResolver{}, nil
}

func (r *ArtifactCollectionResolver) Artifacts(args struct {
	After   *string
	First   *int32
	Order   *string
	Filters *JSONString
}) (*ArtifactConnectionResolver, error) {
	var arts []store.Artifact
	q := r.db.Where("collection_id = ?", r.coll.ID).Order("version_index ASC")
	if err := q.Find(&arts).Error; err != nil {
		return nil, err
	}
	edges := make([]*ArtifactEdgeResolver, len(arts))
	for i := range arts {
		edges[i] = &ArtifactEdgeResolver{
			node: &ArtifactResolver{artifact: &arts[i], db: r.db},
		}
	}
	return &ArtifactConnectionResolver{edges: edges}, nil
}

func (r *ArtifactCollectionResolver) ArtifactMembership(args struct {
	AliasName string
}) (*ArtifactCollectionMembershipResolver, error) {
	return nil, nil // stub
}

func (r *ArtifactCollectionResolver) Tags() (*TagConnectionResolver, error) {
	return &TagConnectionResolver{}, nil
}

// ─── ArtifactManifestResolver ────────────────────────────────────

type ArtifactManifestResolver struct {
	manifest *store.ArtifactManifest
	db       *gorm.DB
}

func (r *ArtifactManifestResolver) ID() gql.ID { return gql.ID(r.manifest.ID) }

func (r *ArtifactManifestResolver) File() (*FileResolver, error) {
	if r.manifest.FileID == nil {
		return &FileResolver{}, nil
	}
	var f store.ArtifactFileStored
	if err := r.db.First(&f, "id = ?", *r.manifest.FileID).Error; err != nil {
		return &FileResolver{}, nil
	}
	return &FileResolver{file: &f, db: r.db}, nil
}

// ─── ArtifactAliasResolver ─────────────────────────────────────��

type ArtifactAliasResolver struct {
	alias *store.ArtifactAlias
	db    *gorm.DB
}

func (r *ArtifactAliasResolver) ID() gql.ID    { return gql.ID(r.alias.ID) }
func (r *ArtifactAliasResolver) Alias() string { return r.alias.Alias }

func (r *ArtifactAliasResolver) ArtifactCollection() (*ArtifactCollectionResolver, error) {
	var coll store.ArtifactCollection
	if err := r.db.First(&coll, "id = ?", r.alias.CollectionID).Error; err != nil {
		return nil, nil
	}
	return &ArtifactCollectionResolver{coll: &coll, db: r.db}, nil
}

// ─── ArtifactCollectionMembershipResolver ────────────────────────

type ArtifactCollectionMembershipResolver struct {
	db *gorm.DB
}

func (r *ArtifactCollectionMembershipResolver) ID() gql.ID                           { return "" }
func (r *ArtifactCollectionMembershipResolver) VersionIndex() *int32                 { return nil }
func (r *ArtifactCollectionMembershipResolver) Artifact() (*ArtifactResolver, error) { return nil, nil }
func (r *ArtifactCollectionMembershipResolver) Aliases() (*[]*ArtifactAliasResolver, error) {
	empty := make([]*ArtifactAliasResolver, 0)
	return &empty, nil
}
func (r *ArtifactCollectionMembershipResolver) ArtifactCollection() (*ArtifactCollectionResolver, error) {
	return nil, nil
}
func (r *ArtifactCollectionMembershipResolver) Files(args struct {
	Names *[]*string
	After *string
	First *int32
}) (*FileConnectionResolver, error) {
	return &FileConnectionResolver{}, nil
}

// ─── TagResolver ───���─────────────────────────────────────────────

type TagResolver struct {
	tag *store.Tag
}

func (r *TagResolver) ID() gql.ID   { return gql.ID(r.tag.ID) }
func (r *TagResolver) Name() string { return r.tag.Name }

// ─── FileResolver ─────────────���─────────────────────────���────────

type FileResolver struct {
	file *store.ArtifactFileStored
	db   *gorm.DB
}

func (r *FileResolver) ID() gql.ID {
	if r.file == nil {
		return ""
	}
	return gql.ID(r.file.ID)
}
func (r *FileResolver) Name() string {
	if r.file == nil {
		return ""
	}
	return r.file.Name
}
func (r *FileResolver) DisplayName() *string {
	if r.file == nil {
		return nil
	}
	return strPtr(r.file.DisplayName)
}
func (r *FileResolver) Url(args struct{ Upload *bool }) *string {
	if r.file == nil {
		return nil
	}
	return strPtr(r.file.UploadURL)
}
func (r *FileResolver) DirectUrl() *string {
	if r.file == nil {
		return nil
	}
	return strPtr(r.file.DirectURL)
}
func (r *FileResolver) UploadUrl() *string {
	if r.file == nil {
		return nil
	}
	return strPtr(r.file.UploadURL)
}
func (r *FileResolver) UploadHeaders() *[]string                          { return nil }
func (r *FileResolver) UploadMultipartUrls() *UploadMultipartUrlsResolver { return nil }
func (r *FileResolver) StoragePath() *string {
	if r.file == nil {
		return nil
	}
	return strPtr(r.file.StoragePath)
}
func (r *FileResolver) SizeBytes() *Int64Scalar {
	if r.file == nil || r.file.Size == nil {
		return nil
	}
	v := Int64Scalar(*r.file.Size)
	return &v
}
func (r *FileResolver) Md5() *string {
	if r.file == nil {
		return nil
	}
	return strPtr(r.file.MD5)
}
func (r *FileResolver) Digest() *string                      { return nil }
func (r *FileResolver) Mimetype() *string                    { return nil }
func (r *FileResolver) UpdatedAt() *DateTime                 { return nil }
func (r *FileResolver) Artifact() (*ArtifactResolver, error) { return nil, nil }

// ─── UploadMultipartUrlsResolver ─────────────────────────────────

type UploadMultipartUrlsResolver struct{}

func (r *UploadMultipartUrlsResolver) UploadID() string                         { return "" }
func (r *UploadMultipartUrlsResolver) UploadUrlParts() []*UploadUrlPartResolver { return nil }

type UploadUrlPartResolver struct{}

func (r *UploadUrlPartResolver) PartNumber() Int64Scalar { return Int64Scalar(0) }
func (r *UploadUrlPartResolver) UploadUrl() string       { return "" }

// ─── ClientIDMappingResultResolver ───────────────────────────────

type ClientIDMappingResultResolver struct {
	id string
}

func (r *ClientIDMappingResultResolver) ID() gql.ID { return gql.ID(r.id) }

// ─── Artifact Connection Resolvers ───────���───────────────────────

type ArtifactConnectionResolver struct {
	edges []*ArtifactEdgeResolver
}

func (c *ArtifactConnectionResolver) Edges() []*ArtifactEdgeResolver { return c.edges }
func (c *ArtifactConnectionResolver) TotalCount() *int32 {
	v := safeInt32(len(c.edges))
	return &v
}
func (c *ArtifactConnectionResolver) PageInfo() *PageInfoResolver { return &PageInfoResolver{} }

type ArtifactEdgeResolver struct {
	node   *ArtifactResolver
	cursor string
}

func (e *ArtifactEdgeResolver) Node() *ArtifactResolver { return e.node }
func (e *ArtifactEdgeResolver) Cursor() *string         { return strPtr(e.cursor) }

type ArtifactCollectionConnectionResolver struct {
	edges []*ArtifactCollectionEdgeResolver
}

func (c *ArtifactCollectionConnectionResolver) Edges() []*ArtifactCollectionEdgeResolver {
	return c.edges
}
func (c *ArtifactCollectionConnectionResolver) TotalCount() *int32 {
	v := safeInt32(len(c.edges))
	return &v
}
func (c *ArtifactCollectionConnectionResolver) PageInfo() *PageInfoResolver {
	return &PageInfoResolver{}
}

type ArtifactCollectionEdgeResolver struct {
	node *ArtifactCollectionResolver
}

func (e *ArtifactCollectionEdgeResolver) Node() *ArtifactCollectionResolver { return e.node }
func (e *ArtifactCollectionEdgeResolver) Cursor() *string                   { return nil }

type ArtifactAliasConnectionResolver struct{}

func (c *ArtifactAliasConnectionResolver) Edges() []*ArtifactAliasEdgeResolver { return nil }
func (c *ArtifactAliasConnectionResolver) PageInfo() *PageInfoResolver         { return &PageInfoResolver{} }

type ArtifactAliasEdgeResolver struct{}

func (e *ArtifactAliasEdgeResolver) Node() *ArtifactAliasResolver { return nil }
func (e *ArtifactAliasEdgeResolver) Cursor() *string              { return nil }

type ArtifactMembershipConnectionResolver struct{}

func (c *ArtifactMembershipConnectionResolver) Edges() []*ArtifactMembershipEdgeResolver {
	return nil
}
func (c *ArtifactMembershipConnectionResolver) PageInfo() *PageInfoResolver {
	return &PageInfoResolver{}
}

type ArtifactMembershipEdgeResolver struct{}

func (e *ArtifactMembershipEdgeResolver) Node() *ArtifactCollectionMembershipResolver { return nil }
func (e *ArtifactMembershipEdgeResolver) Cursor() *string                             { return nil }

type TagConnectionResolver struct{}

func (c *TagConnectionResolver) Edges() []*TagEdgeResolver   { return nil }
func (c *TagConnectionResolver) PageInfo() *PageInfoResolver { return &PageInfoResolver{} }

type TagEdgeResolver struct{}

func (e *TagEdgeResolver) Node() *TagResolver { return nil }
func (e *TagEdgeResolver) Cursor() *string    { return nil }

type FileConnectionResolver struct {
	edges []*FileEdgeResolver
}

func (c *FileConnectionResolver) Edges() []*FileEdgeResolver  { return c.edges }
func (c *FileConnectionResolver) PageInfo() *PageInfoResolver { return &PageInfoResolver{} }

type FileEdgeResolver struct {
	node *FileResolver
}

func (e *FileEdgeResolver) Node() *FileResolver { return e.node }
func (e *FileEdgeResolver) Cursor() *string     { return nil }

type ArtifactTypeConnectionResolver struct {
	edges []*ArtifactTypeEdgeResolver
}

func (c *ArtifactTypeConnectionResolver) Edges() []*ArtifactTypeEdgeResolver { return c.edges }
func (c *ArtifactTypeConnectionResolver) PageInfo() *PageInfoResolver        { return &PageInfoResolver{} }

type ArtifactTypeEdgeResolver struct {
	node *ArtifactTypeResolver
}

func (e *ArtifactTypeEdgeResolver) Node() *ArtifactTypeResolver { return e.node }
func (e *ArtifactTypeEdgeResolver) Cursor() *string             { return nil }
