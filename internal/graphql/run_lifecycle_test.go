package graphql_test

import (
	"fmt"
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
)

func TestFullInitLogFinishFlow(t *testing.T) {
	h := testutil.NewHarness(t)

	// 1. Viewer (auth check)
	resp := h.GraphQL(`query { viewer { id entity } }`)
	assert.Equal(t, "admin", resp.Path("data.viewer.entity").String())

	// 2. ServerInfo
	resp = h.GraphQL(`query { serverInfo { features { name isEnabled } } }`)
	assert.Nil(t, resp.Path("errors").Value())

	// 3. UpsertBucket (create run)
	resp = h.GraphQL(`mutation {
		upsertBucket(input: {
			name: "e2e-run" modelName: "e2e-project" entityName: "admin"
			config: "{\"lr\": 0.01}"
		}) { bucket { id name project { name } } inserted }
	}`)
	assert.Equal(t, true, resp.Path("data.upsertBucket.inserted").Bool())

	// 4. File stream (log metrics)
	for i := 0; i < 5; i++ {
		h.PostFileStream("admin/e2e-project/e2e-run",
			fmt.Sprintf(`{"files":{"wandb-history.jsonl":{"offset":%d,"content":["{\"loss\":%f,\"_step\":%d}"]}}}`,
				i, 1.0/float64(i+1), i))
	}

	// 5. File stream (complete)
	h.PostFileStream("admin/e2e-project/e2e-run", `{"complete":true,"exitcode":0}`)

	// 6. UpsertBucket (update summary on finish)
	h.GraphQL(`mutation {
		upsertBucket(input: {
			name: "e2e-run" modelName: "e2e-project" entityName: "admin"
			summaryMetrics: "{\"loss\": 0.2}"
		}) { bucket { id } inserted }
	}`)

	// Assert final state
	var run store.Run
	h.DB.First(&run, "name = ?", "e2e-run")
	var histCount int64
	h.DB.Model(&store.RunHistory{}).Where("run_id = ?", run.ID).Count(&histCount)
	assert.Equal(t, "finished", run.State)
	assert.Contains(t, string(run.SummaryMetrics), "loss")
	assert.Equal(t, int64(5), histCount)
	assert.Equal(t, 5, run.HistoryLineCount)
}
