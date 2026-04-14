package graphql_test

import (
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
)

func TestUpsertBucketCreatesRun(t *testing.T) {
	h := testutil.NewHarness(t)
	resp := h.GraphQL(`mutation {
		upsertBucket(input: {
			name: "test-run-1"
			modelName: "test-project"
			entityName: "admin"
			config: "{\"lr\": 0.001}"
		}) {
			bucket { id name displayName project { id name entity { id name } } historyLineCount }
			inserted
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, true, resp.Path("data.upsertBucket.inserted").Bool())
	assert.Equal(t, "test-run-1", resp.Path("data.upsertBucket.bucket.name").String())
	assert.Equal(t, "test-project", resp.Path("data.upsertBucket.bucket.project.name").String())
	assert.Equal(t, "admin", resp.Path("data.upsertBucket.bucket.project.entity.name").String())
}

func TestUpsertBucketAutoCreatesProject(t *testing.T) {
	h := testutil.NewHarness(t)
	h.GraphQL(`mutation {
		upsertBucket(input: {
			name: "r1" modelName: "new-project" entityName: "admin"
		}) { bucket { id } inserted }
	}`)
	var count int64
	h.DB.Model(&store.Project{}).Where("name = ?", "new-project").Count(&count)
	assert.Equal(t, int64(1), count)
}

func TestUpsertBucketUpdatesExistingRun(t *testing.T) {
	h := testutil.NewHarness(t)
	// Create
	h.GraphQL(`mutation {
		upsertBucket(input: {
			name: "r1" modelName: "p1" entityName: "admin" config: "{\"a\":1}"
		}) { bucket { id } inserted }
	}`)
	// Update
	resp := h.GraphQL(`mutation {
		upsertBucket(input: {
			name: "r1" modelName: "p1" entityName: "admin"
			summaryMetrics: "{\"loss\":0.5}"
		}) { bucket { id } inserted }
	}`)
	assert.Equal(t, false, resp.Path("data.upsertBucket.inserted").Bool())
	var run store.Run
	h.DB.First(&run, "name = ?", "r1")
	assert.Contains(t, string(run.SummaryMetrics), "loss")
}

func TestUpsertBucketStoresConfig(t *testing.T) {
	h := testutil.NewHarness(t)
	h.GraphQL(`mutation {
		upsertBucket(input: {
			name: "r1" modelName: "p1" entityName: "admin"
			config: "{\"lr\": 0.001, \"epochs\": 10}"
		}) { bucket { id } inserted }
	}`)
	var run store.Run
	h.DB.First(&run, "name = ?", "r1")
	assert.Contains(t, string(run.Config), "0.001")
}

func TestModelQueryIsAliasForProject(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("myproject", "r1", `{"x":1}`)
	resp := h.GraphQL(`query {
		model(name: "myproject", entityName: "admin") {
			id name
			bucket(name: "r1", missingOk: true) { id name config }
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, "r1", resp.Path("data.model.bucket.name").String())
}

func TestProjectQueryReturnsNilForMissing(t *testing.T) {
	h := testutil.NewHarness(t)
	resp := h.GraphQL(`query {
		project(name: "nonexistent", entityName: "admin") {
			id name
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value())
	// GraphQL returns null for missing projects.
	assert.Equal(t, "null", resp.Path("data.project").Raw)
}

func TestUpsertBucketRunConfig(t *testing.T) {
	h := testutil.NewHarness(t)
	resp := h.GraphQL(`mutation {
		upsertBucket(input: {
			name: "cfg-run" modelName: "cfg-project" entityName: "admin"
			config: "{\"lr\": 0.01}"
		}) {
			bucket { config }
			inserted
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value())
	assert.Contains(t, resp.Path("data.upsertBucket.bucket.config").String(), "0.01")
}
