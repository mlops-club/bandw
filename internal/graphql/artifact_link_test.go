package graphql_test

import (
	"fmt"
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLinkArtifactToPortfolio(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "link-coll", "c-link")

	// Link the artifact to a portfolio.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		linkArtifact(input: {
			artifactPortfolioName: "my-portfolio"
			entityName: "admin"
			projectName: "proj"
			artifactID: "%s"
		}) {
			versionIndex
		}
	}`, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	assert.Equal(t, int64(0), resp.Path("data.linkArtifact.versionIndex").Int())

	// Verify a portfolio collection was created.
	var portfolio store.ArtifactCollection
	err := h.DB.Where("name = ? AND type = ?", "my-portfolio", "portfolio").First(&portfolio).Error
	require.NoError(t, err)
	assert.Equal(t, "portfolio", portfolio.Type)

	// Verify an alias was created in the portfolio.
	var alias store.ArtifactAlias
	err = h.DB.Where("collection_id = ? AND artifact_id = ?", portfolio.ID, artID).First(&alias).Error
	require.NoError(t, err)
	assert.Equal(t, "v0", alias.Alias)

	// Link a second artifact.
	artID2 := createAndCommitArtifact(h, "proj", "link-coll2", "c-link2")
	resp2 := h.GraphQL(fmt.Sprintf(`mutation {
		linkArtifact(input: {
			artifactPortfolioName: "my-portfolio"
			entityName: "admin"
			projectName: "proj"
			artifactID: "%s"
		}) {
			versionIndex
		}
	}`, artID2))

	assert.Nil(t, resp2.Path("errors").Value(), "unexpected errors: %s", string(resp2.Body))
	assert.Equal(t, int64(1), resp2.Path("data.linkArtifact.versionIndex").Int())
}

func TestUnlinkArtifactFromPortfolio(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	artID := createAndCommitArtifact(h, "proj", "unlink-coll", "c-unlink")

	// Link first.
	h.GraphQL(fmt.Sprintf(`mutation {
		linkArtifact(input: {
			artifactPortfolioName: "unlink-portfolio"
			entityName: "admin"
			projectName: "proj"
			artifactID: "%s"
		}) { versionIndex }
	}`, artID))

	// Verify alias exists.
	var portfolio store.ArtifactCollection
	require.NoError(t, h.DB.Where("name = ? AND type = ?", "unlink-portfolio", "portfolio").First(&portfolio).Error)
	var count int64
	h.DB.Model(&store.ArtifactAlias{}).Where("collection_id = ? AND artifact_id = ?", portfolio.ID, artID).Count(&count)
	require.Equal(t, int64(1), count)

	// Unlink.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		unlinkArtifact(input: {
			artifactID: "%s"
			portfolioName: "unlink-portfolio"
			entityName: "admin"
			projectName: "proj"
		}) { success }
	}`, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	assert.True(t, resp.Path("data.unlinkArtifact.success").Bool())

	// Verify alias is gone.
	h.DB.Model(&store.ArtifactAlias{}).Where("collection_id = ? AND artifact_id = ?", portfolio.ID, artID).Count(&count)
	assert.Equal(t, int64(0), count)
}

func TestUpdateArtifactSequenceName(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// Create an artifact to get a sequence/collection.
	_ = createAndCommitArtifact(h, "proj", "rename-coll", "c-rename")

	var coll store.ArtifactCollection
	require.NoError(t, h.DB.Where("name = ?", "rename-coll").First(&coll).Error)

	resp := h.GraphQL(fmt.Sprintf(`mutation {
		updateArtifactSequence(input: {
			artifactSequenceID: "%s"
			name: "renamed-coll"
			description: "Updated description"
		}) {
			artifactCollection {
				id
				name
				description
			}
		}
	}`, coll.ID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	ac := resp.Path("data.updateArtifactSequence.artifactCollection")
	assert.Equal(t, "renamed-coll", ac.Get("name").String())
	assert.Equal(t, "Updated description", ac.Get("description").String())

	// Verify in DB.
	var updated store.ArtifactCollection
	require.NoError(t, h.DB.First(&updated, "id = ?", coll.ID).Error)
	assert.Equal(t, "renamed-coll", updated.Name)
	assert.Equal(t, "Updated description", updated.Description)
}

func TestCollectionTagAssignments(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	_ = createAndCommitArtifact(h, "proj", "tag-coll", "c-tag")

	var coll store.ArtifactCollection
	require.NoError(t, h.DB.Where("name = ?", "tag-coll").First(&coll).Error)

	// Create tag assignments.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		createArtifactCollectionTagAssignments(input: {
			artifactCollectionID: "%s"
			tags: [{tagName: "production"}, {tagName: "v1"}]
		}) {
			tags { id name }
		}
	}`, coll.ID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))

	tags := resp.Path("data.createArtifactCollectionTagAssignments.tags").Array()
	assert.Len(t, tags, 2)

	// Verify join records in DB.
	var tagCount int64
	h.DB.Model(&store.ArtifactCollectionTag{}).Where("collection_id = ?", coll.ID).Count(&tagCount)
	assert.Equal(t, int64(2), tagCount)

	// Delete one tag assignment.
	resp2 := h.GraphQL(fmt.Sprintf(`mutation {
		deleteArtifactCollectionTagAssignments(input: {
			artifactCollectionID: "%s"
			tags: [{tagName: "v1"}]
		}) { success }
	}`, coll.ID))

	assert.Nil(t, resp2.Path("errors").Value(), "unexpected errors: %s", string(resp2.Body))
	assert.True(t, resp2.Path("data.deleteArtifactCollectionTagAssignments.success").Bool())

	// Verify only one tag remains.
	h.DB.Model(&store.ArtifactCollectionTag{}).Where("collection_id = ?", coll.ID).Count(&tagCount)
	assert.Equal(t, int64(1), tagCount)
}
