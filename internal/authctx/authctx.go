package authctx

import (
	"context"

	"github.com/mlops-club/bandw/internal/store"
)

type contextKey string

const userContextKey contextKey = "user"

// WithUser returns a new context carrying the authenticated user.
func WithUser(ctx context.Context, user *store.User) context.Context {
	return context.WithValue(ctx, userContextKey, user)
}

// UserFromContext extracts the authenticated user from the request context.
func UserFromContext(ctx context.Context) *store.User {
	u, _ := ctx.Value(userContextKey).(*store.User)
	return u
}
