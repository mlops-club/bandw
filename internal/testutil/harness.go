package testutil

import (
	"net/http/httptest"
	"testing"

	"github.com/mlops-club/bandw/internal/server"
	"github.com/mlops-club/bandw/internal/store"
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

	router := server.NewRouter(db)
	srv := httptest.NewServer(router)

	t.Cleanup(func() { srv.Close() })

	return &Harness{
		BaseURL: srv.URL,
		DB:      db,
		APIKey:  "test-api-key-000",
		srv:     srv,
	}
}

// Close shuts down the test server.
func (h *Harness) Close() {
	h.srv.Close()
}
