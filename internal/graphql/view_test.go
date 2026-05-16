package graphql_test

import (
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
)

func TestUpsertViewCreatesNew(t *testing.T) {
	h := testutil.NewHarness(t)

	resp := h.GraphQL(`mutation {
		upsertView(input: {
			entityName: "admin"
			projectName: "view-project"
			name: "my-view"
			displayName: "My View"
			type: "runs"
			description: "A test view"
			spec: "{\"panels\": []}"
		}) {
			view {
				id
				name
				displayName
				type
				description
				spec
				createdAt
				updatedAt
			}
		}
	}`)

	assert.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, "my-view", resp.Path("data.upsertView.view.name").String())
	assert.Equal(t, "My View", resp.Path("data.upsertView.view.displayName").String())
	assert.Equal(t, "runs", resp.Path("data.upsertView.view.type").String())
	assert.Equal(t, "A test view", resp.Path("data.upsertView.view.description").String())
	assert.NotEmpty(t, resp.Path("data.upsertView.view.id").String())

	// Verify in database.
	var count int64
	h.DB.Model(&store.View{}).Where("name = ?", "my-view").Count(&count)
	assert.Equal(t, int64(1), count)
}

func TestUpsertViewUpdatesExisting(t *testing.T) {
	h := testutil.NewHarness(t)

	// Create a view first.
	createResp := h.GraphQL(`mutation {
		upsertView(input: {
			entityName: "admin"
			projectName: "view-project"
			name: "edit-me"
			type: "runs"
			spec: "{\"v\": 1}"
		}) {
			view { id name }
		}
	}`)
	assert.Nil(t, createResp.Path("errors").Value())
	viewID := createResp.Path("data.upsertView.view.id").String()
	assert.NotEmpty(t, viewID)

	// Update the view by providing the ID.
	updateResp := h.GraphQL(`mutation {
		upsertView(input: {
			id: "` + viewID + `"
			entityName: "admin"
			projectName: "view-project"
			name: "edited-name"
			displayName: "Edited View"
			spec: "{\"v\": 2}"
		}) {
			view { id name displayName spec }
		}
	}`)

	assert.Nil(t, updateResp.Path("errors").Value())
	assert.Equal(t, viewID, updateResp.Path("data.upsertView.view.id").String())
	assert.Equal(t, "edited-name", updateResp.Path("data.upsertView.view.name").String())
	assert.Equal(t, "Edited View", updateResp.Path("data.upsertView.view.displayName").String())

	// Only one view should exist.
	var count int64
	h.DB.Model(&store.View{}).Count(&count)
	assert.Equal(t, int64(1), count)
}

func TestDeleteView(t *testing.T) {
	h := testutil.NewHarness(t)

	// Create a view.
	createResp := h.GraphQL(`mutation {
		upsertView(input: {
			entityName: "admin"
			projectName: "view-project"
			name: "to-delete"
			type: "workspace"
		}) {
			view { id }
		}
	}`)
	assert.Nil(t, createResp.Path("errors").Value())
	viewID := createResp.Path("data.upsertView.view.id").String()

	// Delete the view.
	deleteResp := h.GraphQL(`mutation {
		deleteView(input: { id: "` + viewID + `" }) {
			success
		}
	}`)
	assert.Nil(t, deleteResp.Path("errors").Value())
	assert.Equal(t, true, deleteResp.Path("data.deleteView.success").Bool())

	// Verify it's gone.
	var count int64
	h.DB.Model(&store.View{}).Where("id = ?", viewID).Count(&count)
	assert.Equal(t, int64(0), count)
}
