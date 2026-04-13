package server

import (
	"net/http"

	"github.com/mlops-club/bandw/internal/authctx"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// AuthMiddleware validates Basic auth credentials against the api_keys table.
// Requests without valid credentials receive a 401 response.
func AuthMiddleware(db *gorm.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, key, ok := r.BasicAuth()
			if !ok {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			user, err := store.GetUserByAPIKey(db, key)
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			ctx := authctx.WithUser(r.Context(), user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
