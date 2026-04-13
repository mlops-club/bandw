package graphql

import (
	"context"
	"encoding/json"

	"github.com/mlops-club/bandw/internal/authctx"
	"github.com/mlops-club/bandw/internal/store"
)

type upsertBucketArgs struct {
	Input struct {
		ID             *string
		Name           *string
		GroupName      *string
		ModelName      *string
		EntityName     *string
		Description    *string
		DisplayName    *string
		Notes          *string
		Config         *JSONString
		Commit         *string
		Host           *string
		Debug          *bool
		JobProgram     *string
		JobRepo        *string
		JobType        *string
		State          *string
		Sweep          *string
		Tags           *[]string
		SummaryMetrics *JSONString
	}
}

// UpsertBucket resolves Mutation.upsertBucket — creates or updates a run.
func (r *Resolver) UpsertBucket(ctx context.Context, args upsertBucketArgs) (*UpsertBucketPayloadResolver, error) {
	user := authctx.UserFromContext(ctx)

	entityName := "admin" // default
	if args.Input.EntityName != nil {
		entityName = *args.Input.EntityName
	}

	projectName := "uncategorized" // default
	if args.Input.ModelName != nil {
		projectName = *args.Input.ModelName
	}

	project, err := store.GetOrCreateProject(r.db, entityName, projectName, user.ID)
	if err != nil {
		return nil, err
	}

	// Load the entity for resolvers.
	var entity store.Entity
	if err := r.db.First(&entity, "id = ?", project.EntityID).Error; err != nil {
		return nil, err
	}

	input := store.UpsertRunInput{}
	if args.Input.Name != nil {
		input.Name = *args.Input.Name
	}
	if args.Input.DisplayName != nil {
		input.DisplayName = *args.Input.DisplayName
	}
	if args.Input.Config != nil {
		input.Config = args.Input.Config.Value
	}
	if args.Input.SummaryMetrics != nil {
		input.SummaryMetrics = args.Input.SummaryMetrics.Value
	}
	if args.Input.Description != nil {
		input.Description = *args.Input.Description
	}
	if args.Input.Notes != nil {
		input.Notes = *args.Input.Notes
	}
	if args.Input.Tags != nil {
		b, _ := json.Marshal(*args.Input.Tags)
		input.Tags = string(b)
	}
	if args.Input.GroupName != nil {
		input.GroupName = *args.Input.GroupName
	}
	if args.Input.JobType != nil {
		input.JobType = *args.Input.JobType
	}
	if args.Input.Host != nil {
		input.Host = *args.Input.Host
	}
	if args.Input.JobProgram != nil {
		input.Program = *args.Input.JobProgram
	}
	if args.Input.Commit != nil {
		input.Commit = *args.Input.Commit
	}
	if args.Input.JobRepo != nil {
		input.Repo = *args.Input.JobRepo
	}
	if args.Input.Sweep != nil {
		input.Sweep = *args.Input.Sweep
	}
	if args.Input.State != nil {
		input.State = *args.Input.State
	}

	run, inserted, err := store.UpsertRun(r.db, project.ID, user.ID, input)
	if err != nil {
		return nil, err
	}

	return &UpsertBucketPayloadResolver{
		bucket: &RunResolver{
			run:     run,
			project: project,
			entity:  &entity,
			db:      r.db,
		},
		inserted: inserted,
	}, nil
}
