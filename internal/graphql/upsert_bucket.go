package graphql

import (
	"context"
	"encoding/json"

	"github.com/mlops-club/bandw/internal/authctx"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// UpsertBucketArgs holds the input for the upsertBucket mutation.
type UpsertBucketArgs struct {
	Input struct {
		ID             *string
		Name           *string
		GroupName      *string
		ModelName      *string // project name
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

// UpsertBucket resolves Mutation.upsertBucket.
func (r *Resolver) UpsertBucket(ctx context.Context, args UpsertBucketArgs) (*UpsertBucketPayloadResolver, error) {
	user := authctx.UserFromContext(ctx)
	input := args.Input

	// Determine entity name: use provided or fall back to user's entity.
	entityName := ""
	if input.EntityName != nil {
		entityName = *input.EntityName
	}
	if entityName == "" {
		entity, err := store.GetEntityByUserID(r.db, user.ID)
		if err != nil {
			return nil, err
		}
		entityName = entity.Name
	}

	// Determine project name from modelName.
	projectName := "uncategorized"
	if input.ModelName != nil && *input.ModelName != "" {
		projectName = *input.ModelName
	}

	project, err := store.GetOrCreateProject(r.db, entityName, projectName, user.ID)
	if err != nil {
		return nil, err
	}

	// Build run name: use provided or generate from ID.
	runName := ""
	if input.Name != nil {
		runName = *input.Name
	}
	if runName == "" && input.ID != nil {
		runName = *input.ID
	}

	upsertInput := store.UpsertRunInput{
		Name:      runName,
		ProjectID: project.ID,
		UserID:    user.ID,
	}
	if input.DisplayName != nil {
		upsertInput.DisplayName = *input.DisplayName
	}
	if input.Config != nil {
		upsertInput.Config = input.Config.Value
	}
	if input.SummaryMetrics != nil {
		upsertInput.SummaryMetrics = input.SummaryMetrics.Value
	}
	if input.Description != nil {
		upsertInput.Description = *input.Description
	}
	if input.Notes != nil {
		upsertInput.Notes = *input.Notes
	}
	if input.GroupName != nil {
		upsertInput.GroupName = *input.GroupName
	}
	if input.JobType != nil {
		upsertInput.JobType = *input.JobType
	}
	if input.Host != nil {
		upsertInput.Host = *input.Host
	}
	if input.Commit != nil {
		upsertInput.GitCommit = *input.Commit
	}
	if input.JobRepo != nil {
		upsertInput.GitRepo = *input.JobRepo
	}
	if input.JobProgram != nil {
		upsertInput.Program = *input.JobProgram
	}
	if input.Sweep != nil {
		upsertInput.SweepName = *input.Sweep
	}
	if input.State != nil {
		upsertInput.State = *input.State
	}
	if input.Tags != nil {
		tagsJSON, _ := json.Marshal(*input.Tags)
		upsertInput.Tags = string(tagsJSON)
	}

	run, inserted, err := store.UpsertRun(r.db, upsertInput)
	if err != nil {
		return nil, err
	}

	return &UpsertBucketPayloadResolver{
		run:      run,
		inserted: inserted,
		db:       r.db,
	}, nil
}

// UpsertBucketPayloadResolver implements the UpsertBucketPayload type.
type UpsertBucketPayloadResolver struct {
	run      *store.Run
	inserted bool
	db       *gorm.DB
}

func (p *UpsertBucketPayloadResolver) Bucket() *RunResolver {
	if p.run == nil {
		return nil
	}
	return &RunResolver{run: p.run, db: p.db}
}

func (p *UpsertBucketPayloadResolver) Inserted() *bool {
	return &p.inserted
}
