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

func (u *UserResolver) ID() gql.ID      { return gql.ID(u.user.ID) }
func (u *UserResolver) Entity() *string  { return &u.entity.Name }
func (u *UserResolver) Username() *string { return strPtr(u.user.Username) }
func (u *UserResolver) Email() *string   { return strPtr(u.user.Email) }
func (u *UserResolver) Name() *string    { return strPtr(u.user.Name) }
func (u *UserResolver) Flags() *JSONString { return nil }

func (u *UserResolver) Teams() *EntityConnectionResolver {
	return &EntityConnectionResolver{edges: []*EntityEdgeResolver{}}
}
