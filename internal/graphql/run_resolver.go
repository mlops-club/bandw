package graphql

import (
	"encoding/json"
	"time"

	gql "github.com/graph-gophers/graphql-go"
	"github.com/mlops-club/bandw/internal/store"
	"gorm.io/gorm"
)

// RunResolver implements the GraphQL Run type.
type RunResolver struct {
	run *store.Run
	db  *gorm.DB
}

func (r *RunResolver) ID() gql.ID            { return gql.ID(r.run.ID) }
func (r *RunResolver) Name() string           { return r.run.Name }
func (r *RunResolver) DisplayName() *string   { return strPtr(r.run.DisplayName) }
func (r *RunResolver) Description() *string   { return strPtr(r.run.Description) }
func (r *RunResolver) Notes() *string         { return strPtr(r.run.Notes) }
func (r *RunResolver) SweepName() *string     { return strPtr(r.run.SweepName) }
func (r *RunResolver) State() *string         { return strPtr(r.run.State) }
func (r *RunResolver) Group() *string         { return strPtr(r.run.GroupName) }
func (r *RunResolver) JobType() *string       { return strPtr(r.run.JobType) }
func (r *RunResolver) Commit() *string        { return strPtr(r.run.GitCommit) }
func (r *RunResolver) Host() *string          { return strPtr(r.run.Host) }
func (r *RunResolver) Stopped() *bool         { b := r.run.Stopped; return &b }
func (r *RunResolver) HistoryLineCount() *int32 { v := int32(r.run.HistoryLineCount); return &v }
func (r *RunResolver) LogLineCount() *int32    { v := int32(r.run.LogLineCount); return &v }
func (r *RunResolver) EventsLineCount() *int32 { v := int32(r.run.EventsLineCount); return &v }
func (r *RunResolver) ReadOnly() *bool         { return nil }

func (r *RunResolver) Config() *JSONString {
	s := string(r.run.Config)
	if s == "" || s == "null" {
		return nil
	}
	return &JSONString{Value: s}
}

func (r *RunResolver) SummaryMetrics() *JSONString {
	s := string(r.run.SummaryMetrics)
	if s == "" || s == "null" {
		return nil
	}
	return &JSONString{Value: s}
}

func (r *RunResolver) Tags() *[]string {
	raw := string(r.run.Tags)
	if raw == "" || raw == "null" {
		return nil
	}
	var tags []string
	if err := json.Unmarshal([]byte(raw), &tags); err != nil {
		return nil
	}
	return &tags
}

func (r *RunResolver) CreatedAt() *DateTime {
	return timeToDateTime(r.run.CreatedAt)
}

func (r *RunResolver) UpdatedAt() *DateTime {
	return timeToDateTime(r.run.UpdatedAt)
}

func (r *RunResolver) HeartbeatAt() *DateTime {
	if r.run.HeartbeatAt == nil {
		return nil
	}
	return timeToDateTime(*r.run.HeartbeatAt)
}

func (r *RunResolver) Project() (*ProjectResolver, error) {
	var project store.Project
	if err := r.db.First(&project, "id = ?", r.run.ProjectID).Error; err != nil {
		return nil, err
	}
	return &ProjectResolver{project: &project, db: r.db}, nil
}

func (r *RunResolver) User() (*UserResolver, error) {
	var user store.User
	if err := r.db.First(&user, "id = ?", r.run.UserID).Error; err != nil {
		return nil, err
	}
	entity, err := store.GetEntityByUserID(r.db, user.ID)
	if err != nil {
		return nil, err
	}
	return &UserResolver{user: &user, entity: entity}, nil
}

func timeToDateTime(t time.Time) *DateTime {
	if t.IsZero() {
		return nil
	}
	return &DateTime{Value: t.Format(time.RFC3339)}
}
