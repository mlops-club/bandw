package graphql

import gql "github.com/graph-gophers/graphql-go"

// EntityConnectionResolver implements the Relay-style EntityConnection type.
type EntityConnectionResolver struct {
	edges []*EntityEdgeResolver
}

func (c *EntityConnectionResolver) Edges() []*EntityEdgeResolver { return c.edges }
func (c *EntityConnectionResolver) PageInfo() *PageInfoResolver  { return &PageInfoResolver{} }

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

// RunConnectionResolver implements the RunConnection type.
type RunConnectionResolver struct {
	edges      []*RunEdgeResolver
	totalCount int32
	hasNext    bool
}

func (c *RunConnectionResolver) Edges() []*RunEdgeResolver { return c.edges }
func (c *RunConnectionResolver) TotalCount() int32         { return c.totalCount }
func (c *RunConnectionResolver) PageInfo() *PageInfoResolver {
	return &PageInfoResolver{hasNext: c.hasNext}
}

// RunEdgeResolver implements the RunEdge type.
type RunEdgeResolver struct {
	node   *RunResolver
	cursor string
}

func (e *RunEdgeResolver) Node() *RunResolver { return e.node }
func (e *RunEdgeResolver) Cursor() *string    { return strPtr(e.cursor) }

// PageInfoResolver implements the Relay PageInfo type.
type PageInfoResolver struct {
	hasNext bool
}

func (p *PageInfoResolver) HasNextPage() bool     { return p.hasNext }
func (p *PageInfoResolver) HasPreviousPage() bool { return false }
func (p *PageInfoResolver) StartCursor() *string  { return nil }
func (p *PageInfoResolver) EndCursor() *string    { return nil }
