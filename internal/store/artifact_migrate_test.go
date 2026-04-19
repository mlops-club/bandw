package store_test

import (
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAutoMigrateCreatesArtifactTables(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))

	// Verify all artifact-related tables exist by querying sqlite_master.
	var tables []string
	db.Raw("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").Scan(&tables)

	expectedTables := []string{
		"artifact_types",
		"artifact_collections",
		"artifacts",
		"artifact_aliases",
		"artifact_manifests",
		"artifact_manifest_entries",
		"artifact_file_storeds",
		"artifact_usages",
		"tags",
		"artifact_collection_tags",
	}

	for _, expected := range expectedTables {
		assert.Contains(t, tables, expected, "missing table: %s", expected)
	}
}

func TestArtifactModelCRUD(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))

	// Create prerequisite records.
	entity := store.Entity{Name: "test-entity", Type: "user"}
	require.NoError(t, db.Create(&entity).Error)

	project := store.Project{Name: "test-project", EntityID: entity.ID}
	require.NoError(t, db.Create(&project).Error)

	// Create an artifact type.
	artType := store.ArtifactType{Name: "dataset", ProjectID: project.ID}
	require.NoError(t, db.Create(&artType).Error)
	assert.NotEmpty(t, artType.ID, "ArtifactType should get a UUID")

	// Create a collection.
	coll := store.ArtifactCollection{
		Name:           "my-dataset",
		Type:           "sequence",
		ArtifactTypeID: artType.ID,
		ProjectID:      project.ID,
	}
	require.NoError(t, db.Create(&coll).Error)
	assert.NotEmpty(t, coll.ID)

	// Create an artifact version.
	art := store.Artifact{
		CollectionID: coll.ID,
		Digest:       "abc123",
		State:        "PENDING",
		VersionIndex: 0,
	}
	require.NoError(t, db.Create(&art).Error)
	assert.NotEmpty(t, art.ID)

	// Create an alias.
	alias := store.ArtifactAlias{
		ArtifactID:   art.ID,
		CollectionID: coll.ID,
		Alias:        "latest",
	}
	require.NoError(t, db.Create(&alias).Error)
	assert.NotEmpty(t, alias.ID)

	// Create a manifest.
	manifest := store.ArtifactManifest{
		ArtifactID: art.ID,
		Type:       "FULL",
		Digest:     "manifest-digest-123",
	}
	require.NoError(t, db.Create(&manifest).Error)
	assert.NotEmpty(t, manifest.ID)

	// Create a manifest entry.
	entry := store.ArtifactManifestEntry{
		ManifestID: manifest.ID,
		Path:       "data/file.txt",
		Digest:     "file-digest-456",
	}
	require.NoError(t, db.Create(&entry).Error)
	assert.NotEmpty(t, entry.ID)

	// Create a stored file record.
	storedFile := store.ArtifactFileStored{
		ArtifactID:  art.ID,
		Name:        "data/file.txt",
		StoragePath: "artifacts/abc123/file.txt",
		MD5:         "d41d8cd98f00b204e9800998ecf8427e",
	}
	require.NoError(t, db.Create(&storedFile).Error)
	assert.NotEmpty(t, storedFile.ID)

	// Create a tag and collection tag.
	tag := store.Tag{Name: "production"}
	require.NoError(t, db.Create(&tag).Error)
	assert.NotEmpty(t, tag.ID)

	collTag := store.ArtifactCollectionTag{
		CollectionID: coll.ID,
		TagID:        tag.ID,
	}
	require.NoError(t, db.Create(&collTag).Error)

	// Verify we can read back.
	var readArt store.Artifact
	require.NoError(t, db.First(&readArt, "id = ?", art.ID).Error)
	assert.Equal(t, "PENDING", readArt.State)
	assert.Equal(t, 0, readArt.VersionIndex)

	var readAlias store.ArtifactAlias
	require.NoError(t, db.First(&readAlias, "artifact_id = ?", art.ID).Error)
	assert.Equal(t, "latest", readAlias.Alias)

	// Verify unique constraint on (collection_id, alias).
	dupAlias := store.ArtifactAlias{
		ArtifactID:   art.ID,
		CollectionID: coll.ID,
		Alias:        "latest",
	}
	assert.Error(t, db.Create(&dupAlias).Error, "duplicate alias should fail")
}
