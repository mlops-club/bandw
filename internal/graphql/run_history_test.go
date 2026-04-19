package graphql_test

import (
	"encoding/json"
	"testing"

	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func seedRunWithHistory(h *testutil.Harness, numSteps int) string {
	h.SeedRun("histproj", "histrun", `{"lr": 0.001}`)

	rows := make([]map[string]interface{}, numSteps)
	for i := 0; i < numSteps; i++ {
		rows[i] = map[string]interface{}{
			"loss":     1.0 / float64(i+1),
			"accuracy": float64(i) * 0.01,
			"_step":    i,
		}
	}
	h.SeedHistoryViaFileStream("admin", "histproj", "histrun", rows)
	return "histrun"
}

func TestHistoryKeys_ViaGraphQL(t *testing.T) {
	h := testutil.NewHarness(t)
	seedRunWithHistory(h, 50)

	resp := h.GraphQL(`{
		project(name: "histproj", entityName: "admin") {
			run(name: "histrun") {
				historyKeys
			}
		}
	}`)

	assert.Nil(t, resp.Path("errors").Value())

	hkRaw := resp.Path("data.project.run.historyKeys").String()
	require.NotEmpty(t, hkRaw)

	var hk map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(hkRaw), &hk))

	assert.Equal(t, float64(49), hk["lastStep"])

	keys, ok := hk["keys"].(map[string]interface{})
	require.True(t, ok)
	assert.Contains(t, keys, "loss")
	assert.Contains(t, keys, "accuracy")
	assert.NotContains(t, keys, "_step")

	// Check previousValue exists for loss.
	lossInfo := keys["loss"].(map[string]interface{})
	assert.Contains(t, lossInfo, "previousValue")
}

func TestHistory_ViaGraphQL(t *testing.T) {
	h := testutil.NewHarness(t)
	seedRunWithHistory(h, 100)

	resp := h.GraphQLWithVars(`
		query($entity: String!, $project: String!, $run: String!, $minStep: Int64!, $maxStep: Int64!, $pageSize: Int!) {
			project(name: $project, entityName: $entity) {
				run(name: $run) {
					history(minStep: $minStep, maxStep: $maxStep, samples: $pageSize)
				}
			}
		}
	`, map[string]interface{}{
		"entity":   "admin",
		"project":  "histproj",
		"run":      "histrun",
		"minStep":  0,
		"maxStep":  50,
		"pageSize": 10,
	})

	assert.Nil(t, resp.Path("errors").Value())

	history := resp.Path("data.project.run.history")
	require.True(t, history.Exists())
	assert.Equal(t, 10, len(history.Array()))

	// Each element should be a parseable JSON string.
	first := history.Array()[0].String()
	var parsed map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(first), &parsed))
	assert.Contains(t, parsed, "loss")
}

func TestSampledHistory_ViaGraphQL(t *testing.T) {
	h := testutil.NewHarness(t)
	seedRunWithHistory(h, 100)

	spec, _ := json.Marshal(map[string]interface{}{
		"keys":    []string{"_step", "loss"},
		"minStep": 0,
		"maxStep": 100,
		"samples": 10,
	})

	resp := h.GraphQLWithVars(`
		query($entity: String!, $project: String!, $run: String!, $spec: JSONString!) {
			project(name: $project, entityName: $entity) {
				run(name: $run) {
					sampledHistory(specs: [$spec])
				}
			}
		}
	`, map[string]interface{}{
		"entity":  "admin",
		"project": "histproj",
		"run":     "histrun",
		"spec":    string(spec),
	})

	assert.Nil(t, resp.Path("errors").Value())

	sampled := resp.Path("data.project.run.sampledHistory")
	require.True(t, sampled.Exists())

	// Outer array has one element per spec.
	outerArr := sampled.Array()
	require.Equal(t, 1, len(outerArr))

	// Inner array should have ~10 rows.
	innerArr := outerArr[0].Array()
	assert.Equal(t, 10, len(innerArr))

	// Each row should have _step and loss.
	for _, row := range innerArr {
		assert.True(t, row.Get("_step").Exists())
		assert.True(t, row.Get("loss").Exists())
	}
}

func TestHistory_NullableArgs(t *testing.T) {
	h := testutil.NewHarness(t)
	seedRunWithHistory(h, 10)

	// Query without minStep/maxStep — should return all rows.
	resp := h.GraphQL(`{
		project(name: "histproj", entityName: "admin") {
			run(name: "histrun") {
				history
			}
		}
	}`)

	assert.Nil(t, resp.Path("errors").Value())
	history := resp.Path("data.project.run.history")
	require.True(t, history.Exists())
	assert.Equal(t, 10, len(history.Array()))
}

func TestHistoryKeys_EmptyRun(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("emptyproj", "emptyrun", `{}`)

	resp := h.GraphQL(`{
		project(name: "emptyproj", entityName: "admin") {
			run(name: "emptyrun") {
				historyKeys
			}
		}
	}`)

	assert.Nil(t, resp.Path("errors").Value())

	hkRaw := resp.Path("data.project.run.historyKeys").String()
	var hk map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(hkRaw), &hk))
	assert.Equal(t, float64(0), hk["lastStep"])
}
