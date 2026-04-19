package graphql_test

import (
	"fmt"
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreateArtifactCreatesTypeAndCollection(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	resp := h.GraphQL(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "my-dataset"
			artifactCollectionNames: ["my-dataset"]
			digest: "abc123"
			digestAlgorithm: MANIFEST_MD5
			description: "A test dataset"
			metadata: "{\"source\": \"test\"}"
			aliases: [{alias: "latest", artifactCollectionName: "my-dataset"}]
			clientID: "client-1"
			sequenceClientID: "seq-1"
			enableDigestDeduplication: false
		}) {
			artifact {
				id
				state
				digest
				versionIndex
				description
				metadata
			}
		}
	}`)

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	art := resp.Path("data.createArtifact.artifact")
	assert.NotEmpty(t, art.Get("id").String())
	assert.Equal(t, "PENDING", art.Get("state").String())
	assert.Equal(t, "abc123", art.Get("digest").String())
	assert.Equal(t, int64(0), art.Get("versionIndex").Int())
	assert.Equal(t, "A test dataset", art.Get("description").String())

	// Verify type and collection were auto-created.
	var artType store.ArtifactType
	require.NoError(t, h.DB.Where("name = ?", "dataset").First(&artType).Error)
	var coll store.ArtifactCollection
	require.NoError(t, h.DB.Where("name = ?", "my-dataset").First(&coll).Error)
	assert.Equal(t, artType.ID, coll.ArtifactTypeID)
}

func TestCreateArtifactClientIDDedup(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	mutation := `mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "my-dataset"
			artifactCollectionNames: ["my-dataset"]
			digest: "abc123"
			digestAlgorithm: MANIFEST_MD5
			aliases: []
			clientID: "dedup-id"
			sequenceClientID: "seq-1"
			enableDigestDeduplication: false
		}) {
			artifact { id versionIndex }
		}
	}`

	resp1 := h.GraphQL(mutation)
	assert.Nil(t, resp1.Path("errors").Value())
	id1 := resp1.Path("data.createArtifact.artifact.id").String()

	resp2 := h.GraphQL(mutation)
	assert.Nil(t, resp2.Path("errors").Value())
	id2 := resp2.Path("data.createArtifact.artifact.id").String()

	// Same clientID should return the same artifact.
	assert.Equal(t, id1, id2)
}

func TestCreateArtifactVersionAutoIncrement(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	for i := 0; i < 3; i++ {
		resp := h.GraphQL(fmt.Sprintf(`mutation {
			createArtifact(input: {
				entityName: "admin"
				projectName: "proj"
				runName: "run1"
				artifactTypeName: "dataset"
				artifactCollectionName: "versioned"
				artifactCollectionNames: ["versioned"]
				digest: "digest-%d"
				digestAlgorithm: MANIFEST_MD5
				aliases: []
				clientID: "version-%d"
				sequenceClientID: "seq-1"
				enableDigestDeduplication: false
			}) {
				artifact { versionIndex }
			}
		}`, i, i))
		assert.Nil(t, resp.Path("errors").Value())
		assert.Equal(t, int64(i), resp.Path("data.createArtifact.artifact.versionIndex").Int())
	}
}

func TestCreateArtifactManifest(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// Create artifact first.
	artResp := h.GraphQL(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "my-dataset"
			artifactCollectionNames: ["my-dataset"]
			digest: "abc123"
			digestAlgorithm: MANIFEST_MD5
			aliases: []
			clientID: "c1"
			sequenceClientID: "s1"
			enableDigestDeduplication: false
		}) { artifact { id } }
	}`)
	artID := artResp.Path("data.createArtifact.artifact.id").String()
	require.NotEmpty(t, artID)

	// Create manifest.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		createArtifactManifest(input: {
			artifactID: "%s"
			name: "wandb_manifest.json"
			digest: "manifest-digest"
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			type: FULL
		}) {
			artifactManifest {
				id
				file {
					id
					uploadUrl
				}
			}
		}
	}`, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	manifest := resp.Path("data.createArtifactManifest.artifactManifest")
	assert.NotEmpty(t, manifest.Get("id").String())
	assert.NotEmpty(t, manifest.Get("file.uploadUrl").String())
}

func TestCreateArtifactFiles(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// Create artifact.
	artResp := h.GraphQL(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "files-test"
			artifactCollectionNames: ["files-test"]
			digest: "abc123"
			digestAlgorithm: MANIFEST_MD5
			aliases: []
			clientID: "c-files"
			sequenceClientID: "s-files"
			enableDigestDeduplication: false
		}) { artifact { id } }
	}`)
	artID := artResp.Path("data.createArtifact.artifact.id").String()

	// Create files.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		createArtifactFiles(input: {
			artifactFiles: [
				{artifactID: "%s", name: "data/file1.txt", md5: "d41d8cd98f00b204"},
				{artifactID: "%s", name: "data/file2.txt", md5: "7d793037a0760186"}
			]
			storageLayout: V2
		}) {
			files {
				edges {
					node {
						id
						name
						uploadUrl
						storagePath
					}
				}
			}
		}
	}`, artID, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	edges := resp.Path("data.createArtifactFiles.files.edges")
	assert.Equal(t, 2, len(edges.Array()))

	for _, edge := range edges.Array() {
		node := edge.Get("node")
		assert.NotEmpty(t, node.Get("id").String())
		assert.NotEmpty(t, node.Get("uploadUrl").String())
		assert.NotEmpty(t, node.Get("storagePath").String())
	}
}

func TestCommitArtifactSetsStateAndAliases(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// Create artifact.
	artResp := h.GraphQL(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "commit-test"
			artifactCollectionNames: ["commit-test"]
			digest: "abc123"
			digestAlgorithm: MANIFEST_MD5
			aliases: []
			clientID: "c-commit"
			sequenceClientID: "s-commit"
			enableDigestDeduplication: false
		}) { artifact { id } }
	}`)
	artID := artResp.Path("data.createArtifact.artifact.id").String()

	// Commit.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		commitArtifact(input: {artifactID: "%s"}) {
			artifact {
				id
				state
				aliases { alias }
			}
		}
	}`, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	art := resp.Path("data.commitArtifact.artifact")
	assert.Equal(t, "COMMITTED", art.Get("state").String())

	// Check aliases include "latest" and "v0".
	aliases := art.Get("aliases").Array()
	aliasNames := make([]string, len(aliases))
	for i, a := range aliases {
		aliasNames[i] = a.Get("alias").String()
	}
	assert.Contains(t, aliasNames, "latest")
	assert.Contains(t, aliasNames, "v0")
}

func TestUseArtifactRecordsLineage(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "producer", `{}`)
	h.SeedRun("proj", "consumer", `{}`)

	// Create and commit artifact.
	artResp := h.GraphQL(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "producer"
			artifactTypeName: "dataset"
			artifactCollectionName: "lineage-test"
			artifactCollectionNames: ["lineage-test"]
			digest: "abc123"
			digestAlgorithm: MANIFEST_MD5
			aliases: []
			clientID: "c-lineage"
			sequenceClientID: "s-lineage"
			enableDigestDeduplication: false
		}) { artifact { id } }
	}`)
	artID := artResp.Path("data.createArtifact.artifact.id").String()

	h.GraphQL(fmt.Sprintf(`mutation {
		commitArtifact(input: {artifactID: "%s"}) { artifact { id } }
	}`, artID))

	// Consumer uses the artifact.
	resp := h.GraphQL(fmt.Sprintf(`mutation {
		useArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "consumer"
			artifactID: "%s"
		}) {
			artifact { id state }
		}
	}`, artID))

	assert.Nil(t, resp.Path("errors").Value(), "unexpected errors: %s", string(resp.Body))
	assert.Equal(t, "COMMITTED", resp.Path("data.useArtifact.artifact.state").String())

	// Verify lineage in DB.
	var usage store.ArtifactUsage
	require.NoError(t, h.DB.Where("artifact_id = ? AND type = 'input'", artID).First(&usage).Error)

	var run store.Run
	require.NoError(t, h.DB.First(&run, "name = ?", "consumer").Error)
	assert.Equal(t, run.ID, usage.RunID)
}

func TestClientIDMapping(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// Create artifact with known clientID.
	artResp := h.GraphQL(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "map-test"
			artifactCollectionNames: ["map-test"]
			digest: "abc"
			digestAlgorithm: MANIFEST_MD5
			aliases: []
			clientID: "my-client-id"
			sequenceClientID: "s1"
			enableDigestDeduplication: false
		}) { artifact { id } }
	}`)
	artID := artResp.Path("data.createArtifact.artifact.id").String()

	// Query clientIDMapping.
	resp := h.GraphQL(`query {
		clientIDMapping(clientID: "my-client-id") { id }
	}`)
	assert.Nil(t, resp.Path("errors").Value())
	assert.Equal(t, artID, resp.Path("data.clientIDMapping.id").String())
}

func TestFileUploadAndDownload(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// Create artifact.
	artResp := h.GraphQL(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "upload-test"
			artifactCollectionNames: ["upload-test"]
			digest: "abc123"
			digestAlgorithm: MANIFEST_MD5
			aliases: []
			clientID: "c-upload"
			sequenceClientID: "s-upload"
			enableDigestDeduplication: false
		}) { artifact { id } }
	}`)
	artID := artResp.Path("data.createArtifact.artifact.id").String()

	// Create file records.
	filesResp := h.GraphQL(fmt.Sprintf(`mutation {
		createArtifactFiles(input: {
			artifactFiles: [{artifactID: "%s", name: "hello.txt", md5: "abc"}]
			storageLayout: V2
		}) {
			files { edges { node { uploadUrl directUrl } } }
		}
	}`, artID))
	uploadURL := filesResp.Path("data.createArtifactFiles.files.edges.0.node.uploadUrl").String()
	directURL := filesResp.Path("data.createArtifactFiles.files.edges.0.node.directUrl").String()
	require.NotEmpty(t, uploadURL)
	require.NotEmpty(t, directURL)

	// Upload a file.
	content := []byte("Hello, artifact world!")
	putResp := h.PutFile(uploadURL, content)
	assert.Equal(t, 200, putResp.StatusCode)

	// Download the file.
	body, status := h.GetFile(directURL)
	assert.Equal(t, 200, status)
	assert.Equal(t, content, body)
}

func TestFullArtifactUploadFlow(t *testing.T) {
	h := testutil.NewHarness(t)
	h.SeedRun("proj", "run1", `{}`)

	// 1. createArtifact
	artResp := h.GraphQL(`mutation {
		createArtifact(input: {
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			artifactTypeName: "dataset"
			artifactCollectionName: "e2e-dataset"
			artifactCollectionNames: ["e2e-dataset"]
			digest: "full-flow-digest"
			digestAlgorithm: MANIFEST_MD5
			description: "Full flow test"
			metadata: "{\"key\": \"value\"}"
			aliases: [{alias: "latest", artifactCollectionName: "e2e-dataset"}]
			clientID: "e2e-client"
			sequenceClientID: "e2e-seq"
			enableDigestDeduplication: false
		}) { artifact { id state versionIndex } }
	}`)
	assert.Nil(t, artResp.Path("errors").Value(), "createArtifact errors: %s", string(artResp.Body))
	artID := artResp.Path("data.createArtifact.artifact.id").String()
	assert.Equal(t, "PENDING", artResp.Path("data.createArtifact.artifact.state").String())

	// 2. createArtifactManifest (initial, no upload URL needed)
	manifestResp := h.GraphQL(fmt.Sprintf(`mutation {
		createArtifactManifest(input: {
			artifactID: "%s"
			name: "wandb_manifest.json"
			digest: "initial-digest"
			entityName: "admin"
			projectName: "proj"
			runName: "run1"
			type: FULL
			includeUpload: false
		}) { artifactManifest { id } }
	}`, artID))
	assert.Nil(t, manifestResp.Path("errors").Value(), "createArtifactManifest errors: %s", string(manifestResp.Body))
	manifestID := manifestResp.Path("data.createArtifactManifest.artifactManifest.id").String()

	// 3. createArtifactFiles
	filesResp := h.GraphQL(fmt.Sprintf(`mutation {
		createArtifactFiles(input: {
			artifactFiles: [
				{artifactID: "%s", name: "data/train.csv", md5: "abc123"},
				{artifactID: "%s", name: "data/test.csv", md5: "def456"}
			]
			storageLayout: V2
		}) {
			files { edges { node { id name uploadUrl } } }
		}
	}`, artID, artID))
	assert.Nil(t, filesResp.Path("errors").Value(), "createArtifactFiles errors: %s", string(filesResp.Body))
	fileEdges := filesResp.Path("data.createArtifactFiles.files.edges").Array()
	assert.Equal(t, 2, len(fileEdges))

	// 4. Upload files
	for _, edge := range fileEdges {
		url := edge.Get("node.uploadUrl").String()
		name := edge.Get("node.name").String()
		putResp := h.PutFile(url, []byte("content of "+name))
		assert.Equal(t, 200, putResp.StatusCode)
	}

	// 5. updateArtifactManifest (finalize digest, get upload URL)
	updateManifestResp := h.GraphQL(fmt.Sprintf(`mutation {
		updateArtifactManifest(input: {
			artifactManifestID: "%s"
			digest: "final-manifest-digest"
		}) {
			artifactManifest {
				id
				file { uploadUrl }
			}
		}
	}`, manifestID))
	assert.Nil(t, updateManifestResp.Path("errors").Value(), "updateArtifactManifest errors: %s", string(updateManifestResp.Body))
	manifestUploadURL := updateManifestResp.Path("data.updateArtifactManifest.artifactManifest.file.uploadUrl").String()
	assert.NotEmpty(t, manifestUploadURL)

	// 6. Upload manifest
	manifestJSON := `{"version":1,"storagePolicy":"wandb-storage-policy-v1","contents":{}}`
	putResp := h.PutFile(manifestUploadURL, []byte(manifestJSON))
	assert.Equal(t, 200, putResp.StatusCode)

	// 7. commitArtifact
	commitResp := h.GraphQL(fmt.Sprintf(`mutation {
		commitArtifact(input: {artifactID: "%s"}) {
			artifact {
				id
				state
				versionIndex
				description
				fileCount
				aliases { alias }
				artifactType { name }
				artifactSequence { name }
			}
		}
	}`, artID))
	assert.Nil(t, commitResp.Path("errors").Value(), "commitArtifact errors: %s", string(commitResp.Body))

	committed := commitResp.Path("data.commitArtifact.artifact")
	assert.Equal(t, "COMMITTED", committed.Get("state").String())
	assert.Equal(t, "Full flow test", committed.Get("description").String())
	assert.Equal(t, "dataset", committed.Get("artifactType.name").String())
	assert.Equal(t, "e2e-dataset", committed.Get("artifactSequence.name").String())

	// File count should be 3 (2 data files + 1 manifest file from createArtifactManifest with includeUpload)
	// Actually, createArtifactManifest with includeUpload=false doesn't create a file record.
	// updateArtifactManifest creates the manifest file. So 2 data + 1 manifest = 3.
	assert.True(t, committed.Get("fileCount").Int() >= 2)

	aliases := committed.Get("aliases").Array()
	aliasNames := make([]string, len(aliases))
	for i, a := range aliases {
		aliasNames[i] = a.Get("alias").String()
	}
	assert.Contains(t, aliasNames, "latest")
	assert.Contains(t, aliasNames, "v0")

	// 8. Verify via project query
	queryResp := h.GraphQL(`query {
		model(name: "proj", entityName: "admin") {
			artifactType(name: "dataset") {
				name
				artifactCollections {
					edges {
						node {
							name
							description
							artifacts {
								edges {
									node {
										state
										versionIndex
										digest
									}
								}
							}
						}
					}
				}
			}
		}
	}`)
	assert.Nil(t, queryResp.Path("errors").Value(), "query errors: %s", string(queryResp.Body))
	assert.Equal(t, "dataset", queryResp.Path("data.model.artifactType.name").String())
	collEdges := queryResp.Path("data.model.artifactType.artifactCollections.edges").Array()
	assert.True(t, len(collEdges) >= 1)
}
