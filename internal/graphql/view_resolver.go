package graphql

import (
	gql "github.com/graph-gophers/graphql-go"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// ViewResolver implements the GraphQL View type.
type ViewResolver struct {
	view *store.View
	db   *gorm.DB
}

func (v *ViewResolver) ID() gql.ID           { return gql.ID(v.view.ID) }
func (v *ViewResolver) Name() *string        { return strPtr(v.view.Name) }
func (v *ViewResolver) DisplayName() *string { return strPtr(v.view.DisplayName) }
func (v *ViewResolver) Type() *string        { return strPtr(v.view.Type) }
func (v *ViewResolver) Description() *string { return strPtr(v.view.Description) }

func (v *ViewResolver) Spec() *JSONString {
	s := string(v.view.Spec)
	if s == "" || s == "null" {
		return nil
	}
	return &JSONString{Value: s}
}

func (v *ViewResolver) Project() (*ProjectResolver, error) {
	var project store.Project
	if err := v.db.First(&project, "id = ?", v.view.ProjectID).Error; err != nil {
		return nil, err
	}
	return &ProjectResolver{project: &project, db: v.db}, nil
}

func (v *ViewResolver) User() (*UserResolver, error) {
	if v.view.UserID == "" {
		return nil, nil
	}
	var user store.User
	if err := v.db.First(&user, "id = ?", v.view.UserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	entity, _ := store.GetEntityByUserID(v.db, user.ID)
	return &UserResolver{user: &user, entity: entity}, nil
}

func (v *ViewResolver) CreatedAt() *DateTime {
	return timeToDateTime(v.view.CreatedAt)
}

func (v *ViewResolver) UpdatedAt() *DateTime {
	return timeToDateTime(v.view.UpdatedAt)
}

// ViewConnectionResolver implements the GraphQL ViewConnection type.
type ViewConnectionResolver struct {
	edges   []*ViewEdgeResolver
	hasNext bool
}

func (c *ViewConnectionResolver) Edges() []*ViewEdgeResolver { return c.edges }
func (c *ViewConnectionResolver) PageInfo() *PageInfoResolver {
	return &PageInfoResolver{hasNext: c.hasNext}
}

// ViewEdgeResolver implements the GraphQL ViewEdge type.
type ViewEdgeResolver struct {
	node   *ViewResolver
	cursor string
}

func (e *ViewEdgeResolver) Node() *ViewResolver { return e.node }
func (e *ViewEdgeResolver) Cursor() *string     { return &e.cursor }
