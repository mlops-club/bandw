# Backend Unlocks Specification

**Goal:** Implement the backend features required so that all Playwright tests pass against
both the bandw backend *and* the official the reference UI, all Go integration tests pass, all
Python SDK smoke tests pass, and the SDK conformance baseline (128 tests) holds with no
regressions.

**Based on:** `research.md` (50 questions, 2026-04-20)

---

## Current State

| Layer | Status |
|-------|--------|
| **SDK init/log/finish** | Working — `upsertBucket`, file stream, `viewer`, `serverInfo` |
| **Artifact core mutations** | Working — `createArtifact`, `createArtifactManifest`, `createArtifactFiles`, `updateArtifactManifest`, `commitArtifact`, `useArtifact`, `createArtifactType` |
| **Artifact advanced mutations** | Stubs returning `errNotImplemented` — `updateArtifact`, `addAliases`, `deleteAliases`, `linkArtifact`, `unlinkArtifact`, `deleteArtifact`, `deleteArtifactSequence`, `deleteArtifactPortfolio`, `updateArtifactSequence`, `updateArtifactPortfolio`, `moveArtifactSequence` |
| **Run file uploads** | Schema defined, resolver not implemented |
| **Reports (View CRUD)** | Not started — no `View` model, no mutations, no queries |
| **Run.files query** | Not implemented on the `RunResolver` |
| **File serving endpoint** | Artifact file upload/download via local storage exists; no run file serving |
| **Frontend** | Svelte 5 SPA — status not in scope of this spec |

---

## Deliverables

Seven backend feature areas, each described by: what gets built, the data model
changes, the GraphQL surface, the HTTP endpoints (if any), the acceptance criteria
(expressed as which tests must pass), and testing strategy.

---

## D1 — Run File Uploads (`createRunFiles`)

### What

Implement the `createRunFiles` mutation so the SDK can upload run-scoped files
(config.yaml, wandb-summary.json, wandb-metadata.json, output.log, requirements.txt,
media images, code snapshots, etc.).

### Data Model

Add a `RunFile` model to `store/models.go`:

```go
type RunFile struct {
    ID          string    `gorm:"type:varchar(36);primaryKey"`
    RunID       string    `gorm:"type:varchar(36);not null;index:idx_run_file"`
    Run         Run       `gorm:"foreignKey:RunID"`
    Name        string    `gorm:"type:varchar(2048);not null;index:idx_run_file"`
    StoragePath string    `gorm:"type:varchar(2048);not null"`
    UploadURL   string    `gorm:"type:varchar(4096)"`
    DirectURL   string    `gorm:"type:varchar(4096)"`
    MD5         string    `gorm:"type:varchar(32)"`
    Size        *int64
    Mimetype    string    `gorm:"type:varchar(255)"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

Add `RunFile` to the GORM `AutoMigrate` list.

### GraphQL

The schema is already defined:

```graphql
input CreateRunFilesInput {
    entityName: String!
    projectName: String!
    runName: String!
    files: [String!]!
}

type CreateRunFilesPayload {
    runID: String
    uploadHeaders: [String!]!
    files: [RunFileUploadInfo!]
}

type RunFileUploadInfo {
    name: String!
    uploadUrl: String
}
```

**Resolver behavior:**

1. Resolve entity + project + run from input names. If run not found, return `runID: null`
   (SDK treats this as a `CommError` — that's correct behavior for missing runs).
2. For each filename in `files`:
   - Compute `storagePath = runs/{runID}/{filename}`
   - Compute `uploadURL` and `directURL` via `r.store.UploadURL()` / `r.store.DirectURL()`
   - Upsert a `RunFile` record (same run + name = update existing)
3. Return `runID` (the internal UUID), `uploadHeaders` (containing the API key auth
   header as `"Authorization:Basic base64(api:{key})"` — or an empty list if upload
   endpoint handles auth itself), and the file list with upload URLs.

### HTTP Endpoint

The existing `PUT /files/{storagePath}` endpoint for artifact uploads must also accept
run file uploads. The storage paths are namespaced (`runs/` vs `artifacts/`), so no
collision.

### Acceptance Criteria

- **Go tests:** New `internal/graphql/run_files_test.go` — createRunFiles returns valid
  runID + upload URLs; uploading a file via PUT then downloading via GET returns identical
  bytes.
- **SDK smoke test:** `tests/smoke/test_sdk_e2e.py` continues to pass (the SDK now
  successfully uploads telemetry files instead of silently failing or being ignored).
- **SDK conformance:** No regressions in the 128-test baseline.
- **Playwright (14 tests):**
  - `runs/view/files-tab.spec.ts` — file browser visible with run files
  - `app/panels/code/code-panels.spec.ts` — code panel loads (code stored as artifact,
    but also needs run files for metadata)
  - All media panel tests that depend on image/audio/video file serving

### Testing Strategy

- **Go integration test:** Create a run via `upsertBucket`, call `createRunFiles` with
  `["config.yaml", "wandb-summary.json"]`, assert `runID` is non-null and `uploadUrl`
  values are valid. PUT a small file to the upload URL, GET from direct URL, compare bytes.
- **Python smoke test:** Extend `test_sdk_e2e.py` to verify that after `wandb.finish()`,
  the run's files endpoint returns expected filenames.

---

## D2 — Run.files GraphQL Query

### What

Add a `files` field to the `Run` type so the frontend can list and download run files.

### GraphQL

Already declared in schema:

```graphql
type Run {
    files(names: [String], pattern: String, after: String, first: Int): FileConnection
}
```

**Resolver behavior:**

1. Query `RunFile` records for the given `runID`.
2. If `names` is provided, filter to those exact filenames.
3. If `pattern` is provided, apply glob-style matching (Go's `path.Match`).
4. Apply Relay cursor pagination (`after`, `first`).
5. Return `FileConnection` with `FileResolver` nodes that expose `name`, `url`,
   `directUrl`, `sizeBytes`, `updatedAt`.

### Acceptance Criteria

- **Go test:** Query `run { files(first: 10) { edges { node { name directUrl } } } }`
  after creating run files; verify correct file list returned.
- **Playwright:** `runs/view/files-tab.spec.ts` — file browser shows `config.yaml`,
  `wandb-summary.json`, etc.

---

## D3 — Unified File Serving Endpoint

### What

Ensure a single HTTP endpoint serves both artifact files and run files for upload (PUT)
and download (GET), with correct content-type inference and auth.

### HTTP Routes

```
PUT  /files/{storagePath...}   — upload (accepts API key in Authorization header)
GET  /files/{storagePath...}   — download (accepts API key in Authorization header or cookie)
```

Storage path conventions:
- Artifact files: `artifacts/{artifactID}/{filename}`
- Run files: `runs/{runID}/{filename}`

### Content-Type Inference

On GET, infer from file extension:

| Extension | Content-Type |
|-----------|-------------|
| `.json` | `application/json` |
| `.yaml`, `.yml` | `application/x-yaml` |
| `.png` | `image/png` |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.gif` | `image/gif` |
| `.svg` | `image/svg+xml` |
| `.txt`, `.log` | `text/plain` |
| `.py` | `text/x-python` |
| `.html` | `text/html` |
| `.wav` | `audio/wav` |
| `.mp4` | `video/mp4` |
| `.webm` | `video/webm` |
| (default) | `application/octet-stream` |

### Auth

Accept `Authorization: Basic base64("api:{key}")` header. Validate against the `api_keys`
table. For download URLs embedded in GraphQL responses (`directUrl`), the URL itself
does not carry auth — the client must send the header.

### Acceptance Criteria

- **Go test:** PUT a PNG, GET it back, verify `Content-Type: image/png` and identical bytes.
- **Playwright (media tests):** Images render in workspace panels — this requires the
  GET endpoint to serve the image bytes with correct content type so `<img src="...">` works.

---

## D4 — Reports (View CRUD)

### What

Implement the `View` model and GraphQL mutations/queries so the frontend can create,
edit, list, and delete reports.

### Data Model

Add a `View` model to `store/models.go`:

```go
type View struct {
    ID          string         `gorm:"type:varchar(36);primaryKey"`
    Name        string         `gorm:"type:varchar(255)"`
    DisplayName string         `gorm:"type:varchar(255)"`
    Description string         `gorm:"type:text"`
    Type        string         `gorm:"type:varchar(64);default:runs"` // runs, artifacts, etc.
    ProjectID   string         `gorm:"type:varchar(36);not null;index"`
    Project     Project        `gorm:"foreignKey:ProjectID"`
    UserID      string         `gorm:"type:varchar(36);not null;index"`
    User        User           `gorm:"foreignKey:UserID"`
    Spec        datatypes.JSON `gorm:"type:json"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

### GraphQL Schema Additions

```graphql
type View {
    id: ID!
    name: String
    displayName: String
    description: String
    user: User
    spec: JSONString
    updatedAt: DateTime
    createdAt: DateTime
}

type ViewConnection {
    edges: [ViewEdge!]!
    pageInfo: PageInfo!
}

type ViewEdge {
    node: View
    cursor: String
}

# On Project type:
type Project {
    allViews(viewType: String, viewName: String, first: Int, after: String): ViewConnection
}

# Mutations:
input UpsertViewInput {
    id: String
    name: String
    displayName: String
    description: String
    entityName: String!
    projectName: String!
    type: String
    spec: JSONString
}

type UpsertViewPayload {
    view: View
    inserted: Boolean
}

input DeleteViewInput {
    id: ID!
}

type DeleteViewPayload {
    success: Boolean!
}
```

**Mutation behaviors:**

- `upsertView`: If `id` is provided and exists, update fields. Otherwise create new View.
  Return the View and `inserted: true/false`.
- `deleteView`: Soft-delete or hard-delete the View by ID. Return success.

**Query behavior:**

- `Project.allViews(viewType, viewName, first, after)`: List views for the project,
  optionally filtered by type and name. Relay cursor pagination.

### Acceptance Criteria

- **Go test:** New `internal/graphql/view_test.go` — upsertView creates a report,
  querying `allViews` returns it, upsertView with same ID updates it, deleteView removes it.
- **Playwright (18 tests):**
  - `reports/core/reports-core.spec.ts` — 10 tests covering create from workspace,
    create from tab, API-created report, add plots, add run sets, freeze, Markdown,
    section headings, save/auto-save, list reports.
  - `reports/advanced/reports-advanced.spec.ts` — 8 tests covering cross-project,
    duplicate, share URL, share embed, comment, multi-section, version history, export.
  - `track/project-page/reports-tab.spec.ts` — reports tab lists reports.

### Testing Strategy

- **Go integration test:** Full CRUD lifecycle: create, read, update, delete. Verify spec
  JSON round-trips correctly. Verify `allViews` pagination and filtering by viewType.
- **Python smoke test (optional):** Use the `wandb.Api().reports()` SDK method to create
  and list reports against our backend.

---

## D5 — Artifact Advanced Mutations

### What

Replace `errNotImplemented` stubs with working implementations for the artifact mutations
needed by the SDK and frontend.

### Mutations to Implement

| Mutation | Behavior |
|----------|----------|
| `updateArtifact` | Update description, metadata, TTL, aliases, tags on a COMMITTED artifact |
| `addAliases` | Add named aliases (e.g., `"production"`) to an artifact within its collection |
| `deleteAliases` | Remove aliases from an artifact |
| `deleteArtifact` | Transition artifact state to DELETED; optionally cascade-delete aliases |
| `deleteArtifactSequence` | Delete an entire artifact collection (sequence type) and all its versions |
| `updateArtifactSequence` | Update collection name, description, tags |
| `linkArtifact` | Link an artifact to a portfolio collection (creates membership + aliases) |
| `unlinkArtifact` | Remove an artifact from a portfolio |

Lower-priority (can remain stubs for now):
- `deleteArtifactPortfolio` — delete a portfolio collection
- `updateArtifactPortfolio` — update portfolio metadata
- `moveArtifactSequence` — re-parent a collection to a different artifact type

### Key Implementation Details

**updateArtifact:**
- Look up artifact by ID
- Update description, metadata (merge or replace), TTL
- If `aliases` provided: reconcile — add new aliases, remove missing ones (within the
  artifact's collection)
- If `tags` provided: reconcile artifact-level tags (requires an `ArtifactTag` join table
  if not already present, or reuse the collection tag mechanism)

**addAliases / deleteAliases:**
- Validate artifact exists and is COMMITTED
- For each alias: create/delete `ArtifactAlias` record within the artifact's collection
- `addAliases` must handle "latest" specially — don't allow manual creation (auto-managed)

**deleteArtifact:**
- Set `state = "DELETED"`
- If `deleteAliases: true`, remove all aliases pointing to this artifact
- Do not delete the actual files (soft delete)

**linkArtifact:**
- Find or create the portfolio collection by `artifactPortfolioName` in the given project
- Create an `ArtifactCollectionMembership`-style record (may need a new join table or
  reuse existing structures)
- Assign the requested aliases within the portfolio
- Return the `versionIndex` within the portfolio

### Acceptance Criteria

- **Go tests:** New tests in `internal/graphql/artifact_test.go` covering each mutation.
- **Python smoke test:** `tests/smoke/test_artifacts_e2e.py` — full artifact lifecycle
  including alias management, deletion, and retrieval via aliases.
- **Playwright:**
  - `artifacts/core/artifacts-core.spec.ts` — browse, download, versions, aliases, usage, lineage
  - `artifacts/advanced/artifacts-advanced.spec.ts` — create/delete, search, tags,
    metadata edit, compare versions, portfolio linking, dependency graph, TTL
  - `runs/view/artifacts-tab.spec.ts` — run detail artifacts tab shows input/output artifacts
  - `track/project-page/artifacts-tab.spec.ts` — project artifacts tab lists types/collections

---

## D6 — Artifact Queries & File Downloads

### What

Complete the artifact query resolvers so the frontend can browse artifacts, list versions,
view metadata, list files, and download artifact files.

### Queries to Implement/Complete

**Already partially working:** `artifact(id)`, `artifactCollection(id)`, `clientIDMapping`

**Need implementation on existing resolver types:**

| Query Path | Resolver | Behavior |
|-----------|----------|----------|
| `Project.artifact(name)` | `ProjectResolver.Artifact` | Parse `"collection:version_or_alias"`, resolve to artifact |
| `Project.artifactType(name)` | `ProjectResolver.ArtifactType` | Look up by name within project |
| `Project.artifactTypes(...)` | `ProjectResolver.ArtifactTypes` | List all types with pagination |
| `Project.artifactCollection(name)` | `ProjectResolver.ArtifactCollection` | Look up by name |
| `Project.artifactCollections(...)` | `ProjectResolver.ArtifactCollections` | List with filters, ordering, pagination |
| `ArtifactType.artifact(name)` | Resolve within type scope |
| `ArtifactType.artifactCollection(name)` | Resolve within type scope |
| `ArtifactType.artifactCollections(...)` | List collections of this type |
| `ArtifactCollection.artifacts(...)` | List versions with filters/ordering |
| `ArtifactCollection.aliases(...)` | List all aliases in the collection |
| `ArtifactCollection.artifactMembership(aliasName)` | Resolve specific alias to membership |
| `Artifact.files(names, ...)` | List artifact files via `ArtifactFileStored` |
| `Artifact.filesByManifestEntries(...)` | Look up files by manifest entry data |
| `Artifact.createdBy` | Return the creating Run |
| `Artifact.usedBy` | Return runs that used this artifact (from `ArtifactUsage` where type=input) |
| `Artifact.artifactMemberships` | Return collection memberships |
| `Artifact.currentManifest` | Return latest manifest |
| `Run.inputArtifacts(...)` | Artifacts used as input by this run |
| `Run.outputArtifacts(...)` | Artifacts created by this run |

### Acceptance Criteria

- **Go tests:** Query `project { artifactTypes { edges { node { name } } } }` returns
  types; `project { artifact(name: "my-dataset:latest") { id, digest } }` resolves correctly.
- **Playwright:** Artifact browser tests navigate types → collections → versions → files.

---

## D7 — Saved Workspace Views

### What

The `View` model (from D4) also serves workspace saved views. The `Project.views` field
stores workspace layout state (panel configuration, run set filters, column ordering).

### Implementation

This is the same `View` model as reports, distinguished by the `type` field:
- `type = "runs"` — standard report
- `type = "workspace"` — saved workspace view

The `Project.allViews(viewType: "workspace")` query returns workspace views.
The `upsertView` mutation creates/updates them.

The spec JSON for workspace views follows the same `panelGroups` + `runSets` structure
as reports (see research Q24-Q25).

### Acceptance Criteria

- **Playwright (7 workspace tests):**
  - `track/workspaces/saved-views-crud.spec.ts` — create, rename, delete saved views
  - `track/workspaces/workspace-undo-redo.spec.ts` — undo/redo panel changes
  - Other workspace tests that depend on view persistence

---

## Cross-Cutting Requirements

### SDK Conformance Gate

After all deliverables are implemented:

```bash
./tests/wandb-conformance/run.sh --quick   # 8 smoke tests — must pass
./tests/wandb-conformance/run.sh           # full suite — must match or exceed 128 baseline
```

No previously-passing test may start failing.

### Go Test Coverage

Each deliverable adds Go integration tests in the corresponding `*_test.go` file.
Tests use the existing `testutil.NewHarness(t)` pattern (in-memory SQLite, httptest.Server).

All Go tests must pass:

```bash
go test ./...
```

### Python Smoke Tests

Existing smoke tests must continue to pass:

```bash
uv run pytest tests/smoke/test_sdk_e2e.py -v
uv run pytest tests/smoke/test_artifacts_e2e.py -v
```

### Playwright Tests (Dual-Target)

All 175 Playwright spec files must pass against **both** targets:

```bash
# Against bandw backend
npx playwright test --project=bandw

# Against the reference
npx playwright test --project=wandb
```

The dual-target requirement ensures our tests are valid (they pass against the real W&B UI)
and our backend is compatible (the same tests pass against our implementation).

---

## Implementation Order

The deliverables have dependencies:

```
D1 (createRunFiles) ─────────┐
D3 (file serving endpoint) ──┤
                              ├── D2 (Run.files query) ── enables: files-tab, code, media tests
                              │
D5 (artifact advanced) ──────┤
D6 (artifact queries) ───────┤── enables: artifact browser, lineage, project artifacts tab
                              │
D4 (reports/views) ──────────┼── enables: report tests, reports tab
D7 (workspace views) ────────┘── enables: saved views, workspace persistence
```

**Recommended order:**

1. **D1 + D3** (parallel) — unblocks the most tests (~30+ via run file uploads + serving)
2. **D2** — depends on D1; adds Run.files query
3. **D5 + D6** (parallel) — artifact mutations + queries complete the artifact surface
4. **D4** — reports/views
5. **D7** — workspace views (lightweight once D4 exists)

---

## Test Count Summary

| Deliverable | Playwright Tests Unblocked | Go Tests Added | SDK Tests |
|-------------|---------------------------|----------------|-----------|
| D1 (createRunFiles) | ~14 | 3-5 | conformance baseline |
| D2 (Run.files) | 1 | 2-3 | — |
| D3 (file serving) | ~16 (media panels) | 2-3 | — |
| D4 (reports) | ~18 | 5-8 | — |
| D5 (artifact mutations) | ~6 | 8-12 | smoke test |
| D6 (artifact queries) | ~5 | 6-10 | smoke test |
| D7 (workspace views) | ~7 | 2-3 | — |
| **Total** | **~67 new passing** | **~28-44 new** | **128 baseline held** |

These ~67 tests, added to the existing ~340+ passing, should bring the Playwright suite
close to full green across all 175 spec files.
