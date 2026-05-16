package graphql_test

import (
	"testing"

	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
)

func TestUpsertWorkspaceView(t *testing.T) {
	h := testutil.NewHarness(t)

	resp := h.GraphQL(`mutation {
		upsertView(input: {
			entityName: "admin"
			projectName: "ws-project"
			name: "my-workspace"
			displayName: "My Workspace"
			type: "workspace"
			description: "A workspace view"
			spec: "{\"layout\": \"grid\"}"
		}) {
			view {
				id
				name
				displayName
				type
				description
				spec
			}
		}
	}`)

	assert.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, "my-workspace", resp.Path("data.upsertView.view.name").String())
	assert.Equal(t, "My Workspace", resp.Path("data.upsertView.view.displayName").String())
	assert.Equal(t, "workspace", resp.Path("data.upsertView.view.type").String())
	assert.Equal(t, "A workspace view", resp.Path("data.upsertView.view.description").String())
	assert.NotEmpty(t, resp.Path("data.upsertView.view.id").String())

	// Update the workspace view.
	viewID := resp.Path("data.upsertView.view.id").String()
	updateResp := h.GraphQL(`mutation {
		upsertView(input: {
			id: "` + viewID + `"
			entityName: "admin"
			projectName: "ws-project"
			name: "my-workspace"
			displayName: "Updated Workspace"
			type: "workspace"
			spec: "{\"layout\": \"list\"}"
		}) {
			view { id displayName spec type }
		}
	}`)

	assert.Nil(t, updateResp.Path("errors").Value())
	assert.Equal(t, viewID, updateResp.Path("data.upsertView.view.id").String())
	assert.Equal(t, "Updated Workspace", updateResp.Path("data.upsertView.view.displayName").String())
	assert.Equal(t, "workspace", updateResp.Path("data.upsertView.view.type").String())
}

func TestAllViewsWorkspaceFilter(t *testing.T) {
	h := testutil.NewHarness(t)

	// Create a "runs" view.
	h.GraphQL(`mutation {
		upsertView(input: {
			entityName: "admin"
			projectName: "filter-project"
			name: "runs-view"
			type: "runs"
			spec: "{}"
		}) { view { id } }
	}`)

	// Create two "workspace" views.
	h.GraphQL(`mutation {
		upsertView(input: {
			entityName: "admin"
			projectName: "filter-project"
			name: "ws-view-1"
			type: "workspace"
			spec: "{}"
		}) { view { id } }
	}`)
	h.GraphQL(`mutation {
		upsertView(input: {
			entityName: "admin"
			projectName: "filter-project"
			name: "ws-view-2"
			type: "workspace"
			spec: "{}"
		}) { view { id } }
	}`)

	// Query allViews with viewType="workspace" filter.
	resp := h.GraphQL(`query {
		project(name: "filter-project", entityName: "admin") {
			allViews(viewType: "workspace") {
				edges {
					node { name type }
				}
			}
		}
	}`)

	assert.Nil(t, resp.Path("errors").Value())
	edges := resp.Path("data.project.allViews.edges").Array()
	assert.Len(t, edges, 2)
	for _, edge := range edges {
		assert.Equal(t, "workspace", edge.Get("node.type").String())
	}

	// Query with viewType="runs" — should only get the runs view.
	runsResp := h.GraphQL(`query {
		project(name: "filter-project", entityName: "admin") {
			allViews(viewType: "runs") {
				edges {
					node { name type }
				}
			}
		}
	}`)

	assert.Nil(t, runsResp.Path("errors").Value())
	runsEdges := runsResp.Path("data.project.allViews.edges").Array()
	assert.Len(t, runsEdges, 1)
	assert.Equal(t, "runs", runsEdges[0].Get("node.type").String())
	assert.Equal(t, "runs-view", runsEdges[0].Get("node.name").String())
}
