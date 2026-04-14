package testutil

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mlops-club/bandw/internal/server"
	"github.com/mlops-club/bandw/internal/store"
	"github.com/tidwall/gjson"
	"gorm.io/gorm"
)

// Harness provides an in-process test server backed by in-memory SQLite.
type Harness struct {
	BaseURL string
	DB      *gorm.DB
	APIKey  string
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

	router := server.NewRouter(db)
	srv := httptest.NewServer(router)

	t.Cleanup(func() { srv.Close() })

	return &Harness{
		BaseURL: srv.URL,
		DB:      db,
		APIKey:  "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5",
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
