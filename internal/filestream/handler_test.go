package filestream_test

import (
	"net/http"
	"strings"
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
)

func TestFileStreamIngestsHistory(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)
	h.PostFileStream("admin/proj/run1", `{
		"files": {
			"wandb-history.jsonl": {
				"offset": 0,
				"content": ["{\"loss\": 0.5, \"_step\": 0}", "{\"loss\": 0.3, \"_step\": 1}"]
			}
		}
	}`)
	var run store.Run
	h.DB.First(&run, "name = ?", "run1")
	var count int64
	h.DB.Model(&store.RunHistory{}).Where("run_id = ?", run.ID).Count(&count)
	assert.Equal(t, int64(2), count)
	assert.Equal(t, 2, run.HistoryLineCount)
}

func TestFileStreamUpdatesSummary(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)
	h.PostFileStream("admin/proj/run1", `{
		"files": {
			"wandb-summary.json": {
				"offset": 0,
				"content": ["{\"loss\": 0.1, \"best\": true}"]
			}
		}
	}`)
	var run store.Run
	h.DB.First(&run, "name = ?", "run1")
	assert.Contains(t, string(run.SummaryMetrics), "0.1")
}

func TestFileStreamIngestsLogs(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)
	h.PostFileStream("admin/proj/run1", `{
		"files": {
			"output.log": {
				"offset": 0,
				"content": ["Epoch 1 started\n", "Epoch 1 done\n"]
			}
		}
	}`)
	var run store.Run
	h.DB.First(&run, "name = ?", "run1")
	var count int64
	h.DB.Model(&store.RunLog{}).Where("run_id = ?", run.ID).Count(&count)
	assert.Equal(t, int64(2), count)
	assert.Equal(t, 2, run.LogLineCount)
}

func TestFileStreamIngestsSystemEvents(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)
	h.PostFileStream("admin/proj/run1", `{
		"files": {
			"wandb-events.jsonl": {
				"offset": 0,
				"content": ["{\"cpu\": 45.2, \"gpu.0.gpu\": 98.1}"]
			}
		}
	}`)
	var run store.Run
	h.DB.First(&run, "name = ?", "run1")
	var count int64
	h.DB.Model(&store.RunEvent{}).Where("run_id = ?", run.ID).Count(&count)
	assert.Equal(t, int64(1), count)
	assert.Equal(t, 1, run.EventsLineCount)
}

func TestFileStreamHeartbeatUpdatesTimestamp(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)
	resp := h.PostFileStream("admin/proj/run1", `{}`)
	assert.Equal(t, 200, resp.StatusCode)
	var run store.Run
	h.DB.First(&run, "name = ?", "run1")
	assert.NotNil(t, run.HeartbeatAt)
}

func TestFileStreamCompletionSetsFinished(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)
	h.PostFileStream("admin/proj/run1", `{"complete": true, "exitcode": 0}`)
	var run store.Run
	h.DB.First(&run, "name = ?", "run1")
	assert.Equal(t, "finished", run.State)
}

func TestFileStreamNonZeroExitSetsCrashed(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)
	h.PostFileStream("admin/proj/run1", `{"complete": true, "exitcode": 1}`)
	var run store.Run
	h.DB.First(&run, "name = ?", "run1")
	assert.Equal(t, "crashed", run.State)
}

func TestFileStreamRequiresAuth(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)
	resp, err := http.Post(h.BaseURL+"/files/admin/proj/run1/file_stream",
		"application/json", strings.NewReader(`{}`))
	assert.NoError(t, err)
	resp.Body.Close()
	assert.Equal(t, 401, resp.StatusCode)
}

func TestFileStreamMultipleFilesInOneRequest(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)
	h.PostFileStream("admin/proj/run1", `{
		"files": {
			"wandb-history.jsonl": {"offset": 0, "content": ["{\"loss\": 0.5, \"_step\": 0}"]},
			"wandb-summary.json": {"offset": 0, "content": ["{\"loss\": 0.5}"]},
			"output.log": {"offset": 0, "content": ["hello\n"]}
		}
	}`)
	var run store.Run
	h.DB.First(&run, "name = ?", "run1")
	var histCount, logCount int64
	h.DB.Model(&store.RunHistory{}).Where("run_id = ?", run.ID).Count(&histCount)
	h.DB.Model(&store.RunLog{}).Where("run_id = ?", run.ID).Count(&logCount)
	assert.Equal(t, int64(1), histCount)
	assert.Equal(t, int64(1), logCount)
	assert.Contains(t, string(run.SummaryMetrics), "0.5")
}
