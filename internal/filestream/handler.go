package filestream

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Request is the JSON body sent by the wandb SDK to the file_stream endpoint.
type Request struct {
	Files    map[string]FileData `json:"files,omitempty"`
	Complete *bool               `json:"complete,omitempty"`
	ExitCode *int                `json:"exitcode,omitempty"`
}

// FileData holds offset and content lines for a single file in the request.
type FileData struct {
	Offset  int      `json:"offset"`
	Content []string `json:"content"`
}

// Handler returns an http.HandlerFunc for POST /files/{entity}/{project}/{run}/file_stream.
func Handler(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		entityName := chi.URLParam(r, "entity")
		projectName := chi.URLParam(r, "project")
		runName := chi.URLParam(r, "run")

		// Look up entity → project → run.
		var entity store.Entity
		if err := db.Where("name = ?", entityName).First(&entity).Error; err != nil {
			http.Error(w, "entity not found", http.StatusNotFound)
			return
		}
		var project store.Project
		if err := db.Where("entity_id = ? AND name = ?", entity.ID, projectName).First(&project).Error; err != nil {
			http.Error(w, "project not found", http.StatusNotFound)
			return
		}
		var run store.Run
		if err := db.Where("project_id = ? AND name = ?", project.ID, runName).First(&run).Error; err != nil {
			http.Error(w, "run not found", http.StatusNotFound)
			return
		}

		var req Request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		updates := map[string]interface{}{
			"heartbeat_at": time.Now(),
		}

		for key, fd := range req.Files {
			switch key {
			case "wandb-history.jsonl":
				for _, line := range fd.Content {
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
					db.Create(&store.RunHistory{RunID: run.ID, Step: step, Data: datatypes.JSON(line)})
				}
				updates["history_line_count"] = gorm.Expr("history_line_count + ?", len(fd.Content))

			case "wandb-summary.json":
				if len(fd.Content) > 0 {
					updates["summary_metrics"] = datatypes.JSON(fd.Content[len(fd.Content)-1])
				}

			case "wandb-events.jsonl":
				for _, line := range fd.Content {
					db.Create(&store.RunEvent{RunID: run.ID, Data: datatypes.JSON(line)})
				}
				updates["events_line_count"] = gorm.Expr("events_line_count + ?", len(fd.Content))

			case "output.log":
				for i, line := range fd.Content {
					db.Create(&store.RunLog{RunID: run.ID, LineNum: fd.Offset + i, Content: line})
				}
				updates["log_line_count"] = gorm.Expr("log_line_count + ?", len(fd.Content))
			}
		}

		if req.Complete != nil && *req.Complete {
			if req.ExitCode != nil && *req.ExitCode != 0 {
				updates["state"] = "crashed"
			} else {
				updates["state"] = "finished"
			}
			updates["exit_code"] = req.ExitCode
		}

		db.Model(&run).Updates(updates)

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("{}"))
	}
}
