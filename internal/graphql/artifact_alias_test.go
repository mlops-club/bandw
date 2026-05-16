package graphql_test

import (
	"fmt"
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAddAliasesSingle(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "add-alias-coll", "c-add-alias")

	resp := h.GraphQL(fmt.Sprintf(`mutation {
		addAliases(input: {
			artifactID: "%s"
			aliases: [{alias: "production", artifactCollectionName: "add-alias-coll"}]
		}) { success }
	}`, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	assert.True(t, resp.Path("data.addAliases.success").Bool())

	// Verify alias exists in DB.
	var alias store.ArtifactAlias
	err := h.DB.Where("artifact_id = ? AND alias = ?", artID, "production").First(&alias).Error
	require.NoError(t, err)
	assert.Equal(t, "production", alias.Alias)
}

func TestDeleteAliases(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "del-alias-coll", "c-del-alias")

	// Add an alias first.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		addAliases(input: {
			artifactID: "%s"
			aliases: [{alias: "staging", artifactCollectionName: "del-alias-coll"}]
		}) { success }
	}`, artID))
	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))

	// Verify it exists.
	var count int64
	h.DB.Model(&store.ArtifactAlias{}).Where("artifact_id = ? AND alias = ?", artID, "staging").Count(&count)
	require.Equal(t, int64(1), count)

	// Delete it.
	resp2 := h.GraphQL(fmt.Sprintf(`mutation {
		deleteAliases(input: {
			artifactID: "%s"
			aliases: [{alias: "staging", artifactCollectionName: "del-alias-coll"}]
		}) { success }
	}`, artID))

	assert.Nil(t, resp2.Path("errors").Value(), "unexpected errors: %s", string(resp2.Body))
	assert.True(t, resp2.Path("data.deleteAliases.success").Bool())

	// Verify alias is gone.
	h.DB.Model(&store.ArtifactAlias{}).Where("artifact_id = ? AND alias = ?", artID, "staging").Count(&count)
	assert.Equal(t, int64(0), count)
}

func TestAddAliasIdempotent(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "idem-alias-coll", "c-idem-alias")

	mutation := fmt.Sprintf(`mutation {
		addAliases(input: {
			artifactID: "%s"
			aliases: [{alias: "canary", artifactCollectionName: "idem-alias-coll"}]
		}) { success }
	}`, artID)

	// Add alias twice.
	resp1 := h.GraphQL(mutation)
	assert.Nil(t, resp1.Path("errors").Value(), "unexpected errors on first call: %s", string(resp1.Body))
	assert.True(t, resp1.Path("data.addAliases.success").Bool())

	resp2 := h.GraphQL(mutation)
	assert.Nil(t, resp2.Path("errors").Value(), "unexpected errors on second call: %s", string(resp2.Body))
	assert.True(t, resp2.Path("data.addAliases.success").Bool())

	// Should have exactly one "canary" alias, not two.
	var count int64
	h.DB.Model(&store.ArtifactAlias{}).Where("artifact_id = ? AND alias = ?", artID, "canary").Count(&count)
	assert.Equal(t, int64(1), count)
}
