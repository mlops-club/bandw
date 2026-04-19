package graphql

import (
	"fmt"
	"strconv"

	gql "github.com/graph-gophers/graphql-go"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// ProjectResolver implements the GraphQL Project type.
type ProjectResolver struct {
	project *store.Project
	db      *gorm.DB
}

func (p *ProjectResolver) ID() gql.ID           { return gql.ID(p.project.ID) }
func (p *ProjectResolver) Name() string         { return p.project.Name }
func (p *ProjectResolver) Description() *string { return strPtr(p.project.Description) }
func (p *ProjectResolver) IsBenchmark() *bool   { return nil }
func (p *ProjectResolver) ReadOnly() *bool      { return nil }

func (p *ProjectResolver) CreatedAt() *DateTime {
	return timeToDateTime(p.project.CreatedAt)
}

func (p *ProjectResolver) EntityName() *string {
	var entity store.Entity
	if err := p.db.First(&entity, "id = ?", p.project.EntityID).Error; err != nil {
		return nil
	}
	return &entity.Name
}

func (p *ProjectResolver) Entity() (*EntityResolver, error) {
	var entity store.Entity
	if err := p.db.First(&entity, "id = ?", p.project.EntityID).Error; err != nil {
		return nil, err
	}
	return &EntityResolver{id: entity.ID, name: entity.Name}, nil
}

// Bucket resolves Project.bucket(name) — legacy alias for a single run lookup.
func (p *ProjectResolver) Bucket(args struct {
	Name      string
	MissingOk *bool
}) (*RunResolver, error) {
	run, err := store.GetRunByName(p.db, p.project.ID, args.Name)
	if err != nil {
		if err == gorm.ErrRecordNotFound && args.MissingOk != nil && *args.MissingOk {
			return nil, nil
		}
		return nil, err
	}
	return &RunResolver{run: run, db: p.db}, nil
}

// Run resolves Project.run(name).
func (p *ProjectResolver) Run(args struct{ Name string }) (*RunResolver, error) {
	run, err := store.GetRunByName(p.db, p.project.ID, args.Name)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &RunResolver{run: run, db: p.db}, nil
}

// Runs resolves Project.runs with Relay-style pagination.
func (p *ProjectResolver) Runs(args struct {
	First *int32
	After *string
	Order *string
}) (*RunConnectionResolver, error) {
	limit := 50
	if args.First != nil {
		limit = int(*args.First)
	}
	offset := 0
	if args.After != nil {
		offset, _ = strconv.Atoi(*args.After)
	}
	order := ""
	if args.Order != nil {
		order = *args.Order
	}

	runs, total, err := store.ListRuns(p.db, p.project.ID, limit, offset, order)
	if err != nil {
		return nil, err
	}

	edges := make([]*RunEdgeResolver, len(runs))
	for i, r := range runs {
		run := r
		edges[i] = &RunEdgeResolver{
			node:   &RunResolver{run: &run, db: p.db},
			cursor: fmt.Sprintf("%d", offset+i+1),
		}
	}

	return &RunConnectionResolver{
		edges:      edges,
		totalCount: safeInt64ToInt32(total),
		hasNext:    int64(offset+limit) < total,
	}, nil
}
