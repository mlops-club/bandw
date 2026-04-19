package graphql_test

import (
	"testing"

	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProjectsList_ViaGraphQL(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj-alpha", "run1", `{}`)
	h.SeedRun("proj-beta", "run1", `{}`)
	h.SeedRun("proj-beta", "run2", `{}`)

	resp := h.GraphQL(`{
		projects(entityName: "admin") {
			edges {
				node {
					name
					runCount
					lastRunAt
				}
			}
		}
	}`)

	t.Log(string(resp.Body))
	assert.Nil(t, resp.Path("errors").Value())

	edges := resp.Path("data.projects.edges")
	require.True(t, edges.Exists())
	require.Equal(t, 2, len(edges.Array()))

	// Check proj-beta has 2 runs.
	for _, edge := range edges.Array() {
		name := edge.Get("node.name").String()
		if name == "proj-beta" {
			assert.Equal(t, float64(2), edge.Get("node.runCount").Float())
			assert.NotEmpty(t, edge.Get("node.lastRunAt").String())
		}
	}
}
