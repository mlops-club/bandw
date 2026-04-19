package graphql

import (
	"net/http"

	gql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"github.com/mlops-club/bandw/internal/storage"
	"gorm.io/gorm"
)

// NewHandler creates an http.Handler that serves the GraphQL API.
func NewHandler(db *gorm.DB) http.Handler {
	return NewHandlerWithStorage(db, nil)
}

// NewHandlerWithStorage creates a GraphQL handler with file storage support.
func NewHandlerWithStorage(db *gorm.DB, store *storage.LocalStorage) http.Handler {
	schema := gql.MustParseSchema(SchemaString, NewResolverWithStorage(db, store))
	return &relay.Handler{Schema: schema}
}
