package graphql_test

import (
	"fmt"
	"testing"

	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// seedCommittedArtifact creates an artifact through the full flow and returns its ID.
func seedCommittedArtifact(t *testing.T, h *testutil.Harness, collectionName, clientID string) string {
	t.Helper()
	h.SeedRun("proj", "run1", `{}`)

	artResp := h.GraphQL(fmt.Sprintf(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "%s"
			artifactCollectionNames: ["%s"]
			digest: "digest-%s"
			digestAlgorithm: MANIFEST_MD5
			description: "Test artifact"
			aliases: []
			clientID: "%s"
			sequenceClientID: "seq-%s"
			enableDigestDeduplication: false
		}) { artifact { id } }
	}`, collectionName, collectionName, clientID, clientID, clientID))
	artID := artResp.Path("data.createArtifact.artifact.id").String()
	require.NotEmpty(t, artID)

	// Create some files.
	h.GraphQL(fmt.Sprintf(`mutation {
		createArtifactFiles(input: {
			artifactFiles: [
				{artifactID: "%s", name: "data/file1.txt", md5: "abc"},
				{artifactID: "%s", name: "data/file2.txt", md5: "def"}
			]
			storageLayout: V2
		}) { files { edges { node { id uploadUrl } } } }
	}`, artID, artID))

	// Commit.
	h.GraphQL(fmt.Sprintf(`mutation {
		commitArtifact(input: {artifactID: "%s"}) { artifact { id } }
	}`, artID))

	return artID
}

func TestProjectArtifactByVersion(t *testing.T) {
	h := testutil.NewHarness(t)
	artID := seedCommittedArtifact(t, h, "my-dataset", "c1")

	// Query by version alias "v0".
	resp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifact(name: "my-dataset:v0") {
				id
				state
				versionIndex
				description
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value(), "errors: %s", string(resp.Body))
	assert.Equal(t, artID, resp.Path("data.model.artifact.id").String())
	assert.Equal(t, "COMMITTED", resp.Path("data.model.artifact.state").String())
	assert.Equal(t, int64(0), resp.Path("data.model.artifact.versionIndex").Int())
}

func TestProjectArtifactByAlias(t *testing.T) {
	h := testutil.NewHarness(t)
	artID := seedCommittedArtifact(t, h, "my-dataset", "c2")

	// Query by "latest" alias.
	resp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifact(name: "my-dataset:latest") {
				id
				state
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value(), "errors: %s", string(resp.Body))
	assert.Equal(t, artID, resp.Path("data.model.artifact.id").String())
}

func TestProjectArtifactNotFound(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	resp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifact(name: "nonexistent:v0") {
				id
			}
		}
	}`)
	// Should return null, not an error.
	assert.Nil(t, resp.Path("errors").Value())
	assert.False(t, resp.Path("data.model.artifact.id").Exists())
}

func TestArtifactFilesQuery(t *testing.T) {
	h := testutil.NewHarness(t)
	seedCommittedArtifact(t, h, "files-query", "c3")

	resp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifact(name: "files-query:v0") {
				files {
					edges {
						node {
							name
							directUrl
							storagePath
						}
					}
				}
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value(), "errors: %s", string(resp.Body))
	edges := resp.Path("data.model.artifact.files.edges").Array()
	assert.Equal(t, 2, len(edges))

	names := make([]string, len(edges))
	for i, e := range edges {
		names[i] = e.Get("node.name").String()
		assert.NotEmpty(t, e.Get("node.directUrl").String())
	}
	assert.Contains(t, names, "data/file1.txt")
	assert.Contains(t, names, "data/file2.txt")
}

func TestArtifactFilesByManifestEntries(t *testing.T) {
	h := testutil.NewHarness(t)
	seedCommittedArtifact(t, h, "manifest-query", "c4")

	resp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifact(name: "manifest-query:v0") {
				filesByManifestEntries(
					storageLayout: "V2"
					manifestVersion: "1"
					entries: [{name: "data/file1.txt", digest: "abc"}]
				) {
					edges {
						node {
							name
							directUrl
						}
					}
				}
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value(), "errors: %s", string(resp.Body))
	edges := resp.Path("data.model.artifact.filesByManifestEntries.edges").Array()
	assert.Equal(t, 1, len(edges))
	assert.Equal(t, "data/file1.txt", edges[0].Get("node.name").String())
	assert.NotEmpty(t, edges[0].Get("node.directUrl").String())
}

func TestRunOutputArtifacts(t *testing.T) {
	h := testutil.NewHarness(t)
	seedCommittedArtifact(t, h, "output-test", "c5")

	resp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			bucket(name: "run1") {
				outputArtifacts {
					edges {
						node {
							versionIndex
							artifactSequence { name }
						}
					}
				}
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value(), "errors: %s", string(resp.Body))
	edges := resp.Path("data.model.bucket.outputArtifacts.edges").Array()
	assert.True(t, len(edges) >= 1, "expected at least 1 output artifact")
	assert.Equal(t, "output-test", edges[0].Get("node.artifactSequence.name").String())
}

func TestRunInputArtifacts(t *testing.T) {
	h := testutil.NewHarness(t)
	artID := seedCommittedArtifact(t, h, "input-test", "c6")

	// Create a consumer run and record usage.
	h.SeedRun("proj", "consumer", `{}`)
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		useArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "consumer"
			artifactID: "%s"
		}) { artifact { id } }
	}`, artID))
	assert.Nil(t, resp.Path("errors").Value())

	// Query consumer's input artifacts.
	resp = h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			bucket(name: "consumer") {
				inputArtifacts {
					edges {
						node {
							versionIndex
							artifactSequence { name }
						}
					}
				}
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value(), "errors: %s", string(resp.Body))
	edges := resp.Path("data.model.bucket.inputArtifacts.edges").Array()
	assert.Equal(t, 1, len(edges))
	assert.Equal(t, "input-test", edges[0].Get("node.artifactSequence.name").String())
}

func TestArtifactUsedBy(t *testing.T) {
	h := testutil.NewHarness(t)
	artID := seedCommittedArtifact(t, h, "usedby-test", "c7")

	// Create consumers.
	h.SeedRun("proj", "consumer1", `{}`)
	h.SeedRun("proj", "consumer2", `{}`)

	h.GraphQL(fmt.Sprintf(`mutation {
		useArtifact(input: {
			entityName: "admin", projectName: "proj", runName: "consumer1", artifactID: "%s"
		}) { artifact { id } }
	}`, artID))
	h.GraphQL(fmt.Sprintf(`mutation {
		useArtifact(input: {
			entityName: "admin", projectName: "proj", runName: "consumer2", artifactID: "%s"
		}) { artifact { id } }
	}`, artID))

	resp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifact(name: "usedby-test:v0") {
				usedBy {
					totalCount
					edges {
						node { name }
					}
				}
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value(), "errors: %s", string(resp.Body))
	assert.Equal(t, int64(2), resp.Path("data.model.artifact.usedBy.totalCount").Int())
}

func TestArtifactCreatedBy(t *testing.T) {
	h := testutil.NewHarness(t)
	seedCommittedArtifact(t, h, "createdby-test", "c8")

	resp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifact(name: "createdby-test:v0") {
				createdBy {
					... on Run { name }
				}
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value(), "errors: %s", string(resp.Body))
	assert.Equal(t, "run1", resp.Path("data.model.artifact.createdBy.name").String())
}

func TestVersioningWithLatestAlias(t *testing.T) {
	h := testutil.NewHarness(t)

	// Create v0 (seedCommittedArtifact also seeds "run1").
	seedCommittedArtifact(t, h, "versioned", "ver-v0")

	// Create v1.
	artResp := h.GraphQL(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "versioned"
			artifactCollectionNames: ["versioned"]
			digest: "digest-v1"
			digestAlgorithm: MANIFEST_MD5
			aliases: []
			clientID: "ver-v1"
			sequenceClientID: "seq-v1"
			enableDigestDeduplication: false
		}) { artifact { id versionIndex } }
	}`)
	v1ID := artResp.Path("data.createArtifact.artifact.id").String()
	assert.Equal(t, int64(1), artResp.Path("data.createArtifact.artifact.versionIndex").Int())

	h.GraphQL(fmt.Sprintf(`mutation {
		commitArtifact(input: {artifactID: "%s"}) { artifact { id } }
	}`, v1ID))

	// "latest" should now point to v1.
	resp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifact(name: "versioned:latest") {
				versionIndex
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, int64(1), resp.Path("data.model.artifact.versionIndex").Int())

	// "v0" should still work.
	resp = h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifact(name: "versioned:v0") {
				versionIndex
			}
		}
	}`)
	assert.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, int64(0), resp.Path("data.model.artifact.versionIndex").Int())
}
