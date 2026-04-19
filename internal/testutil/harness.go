package testutil

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mlops-club/bandw/internal/server"
	"github.com/mlops-club/bandw/internal/storage"
	"github.com/mlops-club/bandw/internal/store"
	"github.com/tidwall/gjson"
	"gorm.io/gorm"
)

// Harness provides an in-process test server backed by in-memory SQLite.
type Harness struct {
	BaseURL string
	DB      *gorm.DB
	APIKey  string
	Storage *storage.LocalStorage
	srv     *httptest.Server
}

// NewHarness creates a fresh test harness with its own DB and HTTP server.
func NewHarness(t *testing.T) *Harness {
	t.Helper()

	db, err := store.NewSQLiteDB()
	if err != nil {
		t.Fatalf("failed to create SQLite DB: %v", err)
	}
	if err := store.AutoMigrate(db); err != nil {
		t.Fatalf("failed to auto-migrate: %v", err)
	}
	if err := store.SeedDefaults(db); err != nil {
		t.Fatalf("failed to seed defaults: %v", err)
	}

	// Create a temp directory for file storage.
	storageDir := t.TempDir()

	// We need to create the server first to get the URL, but storage needs the URL.
	// Use a placeholder URL first, then update after server starts.
	localStorage, err := storage.NewLocalStorage(storageDir, "http://placeholder")
	if err != nil {
		t.Fatalf("failed to create local storage: %v", err)
	}

	router := server.NewRouterWithStorage(db, localStorage)
	srv := httptest.NewServer(router)

	// Now update the BaseURL on the storage so upload/download URLs are correct.
	localStorage.BaseURL = srv.URL

	t.Cleanup(func() { srv.Close() })

	return &Harness{
		BaseURL: srv.URL,
		DB:      db,
		APIKey:  "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5", //#nosec G101 -- test-only API key for local dev server
		Storage: localStorage,
		srv:     srv,
	}
}

// Close shuts down the test server.
func (h *Harness) Close() {
	h.srv.Close()
}

// GQLResponse wraps a GraphQL JSON response for path-based access.
type GQLResponse struct {
	Body []byte
}

// Path returns the gjson result at the given dot-separated path.
func (r *GQLResponse) Path(path string) gjson.Result {
	return gjson.GetBytes(r.Body, path)
}

// SeedRun creates a project and run via direct GORM inserts for test setup.
// Uses the seeded "admin" entity.
func (h *Harness) SeedRun(projectName, runName, config string) {
	var entity store.Entity
	if err := h.DB.Where("name = ?", "admin").First(&entity).Error; err != nil {
		panic("SeedRun: failed to find admin entity: " + err.Error())
	}
	var user store.User
	if err := h.DB.Where("username = ?", "admin").First(&user).Error; err != nil {
		panic("SeedRun: failed to find admin user: " + err.Error())
	}

	project := store.Project{
		Name:      projectName,
		EntityID:  entity.ID,
		CreatedBy: user.ID,
	}
	// Ignore duplicate errors (project may already exist).
	h.DB.Where("entity_id = ? AND name = ?", entity.ID, projectName).FirstOrCreate(&project)

	run := store.Run{
		Name:      runName,
		ProjectID: project.ID,
		UserID:    user.ID,
		State:     "running",
	}
	if config != "" {
		run.Config = []byte(config)
	}
	if err := h.DB.Create(&run).Error; err != nil {
		panic("SeedRun: failed to create run: " + err.Error())
	}
}

// PostFileStream sends an authenticated POST to the file_stream endpoint.
func (h *Harness) PostFileStream(path, body string) *http.Response {
	req, _ := http.NewRequest("POST", h.BaseURL+"/files/"+path+"/file_stream",
		bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth("api", h.APIKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic("PostFileStream request failed: " + err.Error())
	}
	_ = resp.Body.Close()
	return resp
}

// GraphQL sends an authenticated GraphQL POST and returns the parsed response.
func (h *Harness) GraphQL(query string) *GQLResponse {
	payload, _ := json.Marshal(map[string]string{"query": query})
	req, _ := http.NewRequest("POST", h.BaseURL+"/graphql", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth("api", h.APIKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic("GraphQL request failed: " + err.Error())
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return &GQLResponse{Body: body}
}

// GraphQLWithVars sends an authenticated GraphQL POST with variables and returns the parsed response.
func (h *Harness) GraphQLWithVars(query string, vars map[string]interface{}) *GQLResponse {
	payload, _ := json.Marshal(map[string]interface{}{
		"query":     query,
		"variables": vars,
	})
	req, _ := http.NewRequest("POST", h.BaseURL+"/graphql", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth("api", h.APIKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic("GraphQLWithVars request failed: " + err.Error())
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return &GQLResponse{Body: body}
}

// SeedHistoryViaFileStream seeds history rows for a run using the file_stream endpoint.
// Each row is a map that will be JSON-encoded as a history line.
func (h *Harness) SeedHistoryViaFileStream(entityName, projectName, runName string, rows []map[string]interface{}) {
	lines := make([]string, 0, len(rows))
	for _, row := range rows {
		b, _ := json.Marshal(row)
		lines = append(lines, string(b))
	}
	linesJSON, _ := json.Marshal(lines)
	body := `{"files":{"wandb-history.jsonl":{"offset":0,"content":` + string(linesJSON) + `}}}`
	path := entityName + "/" + projectName + "/" + runName
	resp := h.PostFileStream(path, body)
	if resp.StatusCode != 200 {
		panic("SeedHistoryViaFileStream: unexpected status " + resp.Status)
	}
}

// PutFile uploads file content to the given URL with authentication.
func (h *Harness) PutFile(url string, content []byte) *http.Response {
	req, _ := http.NewRequest("PUT", url, bytes.NewReader(content))
	req.Header.Set("Content-Type", "application/octet-stream")
	req.SetBasicAuth("api", h.APIKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic("PutFile request failed: " + err.Error())
	}
	_ = resp.Body.Close()
	return resp
}

// GetFile downloads file content from the given URL.
func (h *Harness) GetFile(url string) ([]byte, int) {
	req, _ := http.NewRequest("GET", url, nil) //#nosec G107 -- test helper, URL is controlled
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic("GetFile request failed: " + err.Error())
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return body, resp.StatusCode
}
