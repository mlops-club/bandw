# Artifact Endpoints Specification

> **bandw** — self-hosted, W&B-compatible experiment tracking backend

This document specifies every endpoint (GraphQL and REST) that powers the
wandb SDK's artifact system. An endpoint is "in scope" if the official
`wandb` Python SDK calls it when logging, downloading, versioning, linking,
or deleting artifacts.

---

## Table of Contents

1. [Overview & Terminology](#1-overview--terminology)
2. [Artifact Data Model](#2-artifact-data-model)
3. [Artifact Lifecycle Workflows](#3-artifact-lifecycle-workflows)
4. [GraphQL Mutations](#4-graphql-mutations)
5. [GraphQL Queries](#5-graphql-queries)
6. [REST Endpoints](#6-rest-endpoints)
7. [Database Schema](#7-database-schema)
8. [SDK-to-Endpoint Mapping](#8-sdk-to-endpoint-mapping)

---

## 1. Overview & Terminology

| Term | Definition |
|------|------------|
| **Artifact** | An immutable, versioned bundle of files (dataset, model, etc.) tracked by W&B. |
| **ArtifactType** | A user-defined classification string (e.g. `"dataset"`, `"model"`). |
| **ArtifactSequence** | An ordered collection of artifact versions (v0, v1, v2…). Created implicitly on first `log_artifact`. |
| **ArtifactCollection** | Generic term covering both Sequences and Portfolios. |
| **Portfolio** | An unordered, curated set of artifact versions from potentially different sequences. Used in the Model Registry. |
| **Alias** | A mutable named pointer to a specific artifact version (e.g. `"latest"`, `"production"`). |
| **Tag** | A metadata label on an artifact or collection. |
| **Manifest** | A JSON document listing every file in an artifact version: logical path, content digest, size, and optional reference URI. |
| **ArtifactState** | `PENDING` → `COMMITTED` → `DELETED`. An artifact is not visible until committed. |
| **StorageLayout** | `V1` (flat by digest) or `V2` (hierarchical download URLs by entity/project/collection). Both use `artifacts/{artifact_id}/{filename}` in object storage. Determines download URL shape, not storage path. |

---

## 2. Artifact Data Model

### 2.1 Entity Relationships

```
Entity
 └── Project
      ├── ArtifactType ("dataset", "model", …)
      │    └── ArtifactCollection (Sequence or Portfolio)
      │         ├── Artifact v0 ──┬── ArtifactManifest ── ManifestEntry[]
      │         │                 ├── ArtifactAlias[] ("latest", "v0")
      │         │                 └── Tag[]
      │         ├── Artifact v1 ── …
      │         └── …
      └── Run
           ├── outputArtifacts[] (artifacts logged by this run)
           └── inputArtifacts[] (artifacts used/consumed by this run)
```

### 2.2 Enums

```graphql
enum ArtifactState           { PENDING, COMMITTED, DELETED }
enum ArtifactManifestType    { FULL, INCREMENTAL, PATCH }
enum ArtifactStorageLayout   { V1, V2 }
enum ArtifactDigestAlgorithm { MANIFEST_MD5 }
enum ArtifactCollectionType  { SEQUENCE, PORTFOLIO }
enum CompleteMultipartAction  { Complete }
```

### 2.3 Core GraphQL Types

#### Artifact

```graphql
type Artifact {
  id: ID!
  state: ArtifactState!
  digest: String!
  commitHash: String
  description: String
  metadata: JSONString
  versionIndex: Int                    # 0, 1, 2, …
  size: Int64
  fileCount: Int
  createdAt: DateTime
  updatedAt: DateTime
  ttlDurationSeconds: Int64
  ttlIsInherited: Boolean
  historyStep: Int64                   # wandb.log step when logged

  artifactType: ArtifactType!
  artifactSequence: ArtifactSequence!
  currentManifest: ArtifactManifest
  aliases: [ArtifactAlias!]
  tags: [Tag!]

  files(names: [String], after: String, first: Int): FileConnection
  filesByManifestEntries(
    storageLayout: String!             # "V1" or "V2"
    manifestVersion: String!           # manifest version identifier
    entries: [ArtifactManifestEntryInput!]
    storageRegion: String
  ): FileConnection

  createdBy: ArtifactCreator           # Union: Run | …
  usedBy: RunConnection                # no pagination args in schema
  artifactMemberships: ArtifactMembershipConnection  # no pagination args in schema
}
```

#### ArtifactType

```graphql
type ArtifactType {
  id: ID!
  name: String!
  description: String
  createdAt: DateTime
  artifact(name: String!): Artifact
  artifactCollection(name: String!): ArtifactCollection
  artifactCollections(
    after: String, first: Int,
    filters: JSONString, order: String
  ): ArtifactCollectionConnection
}
```

#### ArtifactSequence

```graphql
type ArtifactSequence {
  id: ID!
  name: String!
  description: String
  createdAt: DateTime
  updatedAt: DateTime
  project: Project
  latestArtifact: Artifact
  defaultArtifactType: ArtifactType
  tags: TagConnection
}
```

#### ArtifactCollection

```graphql
type ArtifactCollection {
  id: ID!
  name: String!
  description: String
  state: String                        # "active", "deleted"
  createdAt: DateTime
  updatedAt: DateTime
  project: Project
  defaultArtifactType: ArtifactType

  aliases(after: String, first: Int): ArtifactAliasConnection
  artifacts(
    after: String, first: Int,
    order: String, filters: JSONString
  ): ArtifactConnection
  artifactMembership(aliasName: String!): ArtifactCollectionMembership
  tags: TagConnection
}
```

#### ArtifactManifest

```graphql
type ArtifactManifest {
  id: ID!
  file: File!                          # The manifest JSON file itself
}
```

#### ArtifactAlias

```graphql
type ArtifactAlias {
  id: ID!
  alias: String!                       # "latest", "v1", "production"
  artifactCollection: ArtifactCollection
}
```

#### ArtifactCollectionMembership

```graphql
type ArtifactCollectionMembership {
  id: ID!
  versionIndex: Int
  artifact: Artifact
  aliases: [ArtifactAlias!]
  artifactCollection: ArtifactCollection
  files(names: [String], after: String, first: Int): FileConnection
}
```

#### Tag

```graphql
type Tag {
  id: ID!
  name: String!
}
```

#### File (used by manifest and artifact files)

```graphql
type File {
  id: ID!
  name: String!
  displayName: String
  url(upload: Boolean): String         # download URL when upload=false
  directUrl: String                    # direct object-store URL
  uploadUrl: String                    # pre-signed upload URL
  uploadHeaders: [String!]            # custom headers for upload PUT
  uploadMultipartUrls: UploadMultipartUrls
  storagePath: String
  sizeBytes: Int64
  md5: String
  digest: String
  mimetype: String
  updatedAt: DateTime
  artifact: Artifact
}

type UploadMultipartUrls {
  uploadID: String!
  uploadUrlParts: [UploadUrlPart!]!
}

type UploadUrlPart {
  partNumber: Int64!
  uploadUrl: String!
}
```

---

## 3. Artifact Lifecycle Workflows

### 3.1 Save Artifact (run.log_artifact / artifact.save)

```
SDK                                  Server
 │                                     │
 │─── createArtifact ────────────────→ │  1. Register artifact (PENDING)
 │←── { artifact.id, state } ─────────│
 │                                     │
 │─── createArtifactManifest ────────→ │  2. Reserve manifest record
 │    (includeUpload=false)            │     (does NOT request upload URL yet)
 │←── { manifest.id } ────────────────│
 │                                     │
 │─── createArtifactFiles (batched) ─→ │  3. Request upload URLs
 │←── { files[].uploadUrl/multipart }──│
 │                                     │
 │─── PUT file content to URLs ──────→ │  4. Upload file bytes (REST)
 │                                     │
 │─── completeMultipartUpload ───────→ │  5. (if multipart was used)
 │←── { digest } ─────────────────────│
 │                                     │
 │─── updateArtifactManifest ────────→ │  6a. For incremental/patch manifests:
 │    OR                               │      finalize digest, get upload URL
 │─── createArtifactManifest ────────→ │  6b. For full manifests: re-call with
 │←── { file.uploadUrl } ─────────────│      final digest to get upload URL
 │                                     │
 │─── PUT manifest JSON ─────────────→ │  7. Upload manifest file (REST)
 │                                     │
 │─── commitArtifact ────────────────→ │  8. Mark COMMITTED
 │←── { artifact.state: COMMITTED } ──│
 │                                     │
 │─── useArtifact (optional) ────────→ │  9. Record lineage
 │←── { artifact } ───────────────────│
```

### 3.2 Download Artifact (artifact.download / run.use_artifact)

```
SDK                                  Server
 │                                     │
 │─── Query artifact by name/id ─────→ │  1. Resolve artifact
 │←── { artifact.id, manifest, … } ───│
 │                                     │
 │─── Query currentManifest.file ────→ │  2. Get manifest download URL
 │←── { file.directUrl } ─────────────│
 │                                     │
 │─── GET manifest JSON ─────────────→ │  3. Download manifest (REST)
 │←── { entries[] } ──────────────────│
 │                                     │
 │─── filesByManifestEntries ────────→ │  4. Resolve download URLs
 │←── { files[].directUrl } ──────────│     for each manifest entry
 │                                     │
 │─── GET file content from URLs ────→ │  5. Download files (REST)
 │                                     │
 │─── useArtifact ───────────────────→ │  6. Record consumption lineage
 │←── { artifact } ───────────────────│
```

### 3.3 Update Artifact Metadata

```
SDK                                  Server
 │                                     │
 │─── updateArtifact ────────────────→ │  description, metadata, aliases,
 │←── { artifact } ───────────────────│  tags, ttlDurationSeconds
```

### 3.4 Link to Registry (Model Registry / Portfolio)

```
SDK                                  Server
 │                                     │
 │─── linkArtifact ──────────────────→ │  Link artifact version into a
 │←── { versionIndex } ──────────────│  portfolio collection
 │                                     │
 │─── unlinkArtifact ────────────────→ │  Remove from portfolio
 │←── { success } ───────────────────│
```

### 3.5 Delete Artifact

```
SDK                                  Server
 │                                     │
 │─── deleteArtifact ────────────────→ │  Mark as DELETED
 │←── { artifact.state: DELETED } ────│  Optionally delete aliases
```

### 3.6 Distributed Artifact (multi-worker)

```
Worker 1: run.upsert_artifact(art, distributed_id="abc")
          → createArtifact (with distributedID)
          → upload worker 1's files
          → (does NOT commit)

Worker 2: run.upsert_artifact(art, distributed_id="abc")
          → createArtifact (same distributedID, deduped)
          → upload worker 2's files
          → (does NOT commit)

Worker 0: run.finish_artifact(art, distributed_id="abc")
          → commitArtifact (finalizes the assembled artifact)
```

---

## 4. GraphQL Mutations

### 4.1 createArtifact

Registers a new artifact version in PENDING state.

**Input:**
```graphql
input CreateArtifactInput {
  entityName: String!
  projectName: String!
  runName: String                      # null for standalone (artifact.save())
  artifactTypeName: String!            # e.g. "dataset", "model"
  artifactCollectionName: String!      # sequence name
  artifactCollectionNames: [String!]!  # alternate names (usually same)
  digest: String!                      # MANIFEST_MD5 content hash
  digestAlgorithm: ArtifactDigestAlgorithm!  # MANIFEST_MD5
  description: String
  metadata: JSONString                 # arbitrary JSON
  labels: JSONString
  aliases: [ArtifactAliasInput!]!     # initial aliases (e.g. ["latest"])
  clientID: String!                    # client-side dedup ID
  sequenceClientID: String!           # sequence dedup ID
  enableDigestDeduplication: Boolean!  # skip upload if digest matches
  historyStep: Int64                   # training step context
  distributedID: String               # for multi-worker artifacts
  clientMutationId: String
  ttlDurationSeconds: Int64           # time-to-live
  tags: [TagInput!]                   # metadata tags
  storageRegion: String
}
```

**Payload:**
```graphql
type CreateArtifactPayload {
  artifact: Artifact!
}
```

**Behavior:**
- Auto-creates `ArtifactType` if it doesn't exist.
- Auto-creates `ArtifactSequence` (collection) if it doesn't exist.
- Assigns `versionIndex` (auto-incremented within the sequence).
- `enableDigestDeduplication`: exact dedup behavior is SDK/server-version-dependent (needs verification during implementation).
- Sets state to `PENDING`.
- Alias assignment (e.g. `"latest"`) behavior is SDK/server-version-dependent (needs verification during implementation).

**SDK callers:** `run.log_artifact()`, `artifact.save()`, `run.upsert_artifact()`

---

### 4.2 createArtifactManifest

Reserves a manifest record for the artifact. Called after `createArtifact`.

**Input:**
```graphql
input CreateArtifactManifestInput {
  artifactID: ID!
  baseArtifactID: ID                   # for INCREMENTAL/PATCH manifests
  name: String!                        # manifest filename
  digest: String!                      # initial manifest digest
  entityName: String!
  projectName: String!
  runName: String!
  type: ArtifactManifestType!          # FULL | INCREMENTAL | PATCH
}
```

**Payload:**
```graphql
type CreateArtifactManifestPayload {
  artifactManifest: ArtifactManifest!  # includes file.uploadUrl
}
```

**Behavior:**
- Creates the manifest record linked to the artifact.
- For `FULL` manifests, this is the complete file listing.
- For `INCREMENTAL`, only new/changed entries relative to `baseArtifactID`.
- For `PATCH`, a partial update.
- Returns an upload URL for the manifest JSON file itself.

**SDK callers:** `run.log_artifact()`, `artifact.save()`

---

### 4.3 createArtifactFiles

Requests pre-signed upload URLs for artifact content files.

**Input:**
```graphql
input CreateArtifactFilesInput {
  artifactFiles: [CreateArtifactFileSpecInput!]!
  storageLayout: ArtifactStorageLayout!  # V1 or V2
}

input CreateArtifactFileSpecInput {
  artifactID: ID!
  artifactManifestID: ID
  name: String!                        # logical file path
  md5: String!                         # content MD5 (base64)
  mimetype: String
  uploadPartsInput: [UploadPartsInput!]!  # for multipart
}

input UploadPartsInput {
  hexMD5: String!                      # hex-encoded part MD5
  partNumber: Int64!
}
```

**Payload:**
```graphql
type CreateArtifactFilesPayload {
  files: FileConnection!               # each File has uploadUrl or uploadMultipartUrls
}
```

**Behavior:**
- For small files: returns a single `uploadUrl` per file.
- For large files (multipart): returns `uploadMultipartUrls` with `uploadID` and per-part URLs.
- Server creates storage records and generates pre-signed URLs pointing to object storage (S3/MinIO).
- Files with matching digest may be deduplicated (server returns existing URL, skips upload).
- SDK batches these requests (typically 10,000 files per batch).

**SDK callers:** `run.log_artifact()`, `artifact.save()`

---

### 4.4 completeMultipartUploadArtifact

Finalizes a multipart file upload after all parts are uploaded.

**Input:**
```graphql
input CompleteMultipartUploadArtifactInput {
  completeMultipartAction: CompleteMultipartAction!  # "Complete"
  completedParts: [UploadPartsInput!]!  # partNumber + hexMD5 for each part
  artifactID: ID!
  storagePath: String!                  # object store path
  uploadID: String!                     # from createArtifactFiles response
}
```

**Payload:**
```graphql
type CompleteMultipartUploadArtifactPayload {
  digest: String
}
```

**Behavior:**
- Calls object storage's CompleteMultipartUpload API.
- Validates part checksums.
- Only needed when `uploadMultipartUrls` was returned by `createArtifactFiles`.

**SDK callers:** `run.log_artifact()` (for large files)

---

### 4.5 updateArtifactManifest

Finalizes the manifest after all files are uploaded. Returns a URL to upload the manifest JSON.

**Input:**
```graphql
input UpdateArtifactManifestInput {
  artifactManifestID: ID!
  digest: String                       # final manifest digest
  baseArtifactID: ID                   # for incremental manifests
}
```

**Payload:**
```graphql
type UpdateArtifactManifestPayload {
  artifactManifest: ArtifactManifest!  # file.uploadUrl for manifest upload
}
```

**Behavior:**
- Updates the manifest's content digest.
- Returns a fresh upload URL for the manifest JSON file.
- SDK then PUTs the manifest JSON to this URL.

**SDK callers:** `run.log_artifact()`, `artifact.save()`

---

### 4.6 commitArtifact

Transitions artifact from PENDING to COMMITTED. Makes it visible and downloadable.

**Input:**
```graphql
input CommitArtifactInput {
  artifactID: ID!
}
```

**Payload:**
```graphql
type CommitArtifactPayload {
  artifact: Artifact!                  # state: COMMITTED
}
```

**Behavior:**
- Validates all files are uploaded and manifest is present.
- Sets `state = COMMITTED`.
- The artifact becomes visible in queries and UI.
- Alias `"latest"` is confirmed on this version.

**SDK callers:** `run.log_artifact()`, `artifact.save()`, `run.finish_artifact()`

---

### 4.7 useArtifact

Records that a run consumed (used as input) a specific artifact. Powers lineage tracking.

**Input:**
```graphql
input UseArtifactInput {
  entityName: String!
  projectName: String!
  runName: String!
  artifactID: ID!
  usedAs: String                       # optional label (e.g. "training_data")
  clientMutationId: String
  artifactEntityName: String           # artifact's origin entity
  artifactProjectName: String          # artifact's origin project
}
```

**Payload:**
```graphql
type UseArtifactPayload {
  artifact: Artifact!
}
```

**Behavior:**
- Creates a record in `artifact_usage` table with `type = "input"`.
- Makes the artifact appear in `run.inputArtifacts`.
- The consuming run appears in `artifact.usedBy`.

**SDK callers:** `run.use_artifact()`, `artifact.download()` (implicit)

---

### 4.8 updateArtifact

Modifies artifact metadata after creation.

**Input:**
```graphql
input UpdateArtifactInput {
  artifactID: ID!
  description: String
  metadata: JSONString
  aliases: [ArtifactAliasInput!]       # replace all aliases
  ttlDurationSeconds: Int64
}
```

**Payload:**
```graphql
type UpdateArtifactPayload {
  artifact: Artifact!
}
```

**Behavior:**
- Updates mutable fields (description, metadata, TTL).
- When `aliases` is provided, replaces all aliases on the artifact.
- TTL removal: set `ttlDurationSeconds` to null. The SDK uses `None` for removal; exact server behavior for 0 vs null needs verification during implementation.

**SDK callers:** `artifact.save()` (after modifying `.description`, `.metadata`, `.aliases`, `.ttl`)

---

### 4.9 addAliases / deleteAliases

Add or remove specific aliases without replacing all of them.

**Input:**
```graphql
input AddAliasesInput {
  artifactID: ID!
  aliases: [ArtifactAliasInput!]!
}

input DeleteAliasesInput {
  artifactID: ID!
  aliases: [ArtifactAliasInput!]!
}

input ArtifactAliasInput {
  alias: String!                       # e.g. "production"
  artifactCollectionName: String!      # sequence name
}
```

**Payloads:**
```graphql
type AddAliasesPayload    { success: Boolean! }
type DeleteAliasesPayload { success: Boolean! }
```

**Behavior:**
- `addAliases`: Creates new alias pointers. If alias already exists on another version in the same collection, moves it.
- `deleteAliases`: Removes alias pointers. Cannot delete the `"latest"` auto-alias.

**SDK callers:** `artifact.aliases = [...]` then `artifact.save()`

---

### 4.10 linkArtifact

Links an artifact version into a portfolio (Model Registry).

**Input:**
```graphql
input LinkArtifactInput {
  artifactPortfolioName: String!       # portfolio collection name
  entityName: String!
  projectName: String!
  artifactID: ID                       # the artifact version to link
  clientID: ID
  aliases: [ArtifactAliasInput!]       # aliases within the portfolio
}
```

**Payload:**
```graphql
type LinkArtifactPayload {
  versionIndex: Int                    # version number within the portfolio
  artifactMembership: ArtifactCollectionMembership  # the created membership
}
```

**Behavior:**
- Creates or finds the portfolio collection.
- Adds the artifact as a member with a portfolio-scoped version index.
- Applies any requested aliases within the portfolio scope.

**SDK callers:** `run.link_artifact()`, `artifact.link()`

---

### 4.11 unlinkArtifact

Removes an artifact from a portfolio.

**Input:**
```graphql
input UnlinkArtifactInput {
  artifactID: ID!
  portfolioName: String!
  entityName: String!
  projectName: String!
}
```

**Payload:**
```graphql
type UnlinkArtifactPayload {
  success: Boolean!
}
```

**SDK callers:** `artifact.unlink()`

---

### 4.12 deleteArtifact

Marks an artifact as DELETED.

**Input:**
```graphql
input DeleteArtifactInput {
  artifactID: ID!
  deleteAliases: Boolean               # also remove all aliases
}
```

**Payload:**
```graphql
type DeleteArtifactPayload {
  artifact: Artifact                   # state: DELETED (nullable)
}
```

**Behavior:**
- Sets `state = DELETED`.
- If `deleteAliases` is true, removes all alias pointers.
- Files may be garbage-collected later (not immediate).

**SDK callers:** `artifact.delete()`

---

### 4.13 deleteArtifactSequence / deleteArtifactPortfolio

Deletes an entire collection and all its artifact versions.

**Inputs:**
```graphql
input DeleteArtifactSequenceInput  { artifactSequenceID: ID! }
input DeleteArtifactPortfolioInput { artifactPortfolioID: ID! }
```

**Payloads:**
```graphql
type DeleteArtifactSequencePayload  { artifactCollection: ArtifactCollection }
type DeleteArtifactPortfolioPayload { artifactCollection: ArtifactCollection }
```

**SDK callers:** `collection.delete()` (public API)

---

### 4.14 updateArtifactSequence / updateArtifactPortfolio

Updates collection metadata.

**Input (sequence):**
```graphql
input UpdateArtifactSequenceInput {
  artifactSequenceID: ID!
  name: String
  description: String
  tags: [TagInput!]
}
```

**Input (portfolio):**
```graphql
input UpdateArtifactPortfolioInput {
  artifactPortfolioID: ID!
  name: String
  description: String
}
```

**Payloads:**
```graphql
type UpdateArtifactSequencePayload  { artifactCollection: ArtifactCollection }
type UpdateArtifactPortfolioPayload { artifactCollection: ArtifactCollection }
```

**SDK callers:** `collection.save()` (public API, after modifying `.name`, `.description`, `.tags`)

---

### 4.15 moveArtifactSequence

Changes the artifact type of a sequence.

**Input:**
```graphql
input MoveArtifactSequenceInput {
  artifactSequenceID: ID!
  destinationArtifactTypeName: String!
}
```

**Payload:**
```graphql
type MoveArtifactSequencePayload { artifactCollection: ArtifactCollection }
```

**SDK callers:** `collection.change_type()` (public API, deprecated)

---

### 4.16 createArtifactType

Ensures an artifact type exists (idempotent).

**Input:**
```graphql
input CreateArtifactTypeInput {
  entityName: String!
  projectName: String!
  name: String!
  description: String
}
```

**Payload:**
```graphql
type CreateArtifactTypePayload { artifactType: ArtifactType! }
```

**Behavior:**
- Creates the type if it doesn't exist, returns it if it does.
- Usually called implicitly by `createArtifact`, but SDK may call directly.

---

### 4.17 createArtifactCollectionTagAssignments / deleteArtifactCollectionTagAssignments

Add or remove tags on an artifact collection.

**Input:**
```graphql
input CreateArtifactCollectionTagAssignmentsInput {
  artifactCollectionID: ID!
  tags: [TagInput!]!
}

input DeleteArtifactCollectionTagAssignmentsInput {
  artifactCollectionID: ID!
  tags: [TagInput!]!
}

input TagInput {
  tagName: String!
  tagCategoryName: String
  attributes: String
}
```

**Payloads:**
```graphql
type CreateArtifactCollectionTagAssignmentsPayload { tags: [Tag!] }
type DeleteArtifactCollectionTagAssignmentsPayload { success: Boolean! }
```

**SDK callers:** `collection.tags = [...]` then `collection.save()` (public API)

---

## 5. GraphQL Queries

### 5.1 Top-Level Queries

| Query | Signature | Purpose |
|-------|-----------|---------|
| `artifact` | `(id: ID!): Artifact` | Fetch artifact by server ID |
| `artifactCollection` | `(id: ID!): ArtifactCollection` | Fetch collection by server ID |
| `clientIDMapping` | `(clientID: ID!): ClientIDMappingResult` | Resolve client-side dedup ID to server ID |

### 5.2 Project-Scoped Queries

| Field | Signature | Purpose |
|-------|-----------|---------|
| `project.artifact` | `(name: String!, enableTracking: Boolean): Artifact` | Fetch artifact by `collection:version` name |
| `project.artifactType` | `(name: String!): ArtifactType` | Fetch type by name |
| `project.artifactTypes` | `(after, first, includeAll): ArtifactTypeConnection` | List all types in project |
| `project.artifactCollection` | `(name: String!): ArtifactCollection` | Fetch collection by name |
| `project.artifactCollections` | `(after, first, filters, order): ArtifactCollectionConnection` | List collections with filtering |
| `project.artifactCollectionMembership` | `(name: String!): ArtifactCollectionMembership` | Resolve name to membership |

### 5.3 Entity-Scoped Queries

| Field | Signature | Purpose |
|-------|-----------|---------|
| `entity.artifactCollections` | `(projectFilters, filters, collectionTypes, after, first): ArtifactCollectionConnection` | List collections across projects |
| `entity.artifactMemberships` | `(projectFilters, collectionFilters, filters, after, first): ArtifactMembershipConnection` | List memberships across projects |

### 5.4 Run-Scoped Queries

| Field | Signature | Purpose |
|-------|-----------|---------|
| `run.inputArtifacts` | `(after, first): ArtifactConnection` | Artifacts consumed by the run |
| `run.outputArtifacts` | `(after, first): ArtifactConnection` | Artifacts produced by the run |

### 5.5 Artifact Field Queries (nested resolvers)

| Field | Signature | Purpose |
|-------|-----------|---------|
| `artifact.artifactType` | `: ArtifactType` | The type classification |
| `artifact.artifactSequence` | `: ArtifactSequence` | The owning sequence |
| `artifact.currentManifest` | `: ArtifactManifest` | Current manifest (for download) |
| `artifact.aliases` | `: [ArtifactAlias!]` | All aliases on this version |
| `artifact.tags` | `: [Tag!]` | All tags on this version |
| `artifact.files` | `(names, after, first): FileConnection` | List files with download URLs |
| `artifact.filesByManifestEntries` | `(storageLayout, manifestVersion, entries, storageRegion): FileConnection` | Get download URLs for specific manifest entries |
| `artifact.createdBy` | `: ArtifactCreator` | The run that created this artifact |
| `artifact.usedBy` | `(after, first): RunConnection` | Runs that consumed this artifact |
| `artifact.artifactMemberships` | `(after, first): ArtifactMembershipConnection` | Portfolio memberships |

### 5.6 Collection Field Queries

| Field | Signature | Purpose |
|-------|-----------|---------|
| `collection.aliases` | `(after, first): ArtifactAliasConnection` | All aliases in collection |
| `collection.artifacts` | `(after, first, order, filters): ArtifactConnection` | All versions |
| `collection.artifactMembership` | `(aliasName: String!): ArtifactCollectionMembership` | Resolve alias to version |
| `collection.tags` | `: TagConnection` | Collection tags |

### 5.7 ArtifactType Field Queries

| Field | Signature | Purpose |
|-------|-----------|---------|
| `artifactType.artifact` | `(name: String!): Artifact` | Fetch artifact within type |
| `artifactType.artifactCollection` | `(name: String!): ArtifactCollection` | Fetch collection within type |
| `artifactType.artifactCollections` | `(after, first, filters, order): ArtifactCollectionConnection` | List collections of this type |

---

## 6. REST Endpoints

### 6.1 File Upload (Pre-signed URLs)

**Endpoint:** URLs returned by `createArtifactFiles` and `updateArtifactManifest`

These are typically pre-signed S3/MinIO URLs, but may be relative paths prefixed with `base_url` for proxied uploads.

#### Single-Part Upload
```
PUT {uploadUrl}
Content-Type: {mimetype}
Headers: {uploadHeaders from GraphQL response}
Body: <file bytes>

Response: 200 OK
  ETag: "<md5>"
```

#### Multi-Part Upload
```
# For each part:
PUT {uploadUrlParts[i].uploadUrl}
Body: <part bytes>

Response: 200 OK
  ETag: "<part-md5>"

# Then finalize via completeMultipartUploadArtifact GraphQL mutation
```

### 6.2 Artifact Download — V1 Layout

**Endpoint:** `GET /artifacts/{entity}/{digest}`

Used when `ArtifactStorageLayout = V1` (flat storage by content digest).

| Parameter | Type | Description |
|-----------|------|-------------|
| `entity` | path | Entity/org name |
| `digest` | path | File content digest |

**Response:** `200 OK`, `application/octet-stream` — raw file bytes

**Auth:** `Authorization: Basic base64("api:{key}")` or `Authorization: Bearer {token}`

### 6.3 Artifact Download — V2 Layout

**Endpoint:** `GET /artifactsV2/{region}/{entity}/{project}/{collection}/{artifactOrBirthId}/{birthArtifactIdOrDigest}/{digestOrFilename}/{filename}`

Used when `ArtifactStorageLayout = V2` (hierarchical download URLs).

Path variants:
- `/artifactsV2/{region}/{entity}/{project}/{collection}/{artifact_id}/{birth_artifact_id}/{digest}/{filename}`
- `/artifactsV2/{region}/{entity}/{project}/{collection}/{birth_artifact_id}/{digest}/{filename}`
- `/artifactsV2/{region}/{entity}/{birth_artifact_id}/{digest}`

| Parameter | Type | Description |
|-----------|------|-------------|
| `region` | path | Storage region identifier |
| `entity` | path | Entity/org name |
| `project` | path | Project name |
| `collection` | path | Artifact collection name |
| `artifactOrBirthId` | path | Artifact ID or birth artifact ID |
| `birthArtifactIdOrDigest` | path | Birth artifact ID or content digest |
| `digestOrFilename` | path | Content digest or filename |
| `filename` | path | File name (may be omitted in shorter variants) |

**Response:** `200 OK`, `application/octet-stream` — raw file bytes

**Auth:** `Authorization: Basic base64("api:{key}")` or `Authorization: Bearer {token}`

### 6.4 Pre-signed URL Upload Proxy

**Endpoint:** `PUT /upload/{storagePath}`

When the server returns relative upload URLs (not absolute S3 URLs), the SDK prefixes with `base_url`. The server proxies the upload to object storage.

| Parameter | Type | Description |
|-----------|------|-------------|
| `storagePath` | path | Object storage path for the file |

**Auth:** `Authorization: Basic base64("api:{key}")` or `Authorization: Bearer {token}`

```
PUT {base_url}/upload/{storagePath}
Content-Type: application/octet-stream
Body: <file bytes>

Response: 200 OK
```

---

## 7. Database Schema

> **Source of truth:** `docs/system-spec.md` lines 300-468. The tables below are
> copied verbatim. Any deviations during implementation should be documented.

```sql
-- Artifacts
CREATE TABLE artifact_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,           -- "model", "dataset", etc.
    project_id VARCHAR(36) REFERENCES projects(id),
    UNIQUE (project_id, name)
);

CREATE TABLE artifact_collections (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('sequence', 'portfolio') DEFAULT 'sequence',
    artifact_type_id VARCHAR(36) REFERENCES artifact_types(id),
    project_id VARCHAR(36) REFERENCES projects(id),
    state ENUM('active', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (project_id, name)
);

CREATE TABLE artifacts (
    id VARCHAR(36) PRIMARY KEY,
    collection_id VARCHAR(36) REFERENCES artifact_collections(id),
    digest VARCHAR(255) NOT NULL,
    state ENUM('PENDING', 'COMMITTED', 'DELETED') DEFAULT 'PENDING',
    description TEXT,
    metadata JSON,
    version_index INT,                    -- v0, v1, v2, ...
    size BIGINT,
    file_count INT,
    commit_hash VARCHAR(255),
    ttl_duration_seconds BIGINT,
    ttl_is_inherited BOOLEAN DEFAULT FALSE,
    history_step BIGINT,
    created_by_run_id VARCHAR(36) REFERENCES runs(id),
    client_id VARCHAR(36),
    sequence_client_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    committed_at TIMESTAMP NULL
);

CREATE TABLE artifact_aliases (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    collection_id VARCHAR(36) REFERENCES artifact_collections(id),
    alias VARCHAR(255) NOT NULL,          -- "latest", "v0", "production"
    UNIQUE (collection_id, alias)
);

CREATE TABLE artifact_manifests (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    type ENUM('FULL', 'INCREMENTAL', 'PATCH') DEFAULT 'FULL',
    digest VARCHAR(255) NOT NULL,
    file_id VARCHAR(36) REFERENCES artifact_files_stored(id),
    base_artifact_id VARCHAR(36) REFERENCES artifacts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artifact_manifest_entries (
    id VARCHAR(36) PRIMARY KEY,
    manifest_id VARCHAR(36) REFERENCES artifact_manifests(id),
    path VARCHAR(2048) NOT NULL,          -- logical path within artifact
    digest VARCHAR(255) NOT NULL,         -- content hash
    ref VARCHAR(2048),                    -- external reference URL
    size BIGINT,
    mimetype VARCHAR(255),
    birth_artifact_id VARCHAR(36),
    extra JSON,                           -- additional metadata
    INDEX idx_manifest_entries (manifest_id)
);

CREATE TABLE tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE artifact_collection_tags (
    collection_id VARCHAR(36) REFERENCES artifact_collections(id),
    tag_id VARCHAR(36) REFERENCES tags(id),
    PRIMARY KEY (collection_id, tag_id)
);

CREATE TABLE artifact_files_stored (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    name VARCHAR(2048) NOT NULL,
    storage_path VARCHAR(2048) NOT NULL,  -- path in object storage
    md5 VARCHAR(32),
    size BIGINT,
    upload_url VARCHAR(4096),             -- pre-signed URL (temporary)
    upload_headers JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artifact_usage (
    id VARCHAR(36) PRIMARY KEY,
    run_id VARCHAR(36) REFERENCES runs(id),
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    type ENUM('input', 'output') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (run_id, artifact_id, type)
);

-- Additional compatibility columns (ALTER statements)
ALTER TABLE artifact_files_stored
    ADD COLUMN direct_url VARCHAR(4096) NULL,
    ADD COLUMN display_name VARCHAR(2048) NULL,
    ADD COLUMN birth_artifact_id VARCHAR(36) NULL;
```

### 7.2 Model Registry Tables

```sql
CREATE TABLE registries (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_id VARCHAR(36) REFERENCES entities(id),
    organization_id VARCHAR(36),
    description TEXT,
    visibility ENUM('public', 'private', 'team') DEFAULT 'private',
    allow_all_artifact_types BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entity_id, name)
);

CREATE TABLE registry_allowed_types (
    registry_id VARCHAR(36) REFERENCES registries(id),
    artifact_type VARCHAR(255),
    PRIMARY KEY (registry_id, artifact_type)
);

CREATE TABLE registry_members (
    registry_id VARCHAR(36) REFERENCES registries(id),
    user_id VARCHAR(36) REFERENCES users(id),
    role ENUM('admin', 'member', 'viewer') DEFAULT 'viewer',
    PRIMARY KEY (registry_id, user_id)
);

CREATE TABLE registry_team_members (
    registry_id VARCHAR(36) REFERENCES registries(id),
    team_id VARCHAR(36) REFERENCES teams(id),
    role ENUM('admin', 'member', 'viewer') DEFAULT 'viewer',
    PRIMARY KEY (registry_id, team_id)
);

CREATE TABLE registry_linked_artifacts (
    id VARCHAR(36) PRIMARY KEY,
    registry_id VARCHAR(36) REFERENCES registries(id),
    collection_name VARCHAR(255) NOT NULL, -- portfolio name in registry
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    version_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. SDK-to-Endpoint Mapping

This table maps every public SDK method to the GraphQL/REST endpoints it calls.

### 8.1 wandb.Artifact (in-run context via run.log_artifact)

| SDK Method | Endpoint(s) Called |
|---|---|
| `wandb.Artifact(name, type)` | (local only — no server call) |
| `artifact.add_file(path)` | (local only — stages file) |
| `artifact.add_dir(path)` | (local only — stages files) |
| `artifact.add_reference(uri)` | (local only — adds manifest entry) |
| `artifact.add(obj, name)` | (local only — serializes WBValue) |
| `artifact.new_file(name)` | (local only — context manager) |
| `artifact.remove(item)` | (local only — removes from manifest) |
| `run.log_artifact(artifact)` | `createArtifact` → `createArtifactManifest` → `createArtifactFiles` → PUT uploads → `completeMultipartUploadArtifact` (if multipart) → `updateArtifactManifest` → PUT manifest → `commitArtifact` |
| `artifact.save()` | Same as `run.log_artifact` but standalone (no run) |
| `artifact.wait()` | (polls local state — waits for async upload) |

### 8.2 wandb.Artifact (download & read)

| SDK Method | Endpoint(s) Called |
|---|---|
| `artifact.download(root)` | `artifact.currentManifest.file` → GET manifest → `filesByManifestEntries` → GET files |
| `artifact.checkout(root)` | Same as `download` + local cleanup |
| `artifact.verify(root)` | Same as `download` (checksum only) |
| `artifact.file(root)` | Same as `download` (single file) |
| `artifact.files()` | `artifact.files(names, after, first)` query |
| `artifact.get(name)` | `artifact.files` or cached manifest → GET file → deserialize |
| `artifact.get_entry(name)` | (manifest lookup — may query `artifact.currentManifest`) |
| `artifact[name]` | Same as `artifact.get(name)` |

### 8.3 wandb.Artifact (metadata & lifecycle)

| SDK Method / Property | Endpoint(s) Called |
|---|---|
| `artifact.description = "..."` | (local — applied on next `save()`) |
| `artifact.metadata = {...}` | (local — applied on next `save()`) |
| `artifact.aliases = [...]` | `updateArtifact` (with aliases) |
| `artifact.tags = [...]` | `updateArtifact` |
| `artifact.ttl = timedelta(...)` | `updateArtifact` (with ttlDurationSeconds) |
| `artifact.save()` | `updateArtifact` |
| `artifact.delete()` | `deleteArtifact` |
| `artifact.link(target_path)` | `linkArtifact` |
| `artifact.unlink()` | `unlinkArtifact` |
| `artifact.logged_by()` | `artifact.createdBy` query |
| `artifact.used_by()` | `artifact.usedBy` query |

### 8.4 wandb.Run artifact methods

| SDK Method | Endpoint(s) Called |
|---|---|
| `run.log_artifact(art)` | (see 8.1 above) |
| `run.use_artifact(name)` | `project.artifact(name)` query → `useArtifact` mutation (records lineage; does NOT download) |
| `run.link_artifact(art, path)` | `linkArtifact` |
| `run.upsert_artifact(art, distributed_id)` | `createArtifact` (with distributedID) → upload files (no commit) |
| `run.finish_artifact(art, distributed_id)` | Assembles distributed artifact parts → `commitArtifact` (exact internal flow is SDK-version-dependent) |

### 8.5 wandb.Api (public API)

| SDK Method | Endpoint(s) Called |
|---|---|
| `api.artifact(name)` | `project.artifact(name)` query |
| `api.artifacts(type, name)` | `project.artifactType.artifactCollection.artifacts` query |
| `api.artifact_type(name)` | `project.artifactType(name)` query |
| `api.artifact_types()` | `project.artifactTypes` query |
| `api.artifact_collection(type, name)` | `project.artifactType.artifactCollection` query |
| `api.artifact_collections(project, type)` | `project.artifactType.artifactCollections` query |
| `api.artifact_exists(name)` | `project.artifact(name)` query (returns bool) |
| `api.artifact_collection_exists(name, type)` | Query (returns bool) |
| `api_run.logged_artifacts()` | `run.outputArtifacts` query |
| `api_run.used_artifacts()` | `run.inputArtifacts` query |

### 8.6 ArtifactCollection (public API)

| SDK Method | Endpoint(s) Called |
|---|---|
| `collection.artifacts()` | `collection.artifacts(after, first)` query |
| `collection.save()` | `updateArtifactSequence` or `updateArtifactPortfolio` + tag mutations |
| `collection.delete()` | `deleteArtifactSequence` or `deleteArtifactPortfolio` |

---

## Appendix A: Manifest JSON Format

The manifest file uploaded to the server is a JSON document:

```json
{
  "version": 1,
  "storagePolicy": "wandb-storage-policy-v1",
  "storagePolicyConfig": {
    "storageLayout": "V2"
  },
  "contents": {
    "path/to/file.txt": {
      "digest": "abc123def456...",
      "size": 1024,
      "birthArtifactID": null,
      "ref": null,
      "extra": {}
    },
    "model/weights.pt": {
      "digest": "789xyz...",
      "size": 50000000,
      "birthArtifactID": "prev-artifact-id",
      "ref": null,
      "extra": {}
    }
  }
}
```

For reference artifacts, the `ref` field contains the external URI (e.g. `s3://bucket/path`).

## Appendix B: Authentication

All artifact endpoints require authentication:

```
Authorization: Basic base64("api:{api_key}")
  OR
Authorization: Bearer {access_token}
```

The SDK also sends:
```
X-WANDB-USERNAME: {username}
X-WANDB-USER-EMAIL: {email}
User-Agent: wandb-python/{version}
```
