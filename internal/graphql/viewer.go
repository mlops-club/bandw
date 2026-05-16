package graphql

import (
	gql "github.com/graph-gophers/graphql-go"
	"github.com/mlops-club/bandw/internal/store"
)

// UserResolver implements the GraphQL User type.
type UserResolver struct {
	user   *store.User
	entity *store.Entity
}

func (u *UserResolver) ID() gql.ID         { return gql.ID(u.user.ID) }
func (u *UserResolver) Entity() *string    { return &u.entity.Name }
func (u *UserResolver) Username() *string  { return strPtr(u.user.Username) }
func (u *UserResolver) Email() *string     { return strPtr(u.user.Email) }
func (u *UserResolver) Name() *string      { return strPtr(u.user.Name) }
func (u *UserResolver) Admin() *bool       { b := false; return &b }
func (u *UserResolver) Flags() *JSONString  { return &JSONString{Value: "{}"} }
func (u *UserResolver) DeletedAt() *DateTime { return nil }

func (u *UserResolver) ApiKeys() *ApiKeyConnectionResolver {
	return &ApiKeyConnectionResolver{}
}

func (u *UserResolver) Teams() *EntityConnectionResolver {
	return &EntityConnectionResolver{edges: []*EntityEdgeResolver{}}
}

// ApiKeyConnectionResolver implements the ApiKeyConnection type.
type ApiKeyConnectionResolver struct{}

func (c *ApiKeyConnectionResolver) Edges() []*ApiKeyEdgeResolver { return nil }

// ApiKeyEdgeResolver implements the ApiKeyEdge type.
type ApiKeyEdgeResolver struct{}

func (e *ApiKeyEdgeResolver) Node() *ApiKeyResolver { return &ApiKeyResolver{} }

// ApiKeyResolver implements the ApiKey type.
type ApiKeyResolver struct{}

func (k *ApiKeyResolver) ID() gql.ID        { return gql.ID("") }
func (k *ApiKeyResolver) Name() *string     { return nil }
func (k *ApiKeyResolver) Description() *string { return nil }
