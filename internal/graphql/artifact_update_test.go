package graphql_test

import (
	"fmt"
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// createAndCommitArtifact is a helper that creates and commits an artifact,
// returning its ID. The artifact is created in the "admin" entity, given project,
// with the given collection name.
func createAndCommitArtifact(h *testutil.Harness, project, collection, clientID string) string {
	artResp := h.GraphQL(fmt.Sprintf(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "%s"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "%s"
			artifactCollectionNames: ["%s"]
			digest: "digest-%s"
			digestAlgorithm: MANIFEST_MD5
			aliases: []
			clientID: "%s"
			sequenceClientID: "seq-%s"
			enableDigestDeduplication: false
		}) { artifact { id } }
	}`, project, collection, collection, clientID, clientID, clientID))
	artID := artResp.Path("data.createArtifact.artifact.id").String()

	h.GraphQL(fmt.Sprintf(`mutation {
		commitArtifact(input: {artifactID: "%s"}) { artifact { id } }
	}`, artID))

	return artID
}

func TestUpdateArtifactDescription(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "desc-test", "c-desc")

	// Update description.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		updateArtifact(input: {
			artifactID: "%s"
			description: "Updated description"
		}) {
			artifact {
				id
				description
				state
			}
		}
	}`, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	art := resp.Path("data.updateArtifact.artifact")
	assert.Equal(t, artID, art.Get("id").String())
	assert.Equal(t, "Updated description", art.Get("description").String())
	assert.Equal(t, "COMMITTED", art.Get("state").String())

	// Verify in DB.
	var dbArt store.Artifact
	require.NoError(t, h.DB.First(&dbArt, "id = ?", artID).Error)
	assert.Equal(t, "Updated description", dbArt.Description)
}

func TestUpdateArtifactMetadata(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "meta-test", "c-meta")

	// Update metadata.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		updateArtifact(input: {
			artifactID: "%s"
			metadata: "{\"new_key\": \"new_value\"}"
		}) {
			artifact {
				id
				metadata
			}
		}
	}`, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	art := resp.Path("data.updateArtifact.artifact")
	assert.Contains(t, art.Get("metadata").String(), "new_key")
	assert.Contains(t, art.Get("metadata").String(), "new_value")

	// Verify in DB.
	var dbArt store.Artifact
	require.NoError(t, h.DB.First(&dbArt, "id = ?", artID).Error)
	assert.Contains(t, string(dbArt.Metadata), "new_key")
}

func TestUpdateArtifactAliases(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "alias-test", "c-alias")

	// After commit, the artifact should have "latest" and "v0" aliases.
	var preAliases []store.ArtifactAlias
	h.DB.Where("artifact_id = ?", artID).Find(&preAliases)
	preNames := make([]string, len(preAliases))
	for i, a := range preAliases {
		preNames[i] = a.Alias
	}
	assert.Contains(t, preNames, "latest")
	assert.Contains(t, preNames, "v0")

	// Update aliases: add "production" and "staging".
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		updateArtifact(input: {
			artifactID: "%s"
			aliases: [
				{alias: "production", artifactCollectionName: "alias-test"},
				{alias: "staging", artifactCollectionName: "alias-test"}
			]
		}) {
			artifact {
				id
				aliases { alias }
			}
		}
	}`, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))

	// Verify aliases in DB: should have latest, v0, production, staging.
	var postAliases []store.ArtifactAlias
	h.DB.Where("artifact_id = ?", artID).Find(&postAliases)
	postNames := make([]string, len(postAliases))
	for i, a := range postAliases {
		postNames[i] = a.Alias
	}
	assert.Contains(t, postNames, "latest", "auto-managed 'latest' should be preserved")
	assert.Contains(t, postNames, "v0", "auto-managed 'v0' should be preserved")
	assert.Contains(t, postNames, "production")
	assert.Contains(t, postNames, "staging")

	// Now update aliases again to only "best". Old user aliases should be removed.
	resp2 := h.GraphQL(fmt.Sprintf(`mutation {
		updateArtifact(input: {
			artifactID: "%s"
			aliases: [
				{alias: "best", artifactCollectionName: "alias-test"}
			]
		}) {
			artifact { id }
		}
	}`, artID))
	assert.Nil(t, resp2.Path("errors").Value(), "unexpected errors: %s", string(resp2.Body))

	var finalAliases []store.ArtifactAlias
	h.DB.Where("artifact_id = ?", artID).Find(&finalAliases)
	finalNames := make([]string, len(finalAliases))
	for i, a := range finalAliases {
		finalNames[i] = a.Alias
	}
	assert.Contains(t, finalNames, "latest")
	assert.Contains(t, finalNames, "v0")
	assert.Contains(t, finalNames, "best")
	assert.NotContains(t, finalNames, "production", "old user alias should be removed")
	assert.NotContains(t, finalNames, "staging", "old user alias should be removed")
}
