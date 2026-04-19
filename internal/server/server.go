package server

import (
	"encoding/json"
	"io/fs"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/mlops-club/bandw/internal/filestream"
	graphqlhandler "github.com/mlops-club/bandw/internal/graphql"
	"github.com/mlops-club/bandw/internal/storage"
	"gorm.io/gorm"
)

// NewRouter builds the chi router with all routes and middleware (no storage).
func NewRouter(db *gorm.DB, staticFS ...fs.FS) chi.Router {
	return NewRouterWithStorage(db, nil, staticFS...)
}

// NewRouterWithStorage builds the chi router with file storage support.
// staticFS is optional — if non-nil, static files are served as a catch-all
// with SPA fallback (serves index.html for non-file paths).
func NewRouterWithStorage(db *gorm.DB, store *storage.LocalStorage, staticFS ...fs.FS) chi.Router {
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

	// Static file serving with SPA fallback.
	if len(staticFS) > 0 && staticFS[0] != nil {
		r.NotFound(spaHandler(staticFS[0]))
	}

	return r
}

// spaHandler serves static files from the given FS, falling back to index.html
// for paths that don't match a file (SPA client-side routing).
func spaHandler(static fs.FS) http.HandlerFunc {
	fileServer := http.FileServer(http.FS(static))
	return func(w http.ResponseWriter, r *http.Request) {
		// Try to open the requested file.
		path := r.URL.Path
		if path == "/" {
			path = "index.html"
		} else if path[0] == '/' {
			path = path[1:]
		}
		_, err := fs.Stat(static, path)
		if err != nil {
			// File not found — serve index.html for SPA routing.
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	}
}
