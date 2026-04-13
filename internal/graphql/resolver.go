package graphql

import (
	"context"

	"github.com/mlops-club/bandw/internal/authctx"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// Resolver is the root GraphQL resolver.
type Resolver struct {
	db *gorm.DB
}

// NewResolver creates a root resolver backed by the given database.
func NewResolver(db *gorm.DB) *Resolver {
	return &Resolver{db: db}
}

// Viewer resolves Query.viewer — returns the authenticated user.
func (r *Resolver) Viewer(ctx context.Context) (*UserResolver, error) {
	user := authctx.UserFromContext(ctx)
	entity, err := store.GetEntityByUserID(r.db, user.ID)
	if err != nil {
		return nil, err
	}
	return &UserResolver{user: user, entity: entity}, nil
}

// ServerInfo resolves Query.serverInfo — returns static server metadata.
func (r *Resolver) ServerInfo() *ServerInfoResolver {
	return &ServerInfoResolver{}
}
