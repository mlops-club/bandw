package graphql_test

import (
	"fmt"
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDeleteArtifactSetsDeleted(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "del-test", "c-del")

	resp := h.GraphQL(fmt.Sprintf(`mutation {
		deleteArtifact(input: {artifactID: "%s"}) {
			artifact { id state }
		}
	}`, artID))

	require.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, "DELETED", resp.Path("data.deleteArtifact.artifact.state").String())

	// Verify in DB.
	var art store.Artifact
	require.NoError(t, h.DB.First(&art, "id = ?", artID).Error)
	assert.Equal(t, "DELETED", art.State)
}

func TestDeleteArtifactWithAliases(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "alias-del", "c-alias")

	// Add an alias via updateArtifact.
	h.GraphQL(fmt.Sprintf(`mutation {
		updateArtifact(input: {
			artifactID: "%s"
			aliases: [{artifactCollectionName: "alias-del", alias: "best"}]
		}) { artifact { id } }
	}`, artID))

	// Verify alias exists.
	var aliasBefore int64
	h.DB.Model(&store.ArtifactAlias{}).Where("artifact_id = ?", artID).Count(&aliasBefore)
	require.Greater(t, aliasBefore, int64(0), "expected aliases to exist before delete")

	// Delete artifact (deleteAliases defaults to true).
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		deleteArtifact(input: {artifactID: "%s"}) {
			artifact { id state }
		}
	}`, artID))
	require.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, "DELETED", resp.Path("data.deleteArtifact.artifact.state").String())

	// Aliases should be gone.
	var aliasAfter int64
	h.DB.Model(&store.ArtifactAlias{}).Where("artifact_id = ?", artID).Count(&aliasAfter)
	assert.Equal(t, int64(0), aliasAfter)
}

func TestDeleteArtifactSequence(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// Creating an artifact also creates a sequence (collection).
	_ = createAndCommitArtifact(h, "proj", "seq-del", "c-seq")

	// Find the collection ID.
	var coll store.ArtifactCollection
	require.NoError(t, h.DB.First(&coll, "name = ? AND type = ?", "seq-del", "sequence").Error)

	resp := h.GraphQL(fmt.Sprintf(`mutation {
		deleteArtifactSequence(input: {artifactSequenceID: "%s"}) {
			artifactCollection { id state }
		}
	}`, coll.ID))

	require.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, "deleted", resp.Path("data.deleteArtifactSequence.artifactCollection.state").String())

	// Verify in DB.
	var updated store.ArtifactCollection
	require.NoError(t, h.DB.First(&updated, "id = ?", coll.ID).Error)
	assert.Equal(t, "deleted", updated.State)
}
