package filestream

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// Request is the JSON body sent by the wandb SDK to the file_stream endpoint.
type Request struct {
	Files      map[string]OffsetContent `json:"files,omitempty"`
	Uploaded   []string                 `json:"uploaded,omitempty"`
	Preempting *bool                    `json:"preempting,omitempty"`
	Complete   *bool                    `json:"complete,omitempty"`
	ExitCode   *int32                   `json:"exitcode,omitempty"`
}

// OffsetContent represents a chunk of file data at a given offset.
type OffsetContent struct {
	Offset  int      `json:"offset"`
	Content []string `json:"content"`
}

// NewHandler creates an http.Handler for the file_stream endpoint.
func NewHandler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		entityName := chi.URLParam(r, "entity")
		projectName := chi.URLParam(r, "project")
		runName := chi.URLParam(r, "run")

		// Resolve the run from DB.
		project, err := store.GetProject(db, entityName, projectName)
		if err != nil {
			http.Error(w, "project not found", http.StatusNotFound)
			return
		}
		run, err := store.GetRunByName(db, project.ID, runName)
		if err != nil {
			http.Error(w, "run not found", http.StatusNotFound)
			return
		}

		// Parse request body.
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "failed to read body", http.StatusBadRequest)
			return
		}

		var req Request
		if len(body) > 0 {
			if err := json.Unmarshal(body, &req); err != nil {
				http.Error(w, "invalid JSON", http.StatusBadRequest)
				return
			}
		}

		// Always update heartbeat.
		store.UpdateHeartbeat(db, run.ID)

		// Process file streams.
		for key, fc := range req.Files {
			switch key {
			case "wandb-history.jsonl":
				processHistory(db, run.ID, fc)
			case "wandb-summary.json":
				processSummary(db, run.ID, fc)
			case "wandb-events.jsonl":
				processEvents(db, run.ID, fc)
			case "output.log":
				processLogs(db, run.ID, fc, "stdout")
			default:
				// Ignore unknown file keys.
			}
		}

		// Handle completion.
		if req.Complete != nil && *req.Complete {
			exitCode := int32(0)
			if req.ExitCode != nil {
				exitCode = *req.ExitCode
			}
			store.CompleteRun(db, run.ID, exitCode)
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("{}"))
	}
}

func processHistory(db *gorm.DB, runID string, fc OffsetContent) {
	for _, line := range fc.Content {
		if line == "" {
			continue
		}
		var data map[string]interface{}
		if err := json.Unmarshal([]byte(line), &data); err != nil {
			continue
		}
		step := int64(0)
		if s, ok := data["_step"]; ok {
			switch v := s.(type) {
			case float64:
				step = int64(v)
			case string:
				step, _ = strconv.ParseInt(v, 10, 64)
			}
		}
		store.InsertHistory(db, runID, step, line)
	}
}

func processSummary(db *gorm.DB, runID string, fc OffsetContent) {
	// The summary is typically a single JSON line; use the last one.
	for _, line := range fc.Content {
		if line == "" {
			continue
		}
		store.UpdateSummary(db, runID, line)
	}
}

func processEvents(db *gorm.DB, runID string, fc OffsetContent) {
	for _, line := range fc.Content {
		if line == "" {
			continue
		}
		store.InsertEvent(db, runID, line)
	}
}

func processLogs(db *gorm.DB, runID string, fc OffsetContent, stream string) {
	for i, line := range fc.Content {
		store.InsertLog(db, runID, fc.Offset+i, line, stream)
	}
}
