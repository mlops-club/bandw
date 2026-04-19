package server

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/mlops-club/bandw/internal/filestream"
	graphqlhandler "github.com/mlops-club/bandw/internal/graphql"
	"github.com/mlops-club/bandw/internal/storage"
	"gorm.io/gorm"
)

// NewRouter builds the chi router with all routes and middleware.
func NewRouter(db *gorm.DB) chi.Router {
	return NewRouterWithStorage(db, nil)
}

// NewRouterWithStorage builds the chi router with file storage support.
func NewRouterWithStorage(db *gorm.DB, store *storage.LocalStorage) chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)

	// Public routes (no auth required).
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Storage routes (upload requires auth, download can be public for pre-signed URL compat).
	if store != nil {
		r.Group(func(r chi.Router) {
			r.Use(AuthMiddleware(db))
			r.Put("/upload/*", store.UploadHandler())
		})
		r.Get("/storage/*", store.DownloadHandler())
	}

	// Authenticated routes.
	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware(db))

		r.Post("/graphql", graphqlhandler.NewHandlerWithStorage(db, store).ServeHTTP)
		r.Post("/files/{entity}/{project}/{run}/file_stream", filestream.Handler(db))
	})

	return r
}
