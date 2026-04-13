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
	run     *store.Run
	project *store.Project
	entity  *store.Entity
	db      *gorm.DB
}

func (r *RunResolver) ID() gql.ID         { return gql.ID(r.run.ID) }
func (r *RunResolver) Name() string        { return r.run.Name }
func (r *RunResolver) DisplayName() *string { return strPtr(r.run.DisplayName) }
func (r *RunResolver) Description() *string { return strPtr(r.run.Description) }
func (r *RunResolver) Notes() *string      { return strPtr(r.run.Notes) }
func (r *RunResolver) SweepName() *string  { return strPtr(r.run.SweepName) }
func (r *RunResolver) State() *string      { return strPtr(r.run.State) }
func (r *RunResolver) Group() *string      { return strPtr(r.run.GroupName) }
func (r *RunResolver) JobType() *string    { return strPtr(r.run.JobType) }
func (r *RunResolver) Commit() *string     { return strPtr(r.run.GitCommit) }
func (r *RunResolver) Host() *string       { return strPtr(r.run.Host) }
func (r *RunResolver) Stopped() bool       { return r.run.Stopped }
func (r *RunResolver) ReadOnly() bool      { return false }
func (r *RunResolver) HistoryLineCount() int32 { return int32(r.run.HistoryLineCount) }
func (r *RunResolver) LogLineCount() int32     { return int32(r.run.LogLineCount) }
func (r *RunResolver) EventsLineCount() int32  { return int32(r.run.EventsLineCount) }

func (r *RunResolver) Config() *JSONString {
	if len(r.run.Config) == 0 {
		return nil
	}
	s := string(r.run.Config)
	return &JSONString{Value: s}
}

func (r *RunResolver) SummaryMetrics() *JSONString {
	if len(r.run.SummaryMetrics) == 0 {
		return nil
	}
	s := string(r.run.SummaryMetrics)
	return &JSONString{Value: s}
}

func (r *RunResolver) CreatedAt() *DateTime {
	return &DateTime{Time: r.run.CreatedAt}
}

func (r *RunResolver) UpdatedAt() *DateTime {
	return &DateTime{Time: r.run.UpdatedAt}
}

func (r *RunResolver) HeartbeatAt() *DateTime {
	if r.run.HeartbeatAt == nil {
		return nil
	}
	return &DateTime{Time: *r.run.HeartbeatAt}
}

func (r *RunResolver) Tags() *[]string {
	if len(r.run.Tags) == 0 {
		return nil
	}
	var tags []string
	if err := json.Unmarshal(r.run.Tags, &tags); err != nil {
		return nil
	}
	return &tags
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

func (r *RunResolver) Project() *ProjectResolver {
	if r.project == nil {
		return nil
	}
	return &ProjectResolver{project: r.project, entity: r.entity, db: r.db}
}

// ProjectResolver implements the GraphQL Project type.
type ProjectResolver struct {
	project *store.Project
	entity  *store.Entity
	db      *gorm.DB
}

func (p *ProjectResolver) ID() gql.ID         { return gql.ID(p.project.ID) }
func (p *ProjectResolver) Name() string        { return p.project.Name }
func (p *ProjectResolver) EntityName() string  { return p.entity.Name }
func (p *ProjectResolver) Description() *string { return strPtr(p.project.Description) }
func (p *ProjectResolver) IsBenchmark() bool   { return false }
func (p *ProjectResolver) ReadOnly() bool      { return false }

func (p *ProjectResolver) Entity() *EntityResolver {
	return &EntityResolver{id: p.entity.ID, name: p.entity.Name}
}

func (p *ProjectResolver) CreatedAt() *DateTime {
	return &DateTime{Time: p.project.CreatedAt}
}

type bucketArgs struct {
	Name      string
	MissingOk *bool
}

func (p *ProjectResolver) Bucket(args bucketArgs) (*RunResolver, error) {
	run, err := store.GetRunByName(p.db, p.project.ID, args.Name)
	if err != nil {
		if err == gorm.ErrRecordNotFound && args.MissingOk != nil && *args.MissingOk {
			return nil, nil
		}
		return nil, err
	}
	return &RunResolver{run: run, project: p.project, entity: p.entity, db: p.db}, nil
}

func (p *ProjectResolver) Buckets(args struct{ First, After *int32 }) *RunConnectionResolver {
	return p.runConnection()
}

func (p *ProjectResolver) Runs(args struct{ First, After *int32 }) *RunConnectionResolver {
	return p.runConnection()
}

func (p *ProjectResolver) runConnection() *RunConnectionResolver {
	var runs []store.Run
	p.db.Where("project_id = ?", p.project.ID).Order("created_at DESC").Find(&runs)
	edges := make([]*RunEdgeResolver, len(runs))
	for i := range runs {
		edges[i] = &RunEdgeResolver{
			node: &RunResolver{run: &runs[i], project: p.project, entity: p.entity, db: p.db},
		}
	}
	return &RunConnectionResolver{edges: edges}
}

// UpsertBucketPayloadResolver implements the UpsertBucketPayload type.
type UpsertBucketPayloadResolver struct {
	bucket   *RunResolver
	inserted bool
}

func (u *UpsertBucketPayloadResolver) Bucket() *RunResolver { return u.bucket }
func (u *UpsertBucketPayloadResolver) Inserted() bool       { return u.inserted }

// RunConnectionResolver implements the RunConnection type.
type RunConnectionResolver struct {
	edges []*RunEdgeResolver
}

func (c *RunConnectionResolver) Edges() []*RunEdgeResolver { return c.edges }
func (c *RunConnectionResolver) PageInfo() *PageInfoResolver { return &PageInfoResolver{} }

// RunEdgeResolver implements the RunEdge type.
type RunEdgeResolver struct {
	node *RunResolver
}

func (e *RunEdgeResolver) Node() *RunResolver { return e.node }
func (e *RunEdgeResolver) Cursor() *string    { return nil }

// ProjectConnectionResolver implements the ProjectConnection type.
type ProjectConnectionResolver struct {
	edges []*ProjectEdgeResolver
}

func (c *ProjectConnectionResolver) Edges() []*ProjectEdgeResolver { return c.edges }
func (c *ProjectConnectionResolver) PageInfo() *PageInfoResolver    { return &PageInfoResolver{} }

// ProjectEdgeResolver implements the ProjectEdge type.
type ProjectEdgeResolver struct {
	node *ProjectResolver
}

func (e *ProjectEdgeResolver) Node() *ProjectResolver { return e.node }
func (e *ProjectEdgeResolver) Cursor() *string         { return nil }

// DateTime implements the DateTime custom scalar.
type DateTime struct {
	Time time.Time
}

func (DateTime) ImplementsGraphQLType(name string) bool { return name == "DateTime" }

func (d *DateTime) UnmarshalGraphQL(input interface{}) error {
	switch v := input.(type) {
	case string:
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return err
		}
		d.Time = t
		return nil
	default:
		return nil
	}
}

func (d DateTime) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.Time.Format(time.RFC3339))
}
