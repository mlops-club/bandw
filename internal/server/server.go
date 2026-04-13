package server

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/mlops-club/bandw/internal/filestream"
	graphqlhandler "github.com/mlops-club/bandw/internal/graphql"
	"gorm.io/gorm"
)

// NewRouter builds the chi router with all routes and middleware.
func NewRouter(db *gorm.DB) chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)

	// Public routes (no auth required).
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Authenticated routes.
	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware(db))

		r.Post("/graphql", graphqlhandler.NewHandler(db).ServeHTTP)
		r.Post("/files/{entity}/{project}/{run}/file_stream", filestream.NewHandler(db))
	})

	return r
}
