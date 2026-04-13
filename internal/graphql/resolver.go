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

// Model resolves Query.model — returns a project by name (legacy SDK alias).
func (r *Resolver) Model(args struct{ Name, EntityName string }) (*ProjectResolver, error) {
	project, err := store.GetProject(r.db, args.EntityName, args.Name)
	if err != nil {
		return nil, err
	}
	var entity store.Entity
	if err := r.db.First(&entity, "id = ?", project.EntityID).Error; err != nil {
		return nil, err
	}
	return &ProjectResolver{project: project, entity: &entity, db: r.db}, nil
}

// Models resolves Query.models — returns projects for an entity.
func (r *Resolver) Models(args struct {
	EntityName string
	First      *int32
	After      *string
}) (*ProjectConnectionResolver, error) {
	var entity store.Entity
	if err := r.db.Where("name = ?", args.EntityName).First(&entity).Error; err != nil {
		return nil, err
	}
	var projects []store.Project
	r.db.Where("entity_id = ?", entity.ID).Order("created_at DESC").Find(&projects)
	edges := make([]*ProjectEdgeResolver, len(projects))
	for i := range projects {
		edges[i] = &ProjectEdgeResolver{
			node: &ProjectResolver{project: &projects[i], entity: &entity, db: r.db},
		}
	}
	return &ProjectConnectionResolver{edges: edges}, nil
}
