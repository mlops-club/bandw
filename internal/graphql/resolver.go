package graphql

import (
	"context"

	"github.com/mlops-club/bandw/internal/authctx"
	"github.com/mlops-club/bandw/internal/storage"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// Resolver is the root GraphQL resolver.
type Resolver struct {
	db    *gorm.DB
	store *storage.LocalStorage
}

// NewResolver creates a root resolver backed by the given database.
func NewResolver(db *gorm.DB) *Resolver {
	return &Resolver{db: db}
}

// NewResolverWithStorage creates a root resolver with file storage support.
func NewResolverWithStorage(db *gorm.DB, s *storage.LocalStorage) *Resolver {
	return &Resolver{db: db, store: s}
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

// Model resolves Query.model — legacy alias for project lookup.
func (r *Resolver) Model(args struct {
	Name       *string
	EntityName *string
}) (*ProjectResolver, error) {
	return r.resolveProject(args.Name, args.EntityName)
}

// Project resolves Query.project — modern project lookup.
func (r *Resolver) Project(args struct {
	Name       *string
	EntityName *string
}) (*ProjectResolver, error) {
	return r.resolveProject(args.Name, args.EntityName)
}

// Projects resolves Query.projects — returns all projects for an entity.
func (r *Resolver) Projects(args struct {
	EntityName string
}) (*ProjectConnectionResolver, error) {
	projects, err := store.ListProjects(r.db, args.EntityName)
	if err != nil {
		return nil, err
	}
	edges := make([]*ProjectEdgeResolver, len(projects))
	for i, p := range projects {
		proj := p
		edges[i] = &ProjectEdgeResolver{
			node:   &ProjectResolver{project: &proj, db: r.db},
			cursor: proj.ID,
		}
	}
	return &ProjectConnectionResolver{edges: edges}, nil
}

func (r *Resolver) resolveProject(name, entityName *string) (*ProjectResolver, error) {
	if name == nil || entityName == nil {
		return nil, nil
	}
	project, err := store.GetProjectByEntityAndName(r.db, *entityName, *name)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &ProjectResolver{project: project, db: r.db}, nil
}
