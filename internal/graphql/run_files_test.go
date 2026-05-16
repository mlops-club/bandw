package graphql_test

import (
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
)

func TestCreateRunFilesReturnsUploadURLs(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	resp := h.GraphQL(`mutation {
		createRunFiles(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			files: ["config.yaml", "wandb-summary.json"]
		}) {
			runID
			uploadHeaders
			files {
				name
				uploadUrl
			}
		}
	}`)

	assert.Nil(t, resp.Path("errors").Value(), "expected no errors, got: %s", string(resp.Body))
	assert.NotEmpty(t, resp.Path("data.createRunFiles.runID").String())
	assert.Equal(t, int64(2), resp.Path("data.createRunFiles.files.#").Int())
	assert.Equal(t, "config.yaml", resp.Path("data.createRunFiles.files.0.name").String())
	assert.Equal(t, "wandb-summary.json", resp.Path("data.createRunFiles.files.1.name").String())

	// Upload URLs should be non-empty (storage is configured in harness).
	assert.NotEmpty(t, resp.Path("data.createRunFiles.files.0.uploadUrl").String())
	assert.NotEmpty(t, resp.Path("data.createRunFiles.files.1.uploadUrl").String())

	// Verify DB records were created.
	var count int64
	h.DB.Model(&store.RunFile{}).Where("name IN ?", []string{"config.yaml", "wandb-summary.json"}).Count(&count)
	assert.Equal(t, int64(2), count)
}

func TestRunFilesQuery(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// Create some run files via the mutation.
	resp := h.GraphQL(`mutation {
		createRunFiles(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			files: ["config.yaml", "wandb-summary.json", "requirements.txt"]
		}) {
			runID
			files { name uploadUrl }
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value(), "setup: %s", string(resp.Body))

	t.Run("all files", func(t *testing.T) {
		q := h.GraphQL(`{
			project(name: "proj", entityName: "admin") {
				run(name: "run1") {
					files { edges { node { id name url directUrl storagePath } } }
				}
			}
		}`)
		assert.Nil(t, q.Path("errors").Value(), "errors: %s", string(q.Body))
		assert.Equal(t, int64(3), q.Path("data.project.run.files.edges.#").Int())
		// Sorted by name ASC: config.yaml, requirements.txt, wandb-summary.json
		assert.Equal(t, "config.yaml", q.Path("data.project.run.files.edges.0.node.name").String())
		assert.Equal(t, "requirements.txt", q.Path("data.project.run.files.edges.1.node.name").String())
		assert.Equal(t, "wandb-summary.json", q.Path("data.project.run.files.edges.2.node.name").String())
		assert.NotEmpty(t, q.Path("data.project.run.files.edges.0.node.id").String())
	})

	t.Run("filter by names", func(t *testing.T) {
		q := h.GraphQL(`{
			project(name: "proj", entityName: "admin") {
				run(name: "run1") {
					files(names: ["config.yaml"]) { edges { node { name } } }
				}
			}
		}`)
		assert.Nil(t, q.Path("errors").Value(), "errors: %s", string(q.Body))
		assert.Equal(t, int64(1), q.Path("data.project.run.files.edges.#").Int())
		assert.Equal(t, "config.yaml", q.Path("data.project.run.files.edges.0.node.name").String())
	})

	t.Run("filter by pattern", func(t *testing.T) {
		q := h.GraphQL(`{
			project(name: "proj", entityName: "admin") {
				run(name: "run1") {
					files(pattern: "wandb-*") { edges { node { name } } }
				}
			}
		}`)
		assert.Nil(t, q.Path("errors").Value(), "errors: %s", string(q.Body))
		assert.Equal(t, int64(1), q.Path("data.project.run.files.edges.#").Int())
		assert.Equal(t, "wandb-summary.json", q.Path("data.project.run.files.edges.0.node.name").String())
	})

	t.Run("first limits results", func(t *testing.T) {
		q := h.GraphQL(`{
			project(name: "proj", entityName: "admin") {
				run(name: "run1") {
					files(first: 2) { edges { node { name } } }
				}
			}
		}`)
		assert.Nil(t, q.Path("errors").Value(), "errors: %s", string(q.Body))
		assert.Equal(t, int64(2), q.Path("data.project.run.files.edges.#").Int())
	})
}

func TestCreateRunFilesDuplicateUpserts(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// First call creates files.
	resp1 := h.GraphQL(`mutation {
		createRunFiles(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			files: ["config.yaml"]
		}) {
			runID
			files { name uploadUrl }
		}
	}`)
	assert.Nil(t, resp1.Path("errors").Value(), "expected no errors on first call, got: %s", string(resp1.Body))

	// Second call with same file should upsert (not error).
	resp2 := h.GraphQL(`mutation {
		createRunFiles(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			files: ["config.yaml"]
		}) {
			runID
			files { name uploadUrl }
		}
	}`)
	assert.Nil(t, resp2.Path("errors").Value(), "expected no errors on duplicate call, got: %s", string(resp2.Body))

	// Should still have only 1 record for config.yaml.
	var run store.Run
	h.DB.Where("name = ?", "run1").First(&run)

	var count int64
	h.DB.Model(&store.RunFile{}).Where("run_id = ? AND name = ?", run.ID, "config.yaml").Count(&count)
	assert.Equal(t, int64(1), count, "duplicate call should upsert, not create a second record")
}
