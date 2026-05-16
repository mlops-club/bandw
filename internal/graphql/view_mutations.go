package graphql

import (
	"context"
	"fmt"
	"strconv"

	gql "github.com/graph-gophers/graphql-go"
	"github.com/mlops-club/bandw/internal/authctx"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// ─── Input types ─────────────────────────────────────────────────

type upsertViewInput struct {
	ID          *string
	Name        *string
	DisplayName *string
	Description *string
	EntityName  string
	ProjectName string
	Type        *string
	Spec        *JSONString
}

type deleteViewInput struct {
	ID gql.ID
}

// ─── Mutation resolvers ─────────────────────────────────────────

// UpsertView resolves Mutation.upsertView.
func (r *Resolver) UpsertView(ctx context.Context, args struct{ Input upsertViewInput }) (*UpsertViewPayloadResolver, error) {
	user := authctx.UserFromContext(ctx)
	input := args.Input

	// Get or create the project.
	project, err := store.GetOrCreateProject(r.db, input.EntityName, input.ProjectName, user.ID)
	if err != nil {
		return nil, fmt.Errorf("project lookup failed: %w", err)
	}

	var view store.View

	if input.ID != nil && *input.ID != "" {
		// Update existing view.
		if err := r.db.First(&view, "id = ?", *input.ID).Error; err != nil {
			return nil, fmt.Errorf("view not found: %w", err)
		}
		if input.Name != nil {
			view.Name = *input.Name
		}
		if input.DisplayName != nil {
			view.DisplayName = *input.DisplayName
		}
		if input.Description != nil {
			view.Description = *input.Description
		}
		if input.Type != nil {
			view.Type = *input.Type
		}
		if input.Spec != nil {
			view.Spec = []byte(input.Spec.Value)
		}
		if err := r.db.Save(&view).Error; err != nil {
			return nil, fmt.Errorf("failed to update view: %w", err)
		}
	} else {
		// Create new view.
		view = store.View{
			ProjectID: project.ID,
			UserID:    user.ID,
		}
		if input.Name != nil {
			view.Name = *input.Name
		}
		if input.DisplayName != nil {
			view.DisplayName = *input.DisplayName
		}
		if input.Description != nil {
			view.Description = *input.Description
		}
		if input.Type != nil {
			view.Type = *input.Type
		}
		if input.Spec != nil {
			view.Spec = []byte(input.Spec.Value)
		}
		if err := r.db.Create(&view).Error; err != nil {
			return nil, fmt.Errorf("failed to create view: %w", err)
		}
	}

	return &UpsertViewPayloadResolver{view: &view, db: r.db}, nil
}

// DeleteView resolves Mutation.deleteView.
func (r *Resolver) DeleteView(args struct{ Input deleteViewInput }) (*DeleteViewPayloadResolver, error) {
	id := string(args.Input.ID)
	if err := r.db.Delete(&store.View{}, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("failed to delete view: %w", err)
	}
	return &DeleteViewPayloadResolver{success: true}, nil
}

// ─── AllViews on ProjectResolver ────────────────────────────────

func (p *ProjectResolver) AllViews(args struct {
	ViewType *string
	ViewName *string
	First    *int32
	After    *string
}) (*ViewConnectionResolver, error) {
	q := p.db.Where("project_id = ?", p.project.ID)
	if args.ViewType != nil {
		q = q.Where("type = ?", *args.ViewType)
	}
	if args.ViewName != nil {
		q = q.Where("name = ?", *args.ViewName)
	}

	limit := 50
	if args.First != nil {
		limit = int(*args.First)
	}
	offset := 0
	if args.After != nil {
		offset, _ = strconv.Atoi(*args.After)
	}

	var views []store.View
	if err := q.Order("created_at ASC").Limit(limit).Offset(offset).Find(&views).Error; err != nil {
		return nil, err
	}

	// Check if there are more.
	var total int64
	countQ := p.db.Model(&store.View{}).Where("project_id = ?", p.project.ID)
	if args.ViewType != nil {
		countQ = countQ.Where("type = ?", *args.ViewType)
	}
	if args.ViewName != nil {
		countQ = countQ.Where("name = ?", *args.ViewName)
	}
	countQ.Count(&total)

	edges := make([]*ViewEdgeResolver, len(views))
	for i := range views {
		edges[i] = &ViewEdgeResolver{
			node:   &ViewResolver{view: &views[i], db: p.db},
			cursor: fmt.Sprintf("%d", offset+i+1),
		}
	}

	return &ViewConnectionResolver{
		edges:   edges,
		hasNext: int64(offset+limit) < total,
	}, nil
}

// ─── Payload resolvers ──────────────────────────────────────────

// UpsertViewPayloadResolver implements the UpsertViewPayload type.
type UpsertViewPayloadResolver struct {
	view *store.View
	db   *gorm.DB
}

func (p *UpsertViewPayloadResolver) View() *ViewResolver {
	if p.view == nil {
		return nil
	}
	return &ViewResolver{view: p.view, db: p.db}
}

// DeleteViewPayloadResolver implements the DeleteViewPayload type.
type DeleteViewPayloadResolver struct {
	success bool
}

func (p *DeleteViewPayloadResolver) Success() bool { return p.success }
