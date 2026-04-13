package graphql

import (
	"net/http"

	gql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"gorm.io/gorm"
)

// NewHandler creates an http.Handler that serves the GraphQL API.
func NewHandler(db *gorm.DB) http.Handler {
	schema := gql.MustParseSchema(SchemaString, NewResolver(db))
	return &relay.Handler{Schema: schema}
}
