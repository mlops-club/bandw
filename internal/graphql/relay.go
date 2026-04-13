package graphql

import gql "github.com/graph-gophers/graphql-go"

// EntityConnectionResolver implements the Relay-style EntityConnection type.
type EntityConnectionResolver struct {
	edges []*EntityEdgeResolver
}

func (c *EntityConnectionResolver) Edges() []*EntityEdgeResolver { return c.edges }
func (c *EntityConnectionResolver) PageInfo() *PageInfoResolver   { return &PageInfoResolver{} }

// EntityEdgeResolver implements the EntityEdge type.
type EntityEdgeResolver struct {
	node   *EntityResolver
	cursor string
}

func (e *EntityEdgeResolver) Node() *EntityResolver { return e.node }
func (e *EntityEdgeResolver) Cursor() *string       { return strPtr(e.cursor) }

// EntityResolver implements the Entity type.
type EntityResolver struct {
	id   string
	name string
}

func (e *EntityResolver) ID() gql.ID   { return gql.ID(e.id) }
func (e *EntityResolver) Name() string { return e.name }

// PageInfoResolver implements the Relay PageInfo type.
type PageInfoResolver struct{}

func (p *PageInfoResolver) HasNextPage() bool     { return false }
func (p *PageInfoResolver) HasPreviousPage() bool { return false }
func (p *PageInfoResolver) StartCursor() *string  { return nil }
func (p *PageInfoResolver) EndCursor() *string    { return nil }
