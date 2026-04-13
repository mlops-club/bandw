# EXECUTION PLAN: Vertical Slices (Detailed)

Cross-sectional development: each slice adds one capability end-to-end
(SDK call → backend handler → DB storage → UI display).

**Frontend:** Svelte 5 + TypeScript + Vite
**Backend:** Go single binary (chi + gqlgen)
**Database:** MySQL 8.0 via docker-compose

---

## Progress Tracker

> **Overall: 6 / 30 slices complete**

### Phase 1: Tier 0 — SDK Init/Log/Finish (6/7)
- [x] Slice 1: Project Scaffold + Docker Compose + Test Harness
- [x] Slice 2: Database Models + GORM Setup
- [x] Slice 3: Auth Middleware
- [x] Slice 4: GraphQL — Viewer + ServerInfo + ServerFeatures
- [x] Slice 5: GraphQL — UpsertBucket (Run Creation)
- [x] Slice 6: File Stream Handler — Metrics Ingestion
- [ ] Slice 7: UpsertBucket — Summary Update on Finish

### Phase 2: Frontend MVP (0/8)
- [ ] Slice 8: Frontend Scaffold (Svelte 5)
- [ ] Slice 9: Runs Table (Read-Only)
- [ ] Slice 10: Run Detail — Overview Tab
- [ ] Slice 11: Run Detail — Charts Tab
- [ ] Slice 12: Run Detail — Logs Tab
- [ ] Slice 13: Workspace — Runs Sidebar + Multi-Run Charts
- [ ] Slice 14: Workspace — System Metrics Section
- [ ] Slice 15: Run Filtering, Sorting, Grouping

### Phase 3: File Upload + Run Lifecycle (0/3)
- [ ] Slice 16: MinIO + File Upload
- [ ] Slice 17: Run Resume
- [ ] Slice 18: Run Stop from UI

### Phase 4: Artifacts (0/5)
- [ ] Slice 19: Artifact Schema + Tables
- [ ] Slice 20: CreateArtifact + CreateArtifactManifest + CommitArtifact
- [ ] Slice 21: Artifact Queries + Download
- [ ] Slice 22: Artifacts UI
- [ ] Slice 23: Artifact Aliases + Tags + Updates

### Phase 5: Reports (0/3)
- [ ] Slice 24: Reports List + Editor Shell
- [ ] Slice 25: Panel Grid Block in Reports
- [ ] Slice 26: Report Viewer + Comments

### Phase 6: Alerts + Registry (0/2)
- [ ] Slice 27: Alerts
- [ ] Slice 28: Registry (Model Registry)

### Phase 7: Auth + Teams (0/2)
- [ ] Slice 29: OIDC / SSO
- [ ] Slice 30: Teams + Org Management

---

## Test Strategy

Every slice includes Go integration tests that run against real MySQL. Two tiers:

### Tier 1: Go Integration Tests (`go test ./...`)
- **Harness** (`internal/testutil/harness.go`): boots the full server stack in-process
  using `httptest.Server` + **in-memory SQLite** via GORM. Zero external dependencies.
- **No Docker, no MySQL needed for tests.** Each test gets a fresh `:memory:` SQLite DB
  with `AutoMigrate` (~1ms). Truly isolated, truly parallel.
- **Same GORM models** used in production (MySQL) and tests (SQLite). The ORM abstracts
  dialect differences. Production uses `gorm.io/driver/mysql`, tests use `gorm.io/driver/sqlite`.
- **Each test** seeds specific state, makes HTTP calls (GraphQL or file_stream), then
  asserts on both HTTP responses and raw DB state via GORM queries.
- **Target:** full Phase 1 suite runs in <2 seconds.

### Tier 2: SDK Smoke Tests (manual + CI)
- Real `wandb` Python SDK scripts run against the dev server.
- These are too slow for rapid iteration (~10s+ per script due to SDK startup).
- Used as acceptance gates at the end of each slice, not per-edit.

### Tier 3: UI Tests (future, Phase 2+)
- Browser-based tests (Playwright or similar) against the Svelte frontend.
- Added when the frontend exists.

---

## Phase 1: Tier 0 — SDK Init/Log/Finish

Goal: `wandb.init()`, `wandb.log()`, `wandb.finish()` work against our server.

---

### Slice 1: Project Scaffold + Docker Compose + Test Harness

**Goal:** `docker compose up` boots MySQL and a Go server returning "hello" on `:8080`.
`go test ./...` boots an isolated test server + DB and runs integration tests in <2s.

**Steps:**
1. `go mod init github.com/wandb-clone/server`
2. Create `cmd/server/main.go` — chi router, healthcheck on `GET /healthz`
3. Create `docker-compose.yml` — MySQL 8.0 (dev), MySQL 8.0 test DB (same instance, different schema)
4. Create `internal/config/config.go` — env var parsing (DATABASE_URL, PORT)
5. Create `internal/server/server.go` — HTTP server setup, graceful shutdown
6. Create `internal/testutil/harness.go` — integration test harness (see below)

**Test harness design (`internal/testutil/harness.go`):**
```go
// Harness spins up the full server stack in-process against an in-memory
// SQLite database via GORM. Each test gets a completely fresh DB — no
// cleanup needed, no Docker needed.
//
// Usage in any _test.go:
//
//   func TestSomething(t *testing.T) {
//       h := testutil.NewHarness(t)
//       defer h.Close()
//
//       // h.BaseURL  = "http://127.0.0.1:<random-port>"
//       // h.APIKey   = "test-api-key-000"
//       // h.DB       = *gorm.DB (direct access for assertions)
//
//       resp := h.GraphQL(`query { viewer { entity } }`)
//       // assert on resp...
//
//       resp = h.PostFileStream("entity/project/run123", body)
//       // assert on resp...
//   }
```

Key properties:
- **In-process:** No docker needed for tests. The Go test binary starts an `httptest.Server`
  wired to the real chi router + gqlgen handler + store layer.
- **In-memory SQLite:** Each `NewHarness(t)` gets its own `:memory:` SQLite DB via GORM.
  `AutoMigrate` creates all tables in ~1ms. Completely isolated, no shared state.
- **Same GORM models:** Production uses `gorm.io/driver/mysql`, tests use
  `gorm.io/driver/sqlite`. The store layer only talks to `*gorm.DB`, never raw SQL.
- **Parallel-safe:** Each harness has its own DB + `httptest.Server` on a random port.
  All tests can use `t.Parallel()`.
- **Helper methods:**
  - `h.GraphQL(query, variables...)` — POST to `/graphql` with auth, return parsed JSON
  - `h.PostFileStream(path, body)` — POST to `/files/.../file_stream` with auth
  - `h.SeedUser(name, apiKey)` — insert user + entity + api_key via GORM
  - `h.SeedRun(project, runName, config)` — insert project + run via GORM
  - `h.DB` — `*gorm.DB` for direct assertions (e.g., `h.DB.First(&run, "name = ?", "r1")`)

**Verification:**
```bash
docker compose up -d   # start MySQL
go test ./...          # all tests pass, <2s
curl http://localhost:8080/healthz  # → 200 OK (dev server)
```

**Blast radius:** New project, nothing existing.

---

### Slice 2: Database Models + GORM Setup

**Goal:** MySQL has the core tables needed for Tier 0. Tests use in-memory SQLite.

**Steps:**
1. Create `internal/store/db.go` — GORM connection factory:
   - `NewMySQLDB(dsn)` for production
   - `NewSQLiteDB()` for tests (`:memory:`)
   - `AutoMigrate` all models on startup
2. Create `internal/store/models.go` — GORM model structs:
   - `User`, `Entity`, `APIKey`
   - `Project`, `Run`
   - `RunHistory`, `RunEvent`, `RunLog`
3. Create `internal/store/seed.go` — seed a default admin user + API key for dev
4. Create `internal/testutil/harness.go` — test harness:
   - `NewHarness(t)` → SQLite DB + AutoMigrate + seed + httptest.Server
   - Helper methods: `GraphQL()`, `PostFileStream()`, `SeedRun()`, etc.

**Verification:**
```bash
docker compose up -d
mysql -h 127.0.0.1 -u wandb -p wandb -e "SHOW TABLES;"
# → users, entities, api_keys, projects, runs, run_history, run_events, run_logs
```

**Tests:** `internal/store/migrate_test.go`
```go
func TestMigrations(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    // If we get here, migrations ran successfully.
    // Verify core tables exist:
    tables := h.QueryDB("SHOW TABLES")
    assert.Contains(t, tables, "runs")
    assert.Contains(t, tables, "run_history")
}

func TestSeedCreatesDefaultUser(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    var count int
    h.DB.Model(&User{}).Count(&count)
    assert.Equal(t, 1, count)
}
```

**Blast radius:** Adds store package. No HTTP changes yet.

---

### Slice 3: Auth Middleware

**Goal:** `Authorization: Basic base64("api:test-key")` is validated on every request.

**Steps:**
1. Create `internal/server/auth.go`:
   - Parse `Authorization: Basic ...` header
   - Decode base64, split on `:`, extract key
   - Query `api_keys` table (hash comparison)
   - Inject user into request context
2. Create `internal/store/user.go`:
   - `GetUserByAPIKey(ctx, key) → User`
   - `GetEntityByUserID(ctx, userID) → Entity`
3. Wire auth middleware into chi router (skip for `/healthz`)

**Tests:** `internal/server/auth_test.go`
```go
func TestAuthRejectsNoCredentials(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    resp, _ := http.Post(h.BaseURL+"/graphql", "application/json", nil)
    assert.Equal(t, 401, resp.StatusCode)
}

func TestAuthRejectsBadKey(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    req, _ := http.NewRequest("POST", h.BaseURL+"/graphql", nil)
    req.SetBasicAuth("api", "wrong-key")
    resp, _ := http.DefaultClient.Do(req)
    assert.Equal(t, 401, resp.StatusCode)
}

func TestAuthAcceptsValidKey(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    req, _ := http.NewRequest("POST", h.BaseURL+"/graphql", strings.NewReader(`{}`))
    req.SetBasicAuth("api", h.APIKey)
    resp, _ := http.DefaultClient.Do(req)
    assert.NotEqual(t, 401, resp.StatusCode) // 400 is ok (no gql handler yet)
}

func TestHealthzSkipsAuth(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    resp, _ := http.Get(h.BaseURL + "/healthz")
    assert.Equal(t, 200, resp.StatusCode)
}
```

**Blast radius:** Adds middleware. All routes now require auth except healthz.

---

### Slice 4: GraphQL — Viewer + ServerInfo + ServerFeatures

**Goal:** `wandb login --host http://localhost:8080` succeeds.

**Steps:**
1. Install gqlgen: `go get github.com/99designs/gqlgen`
2. Create `internal/graphql/schema.graphql` — start with just:
   - `Query.viewer` → `User` type (`id, entity, flags, teams`)
   - `Query.serverInfo` → `ServerInfo` type
   - Custom scalars: `JSONString`, `JSON`, `Int64`, `DateTime`, `Duration`
3. Run `gqlgen generate`
4. Implement `resolver.go`:
   - `Viewer()` → return user from auth context
   - `ServerInfo()` → return static minimal response
   - `ServerInfo.features` → return empty `[]`
5. Wire gqlgen handler into chi at `POST /graphql`

**GraphQL operations this handles:**
```graphql
query Viewer { viewer { id entity flags teams { edges { node { name } } } } }
query ServerInfo { serverInfo { cliVersionInfo latestLocalVersionInfo { ... } } }
query ServerFeaturesQuery { serverInfo { features { name isEnabled } } }
```

**Tests:** `internal/graphql/viewer_test.go`
```go
func TestViewerReturnsEntity(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    resp := h.GraphQL(`query { viewer { id entity } }`)
    assert.Equal(t, "testuser", resp.Path("data.viewer.entity").String())
    assert.NotEmpty(t, resp.Path("data.viewer.id").String())
}

func TestViewerReturnsTeams(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    resp := h.GraphQL(`query { viewer { teams { edges { node { name } } } } }`)
    // Empty is fine — just shouldn't error
    assert.Nil(t, resp.Path("errors").Data())
}

func TestServerInfoReturnsMinimal(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    resp := h.GraphQL(`query { serverInfo { cliVersionInfo } }`)
    assert.Nil(t, resp.Path("errors").Data())
    assert.NotNil(t, resp.Path("data.serverInfo").Data())
}

func TestServerFeaturesReturnsEmptyArray(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    resp := h.GraphQL(`query { serverInfo { features { name isEnabled } } }`)
    features := resp.Path("data.serverInfo.features").Data()
    assert.NotNil(t, features)
}

func TestCombinedViewerServerInfo(t *testing.T) {
    // The SDK sends viewer + serverInfo in one request during init
    h := testutil.NewHarness(t)
    defer h.Close()
    resp := h.GraphQL(`query {
        viewer { id entity flags teams { edges { node { name } } } }
        serverInfo { cliVersionInfo latestLocalVersionInfo {
            outOfDate latestVersionString versionOnThisInstanceString
        } }
    }`)
    assert.Nil(t, resp.Path("errors").Data())
    assert.NotEmpty(t, resp.Path("data.viewer.entity").String())
}
```

**Also verify manually:**
```bash
export WANDB_BASE_URL=http://localhost:8080
export WANDB_API_KEY=test-key
wandb login
# Should print: "Successfully logged in to wandb"
```

**Blast radius:** Adds graphql package. Core of the server.

---

### Slice 5: GraphQL — UpsertBucket (Run Creation)

**Goal:** `wandb.init(project="test")` creates a run in the database.

**Steps:**
1. Extend `schema.graphql`:
   - `Mutation.upsertBucket(input: UpsertBucketInput!)` → `UpsertBucketPayload`
   - `UpsertBucketInput` with all fields (id, name, modelName, entityName, config, etc.)
   - `UpsertBucketPayload` → `bucket: Run, inserted: Boolean`
   - `Run` type (id, name, displayName, sweepName, historyLineCount, project, ...)
   - `Project` type (id, name, entity)
   - Note: `modelName` input field maps to project name
2. Create `internal/store/project.go`:
   - `GetOrCreateProject(ctx, entityName, projectName) → Project`
3. Create `internal/store/run.go`:
   - `UpsertRun(ctx, input) → Run, inserted`
   - Handle create (new name) vs update (existing name)
   - Store config as JSONString in `runs.config`
4. Implement `UpsertBucket` resolver:
   - Auto-create entity + project if not found
   - Create or update the run record
   - Return the required response shape
5. Also add legacy query aliases:
   - `Query.model(name, entityName)` → same as `project`
   - `Query.models(entityName, first, after)` → same as projects list

**Tests:** `internal/graphql/run_test.go`
```go
func TestUpsertBucketCreatesRun(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    resp := h.GraphQL(`mutation {
        upsertBucket(input: {
            name: "test-run-1"
            modelName: "test-project"
            entityName: "testuser"
            config: "{\"lr\": 0.001}"
        }) {
            bucket { id name displayName project { id name entity { id name } } historyLineCount }
            inserted
        }
    }`)
    assert.Nil(t, resp.Path("errors").Data())
    assert.Equal(t, true, resp.Path("data.upsertBucket.inserted").Data())
    assert.Equal(t, "test-run-1", resp.Path("data.upsertBucket.bucket.name").String())
    assert.Equal(t, "test-project", resp.Path("data.upsertBucket.bucket.project.name").String())
    assert.Equal(t, "testuser", resp.Path("data.upsertBucket.bucket.project.entity.name").String())
}

func TestUpsertBucketAutoCreatesProject(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.GraphQL(`mutation {
        upsertBucket(input: {
            name: "r1" modelName: "new-project" entityName: "testuser"
        }) { bucket { id } inserted }
    }`)
    var count int64
    h.DB.Model(&Project{}).Where("name = ?", "new-project").Count(&count)
    assert.Equal(t, int64(1), count)
}

func TestUpsertBucketUpdatesExistingRun(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    // Create
    h.GraphQL(`mutation {
        upsertBucket(input: {
            name: "r1" modelName: "p1" entityName: "testuser" config: "{\"a\":1}"
        }) { bucket { id } inserted }
    }`)
    // Update
    resp := h.GraphQL(`mutation {
        upsertBucket(input: {
            name: "r1" modelName: "p1" entityName: "testuser"
            summaryMetrics: "{\"loss\":0.5}"
        }) { bucket { id } inserted }
    }`)
    assert.Equal(t, false, resp.Path("data.upsertBucket.inserted").Data())
    var run Run
    h.DB.First(&run, "name = ?", "r1")
    assert.Contains(t, run.SummaryMetrics, "loss")
}

func TestUpsertBucketStoresConfig(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.GraphQL(`mutation {
        upsertBucket(input: {
            name: "r1" modelName: "p1" entityName: "testuser"
            config: "{\"lr\": 0.001, \"epochs\": 10}"
        }) { bucket { id } inserted }
    }`)
    var run Run
    h.DB.First(&run, "name = ?", "r1")
    assert.Contains(t, run.Config, "0.001")
}

func TestModelQueryIsAliasForProject(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("myproject", "r1", `{"x":1}`)
    resp := h.GraphQL(`query {
        model(name: "myproject", entityName: "testuser") {
            id name
            bucket(name: "r1", missingOk: true) { id name config }
        }
    }`)
    assert.Nil(t, resp.Path("errors").Data())
    assert.Equal(t, "r1", resp.Path("data.model.bucket.name").String())
}
```

**Also verify manually with the SDK:**
```python
import wandb
run = wandb.init(project="test-project", config={"lr": 0.001, "epochs": 10})
print(run.id)      # Should print a run ID
run.finish()       # Will fail on file_stream — that's ok for now
```

**Blast radius:** Extends GraphQL schema. `run.finish()` will log errors (file_stream not implemented) but init succeeds.

---

### Slice 6: File Stream Handler — Metrics Ingestion

**Goal:** `wandb.log({"loss": 0.5})` stores metrics. `wandb.finish()` completes cleanly.

**Steps:**
1. Create `internal/filestream/types.go`:
   ```go
   type Request struct {
       Files      map[string]OffsetContent `json:"files,omitempty"`
       Uploaded   []string                 `json:"uploaded,omitempty"`
       Preempting *bool                    `json:"preempting,omitempty"`
       Complete   *bool                    `json:"complete,omitempty"`
       ExitCode   *int32                   `json:"exitcode,omitempty"`
   }
   type OffsetContent struct {
       Offset  int      `json:"offset"`
       Content []string `json:"content"`
   }
   ```
2. Create `internal/filestream/handler.go`:
   - `POST /files/{entity}/{project}/{run}/file_stream`
   - Parse URL params, resolve run from DB
   - Route file keys:
     - `wandb-history.jsonl` → parse each JSON line, extract `_step`, insert into `run_history`
     - `wandb-summary.json` → update `runs.summary_metrics` (replace)
     - `wandb-events.jsonl` → insert into `run_events`
     - `output.log` → insert into `run_logs`
   - Handle heartbeat: empty body or body without `complete` → update `runs.heartbeat_at`
   - Handle completion: `complete: true` → set `runs.state` based on `exitcode` (0=finished, else=crashed)
   - Handle `uploaded` field: note which files are uploaded (store in run_files if present)
3. Create `internal/store/run.go` additions:
   - `InsertHistory(ctx, runID, step, data) error`
   - `UpdateSummary(ctx, runID, summaryJSON) error`
   - `InsertEvents(ctx, runID, data) error`
   - `InsertLogs(ctx, runID, lines []string, offset int) error`
   - `CompleteRun(ctx, runID, exitCode) error`
   - `UpdateHeartbeat(ctx, runID) error`
4. Wire handler into chi router with auth middleware
5. Response: return `{}` or `{"limits": {}}` on success

**Tests:** `internal/filestream/handler_test.go`
```go
func TestFileStreamIngestsHistory(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("proj", "run1", `{}`)
    h.PostFileStream("testuser/proj/run1", `{
        "files": {
            "wandb-history.jsonl": {
                "offset": 0,
                "content": [
                    "{\"loss\": 0.5, \"_step\": 0}",
                    "{\"loss\": 0.3, \"_step\": 1}"
                ]
            }
        }
    }`)
    var run Run
    h.DB.First(&run, "name = ?", "run1")
    var count int64
    h.DB.Model(&RunHistory{}).Where("run_id = ?", run.ID).Count(&count)
    assert.Equal(t, int64(2), count)
}

func TestFileStreamUpdatesSummary(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("proj", "run1", `{}`)
    h.PostFileStream("testuser/proj/run1", `{
        "files": {
            "wandb-summary.json": {
                "offset": 0,
                "content": ["{\"loss\": 0.1, \"best\": true}"]
            }
        }
    }`)
    var run Run
    h.DB.First(&run, "name = ?", "run1")
    assert.Contains(t, run.SummaryMetrics, "0.1")
}

func TestFileStreamIngestsLogs(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("proj", "run1", `{}`)
    h.PostFileStream("testuser/proj/run1", `{
        "files": {
            "output.log": {
                "offset": 0,
                "content": ["Epoch 1 started\n", "Epoch 1 done\n"]
            }
        }
    }`)
    var run Run
    h.DB.First(&run, "name = ?", "run1")
    var count int64
    h.DB.Model(&RunLog{}).Where("run_id = ?", run.ID).Count(&count)
    assert.Equal(t, int64(2), count)
}

func TestFileStreamIngestsSystemEvents(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("proj", "run1", `{}`)
    h.PostFileStream("testuser/proj/run1", `{
        "files": {
            "wandb-events.jsonl": {
                "offset": 0,
                "content": ["{\"cpu\": 45.2, \"gpu.0.gpu\": 98.1}"]
            }
        }
    }`)
    var run Run
    h.DB.First(&run, "name = ?", "run1")
    var count int64
    h.DB.Model(&RunEvent{}).Where("run_id = ?", run.ID).Count(&count)
    assert.Equal(t, int64(1), count)
}

func TestFileStreamHeartbeatUpdatesTimestamp(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("proj", "run1", `{}`)
    resp := h.PostFileStream("testuser/proj/run1", `{}`)
    assert.Equal(t, 200, resp.StatusCode)
    var run Run
    h.DB.First(&run, "name = ?", "run1")
    assert.NotNil(t, run.HeartbeatAt)
}

func TestFileStreamCompletionSetsFinished(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("proj", "run1", `{}`)
    h.PostFileStream("testuser/proj/run1", `{"complete": true, "exitcode": 0}`)
    var run Run
    h.DB.First(&run, "name = ?", "run1")
    assert.Equal(t, "finished", run.State)
}

func TestFileStreamNonZeroExitSetsCrashed(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("proj", "run1", `{}`)
    h.PostFileStream("testuser/proj/run1", `{"complete": true, "exitcode": 1}`)
    var run Run
    h.DB.First(&run, "name = ?", "run1")
    assert.Equal(t, "crashed", run.State)
}

func TestFileStreamRequiresAuth(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    resp, _ := http.Post(h.BaseURL+"/files/testuser/proj/run1/file_stream",
        "application/json", strings.NewReader(`{}`))
    assert.Equal(t, 401, resp.StatusCode)
}

func TestFileStreamMultipleFilesInOneRequest(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("proj", "run1", `{}`)
    h.PostFileStream("testuser/proj/run1", `{
        "files": {
            "wandb-history.jsonl": {"offset": 0, "content": ["{\"loss\": 0.5, \"_step\": 0}"]},
            "wandb-summary.json": {"offset": 0, "content": ["{\"loss\": 0.5}"]},
            "output.log": {"offset": 0, "content": ["hello\n"]}
        }
    }`)
    var run Run
    h.DB.First(&run, "name = ?", "run1")
    var histCount, logCount int64
    h.DB.Model(&RunHistory{}).Where("run_id = ?", run.ID).Count(&histCount)
    h.DB.Model(&RunLog{}).Where("run_id = ?", run.ID).Count(&logCount)
    assert.Equal(t, int64(1), histCount)
    assert.Equal(t, int64(1), logCount)
}
```

**Also verify end-to-end with the SDK:**
```python
import wandb
run = wandb.init(project="test-project", config={"lr": 0.001})
for i in range(10):
    wandb.log({"loss": 1.0 / (i + 1), "accuracy": i * 0.1})
run.finish()
# Should complete without errors!
```

**Blast radius:** Adds REST endpoint. This completes Tier 0 — SDK is fully functional for basic logging.

---

### Slice 7: UpsertBucket — Summary Update on Finish

**Goal:** The final `UpsertBucket` call during `wandb.finish()` properly updates summary metrics.

**Steps:**
1. Handle the case where `UpsertBucket` is called with `summaryMetrics` on an existing run
2. Merge or replace `runs.summary_metrics` column
3. Return the updated run in the response

**Tests:** `internal/graphql/run_summary_test.go`
```go
func TestUpsertBucketUpdatesSummaryOnExistingRun(t *testing.T) {
    h := testutil.NewHarness(t)
    defer h.Close()
    h.SeedRun("proj", "run1", `{"x":1}`)
    // Simulate the finish-time UpsertBucket that sends summaryMetrics
    resp := h.GraphQL(`mutation {
        upsertBucket(input: {
            name: "run1" modelName: "proj" entityName: "testuser"
            summaryMetrics: "{\"loss\": 0.05, \"best_metric\": 42}"
        }) { bucket { id } inserted }
    }`)
    assert.Equal(t, false, resp.Path("data.upsertBucket.inserted").Data())
    var run Run
    h.DB.First(&run, "name = ?", "run1")
    assert.Contains(t, run.SummaryMetrics, "best_metric")
    assert.Contains(t, run.SummaryMetrics, "42")
}

func TestFullInitLogFinishFlow(t *testing.T) {
    // End-to-end test simulating the SDK's full call sequence
    h := testutil.NewHarness(t)
    defer h.Close()

    // 1. Viewer (auth check)
    resp := h.GraphQL(`query { viewer { id entity } }`)
    assert.Equal(t, "testuser", resp.Path("data.viewer.entity").String())

    // 2. ServerInfo
    resp = h.GraphQL(`query { serverInfo { features { name isEnabled } } }`)
    assert.Nil(t, resp.Path("errors").Data())

    // 3. UpsertBucket (create run)
    resp = h.GraphQL(`mutation {
        upsertBucket(input: {
            name: "e2e-run" modelName: "e2e-project" entityName: "testuser"
            config: "{\"lr\": 0.01}"
        }) { bucket { id name project { name } } inserted }
    }`)
    assert.Equal(t, true, resp.Path("data.upsertBucket.inserted").Data())

    // 4. File stream (log metrics)
    for i := 0; i < 5; i++ {
        h.PostFileStream("testuser/e2e-project/e2e-run",
            fmt.Sprintf(`{"files":{"wandb-history.jsonl":{"offset":%d,"content":["{\"loss\":%f,\"_step\":%d}"]}}}`,
                i, 1.0/float64(i+1), i))
    }

    // 5. File stream (complete)
    h.PostFileStream("testuser/e2e-project/e2e-run", `{"complete":true,"exitcode":0}`)

    // 6. UpsertBucket (update summary)
    h.GraphQL(`mutation {
        upsertBucket(input: {
            name: "e2e-run" modelName: "e2e-project" entityName: "testuser"
            summaryMetrics: "{\"loss\": 0.2}"
        }) { bucket { id } inserted }
    }`)

    // Assert final state
    var run Run
    h.DB.First(&run, "name = ?", "e2e-run")
    var histCount int64
    h.DB.Model(&RunHistory{}).Where("run_id = ?", run.ID).Count(&histCount)
    assert.Equal(t, "finished", run.State)
    assert.Contains(t, run.SummaryMetrics, "loss")
    assert.Equal(t, int64(5), histCount)
}
```

**Blast radius:** Small change to existing UpsertBucket resolver.

---

## Phase 2: Minimal UI — See What You Logged

Goal: Visit a browser and see your runs and their metrics.

---

### Slice 8: Frontend Scaffold (Svelte 5)

**Goal:** `http://localhost:5173` renders a shell with sidebar navigation.

**Steps:**
1. `cd frontend && npm create svelte@latest . -- --template skeleton`
2. Add dependencies: `@urql/svelte` (GraphQL client), `chart.js` or `layercake`
3. Create layout:
   - `+layout.svelte` — top nav bar + left sidebar (icon nav)
   - Sidebar links: Project, Workspace, Runs (only)
4. Create placeholder route pages:
   - `/` → redirect to `/{entity}/{project}/workspace`
   - `/{entity}/{project}/workspace` → "Workspace (coming soon)"
   - `/{entity}/{project}/runs` → "Runs (coming soon)"
5. Configure Vite proxy to forward `/graphql` and `/files` to Go server `:8080`

**Verification:**
- `npm run dev` → opens browser at `localhost:5173`
- See shell layout with sidebar
- No data yet — just the chrome

**Blast radius:** New `frontend/` directory. No backend changes.

---

### Slice 9: Runs Table (Read-Only)

**Goal:** Runs page shows a table of all runs with their state and config.

**Steps:**
1. Backend — extend GraphQL schema:
   - `Query.project(name, entityName)` → add `runs` connection with pagination
   - `Run` type: add `createdAt`, `state`, `user` fields
   - `RunConnection` with `edges/node/pageInfo/totalCount`
2. Backend — implement `internal/store/run.go`:
   - `ListRuns(ctx, projectID, filters, limit, offset) → []Run, total`
3. Frontend — `/{entity}/{project}/runs/+page.svelte`:
   - GraphQL query: fetch project runs
   - Render `<table>` with columns: Name, State, Created, Runtime, Config (lr, epochs)
   - Pagination (simple prev/next)
   - Click run name → navigate to run detail (Slice 10)

**Verification:**
- Run the wandb script from Slice 6 a few times with different configs
- Navigate to `http://localhost:5173/{entity}/test-project/runs`
- See table with runs, states, configs

**Blast radius:** Extends GraphQL schema with run listing. First data on screen.

---

### Slice 10: Run Detail — Overview Tab

**Goal:** Click a run, see its metadata and config.

**Steps:**
1. Backend — extend GraphQL:
   - `Project.run(name)` → return full `Run` with `config`, `summaryMetrics`, `createdAt`, `state`, `notes`, `tags`, `host`
   - Add `Run.runInfo` resolver (program, os, python, git, etc.)
2. Frontend — `/{entity}/{project}/runs/{runId}/+page.svelte`:
   - Tabs: Overview | Charts (stub) | Logs (stub)
   - Overview tab: key-value table of run metadata
     - State badge (colored: running/finished/crashed/failed)
     - Config display (parsed from JSONString)
     - Summary metrics display
     - System info (host, OS, python version, git)
     - Tags list
     - Notes (editable later)

**Verification:**
- Click a run from Slice 9's table
- See Overview with config `{"lr": 0.001}`, state "finished", summary metrics

**Blast radius:** Adds run detail page. Extends schema slightly.

---

### Slice 11: Run Detail — Charts Tab

**Goal:** Click Charts tab, see line charts of logged metrics.

**Steps:**
1. Backend — add GraphQL queries:
   - `Run.history(minStep, maxStep, samples)` → return array of JSONString (one per step)
   - `Run.sampledHistory(specs)` → downsampled history
   - `Run.historyKeys` → JSON listing all logged metric keys
   - Implement `internal/store/run.go`:
     - `GetHistory(ctx, runID, minStep, maxStep, limit) → []HistoryRow`
     - `GetHistoryKeys(ctx, runID) → []string`
2. Frontend — Charts tab:
   - Fetch `historyKeys` to discover metric names (loss, accuracy, etc.)
   - Fetch `history` data for each metric
   - Render line charts (one per metric key) using Chart.js / LayerCake
   - X-axis = step, Y-axis = metric value

**Verification:**
```python
import wandb, math
run = wandb.init(project="test")
for i in range(100):
    wandb.log({"loss": 1/(i+1), "accuracy": 1 - 1/(i+1), "lr": 0.001 * (0.99**i)})
run.finish()
```
- Navigate to run → Charts tab
- See 3 line charts: loss (decreasing), accuracy (increasing), lr (decaying)

**Blast radius:** Adds history queries. First charts on screen.

---

### Slice 12: Run Detail — Logs Tab

**Goal:** See console output for a run.

**Steps:**
1. Backend — add query for run logs:
   - Return paginated `run_logs` rows with line numbers and content
2. Frontend — Logs tab:
   - Terminal-style dark background text area
   - Line numbers on left
   - Search input
   - Auto-scroll to bottom

**Verification:**
```python
import wandb
run = wandb.init(project="test")
for i in range(10):
    print(f"Epoch {i}: loss={1/(i+1):.4f}")
    wandb.log({"loss": 1/(i+1)})
run.finish()
```
- Navigate to run → Logs tab
- See the print statements

**Blast radius:** Small addition to both backend and frontend.

---

## Phase 3: Workspace View — Compare Runs

Goal: Multi-run comparison with overlaid charts and a runs sidebar.

---

### Slice 13: Workspace — Runs Sidebar + Multi-Run Charts

**Steps:**
1. Backend — query for multiple runs' history in one request
2. Frontend — `/{entity}/{project}/workspace/+page.svelte`:
   - Left sidebar: list of runs with visibility toggles (eye icon) and color dots
   - Main area: line charts with all visible runs overlaid (color-coded by run)
   - Run count badge (e.g., "Runs 5")
   - Click run name → navigate to run detail

**Verification:**
- Run wandb 3-5 times with different hyperparams
- Workspace page shows all runs overlaid on loss/accuracy charts
- Toggle run visibility → line appears/disappears

---

### Slice 14: Workspace — System Metrics Section

**Steps:**
1. Backend — query for `run_events` (system metrics like CPU, GPU)
2. Frontend — "System" chart section below main charts
   - GPU utilization, memory, CPU, etc.
   - Collapsible section

---

### Slice 15: Run Filtering, Sorting, Grouping

**Steps:**
1. Backend — extend runs query with `filters: JSONString`, `order: String`
2. Frontend:
   - Filter button → dropdown to filter by state, tags, config values
   - Sort button → sort by name, created, runtime, any metric
   - Search bar with regex support
   - Column picker

---

## Phase 4: Run Files + Config Diff

Goal: Upload files and compare run configs.

---

### Slice 16: MinIO + File Upload

**Steps:**
1. Add MinIO to docker-compose
2. Backend — implement `createRunFiles` mutation:
   - Generate pre-signed upload URLs via MinIO S3 API
   - Return upload URLs + headers
3. Backend — implement file download endpoints
4. Frontend — Files tab in run detail

---

### Slice 17: Run Resume

**Steps:**
1. Backend — implement `RunResumeStatus` query:
   - Return `historyTail`, `eventsTail`, `summaryMetrics`, `historyLineCount`, etc.
   - Handle `wandbConfig(keys: ["t"])` for config resume
2. Backend — handle `missingOk: true` on bucket/run queries

**Verification:**
```python
run = wandb.init(project="test", id="my-run", resume="allow")
wandb.log({"x": 1})
run.finish()
# Resume:
run = wandb.init(project="test", id="my-run", resume="allow")
wandb.log({"x": 2})  # should continue from step 1
run.finish()
```

---

### Slice 18: Run Stop from UI

**Steps:**
1. Backend — implement `RunStoppedStatus` query (return `run.stopped` field)
2. Backend — mutation or REST endpoint to set `stopped = true`
3. Frontend — "Stop" button on running runs

---

## Phase 5: Artifacts

Goal: `wandb.log_artifact()` and `wandb.use_artifact()` work.

---

### Slice 19: Artifact Schema + Tables

**Steps:**
1. Migration `002_artifacts.sql`:
   - `artifact_types`, `artifact_collections`, `artifacts`
   - `artifact_aliases`, `artifact_manifests`, `artifact_manifest_entries`
   - `artifact_files_stored`, `artifact_usage`
2. Extend GraphQL schema with all artifact types (from `graphql-schema.graphql`)

---

### Slice 20: CreateArtifact + CreateArtifactManifest + CommitArtifact

**Steps:**
1. Implement `createArtifact` mutation — register artifact with clientID dedup
2. Implement `createArtifactManifest` — reserve manifest, optionally return upload URL
3. Implement `createArtifactFiles` — generate pre-signed URLs for artifact files
4. Implement `completeMultipartUploadArtifact` — finalize multipart uploads
5. Implement `updateArtifactManifest` — update manifest digest, return upload URL
6. Implement `commitArtifact` — set artifact state to COMMITTED
7. Implement `useArtifact` — record lineage (input/output)
8. Implement `clientIDMapping` query — resolve clientID → serverID

**Verification:**
```python
import wandb
run = wandb.init(project="test")
artifact = wandb.Artifact("my-dataset", type="dataset")
artifact.add_file("data.csv")
run.log_artifact(artifact)
run.finish()
```

---

### Slice 21: Artifact Queries + Download

**Steps:**
1. Implement `artifactByID`, `artifactByName` queries
2. Implement `fetchArtifactManifest` — return manifest download URL
3. Implement `getArtifactFiles`, `getArtifactFileUrls`, `artifactFileURLsByManifestEntries`
4. Implement artifact download handlers: `GET /artifacts/...`, `GET /artifactsV2/...`
5. Implement `runInputArtifacts`, `runOutputArtifacts`

**Verification:**
```python
import wandb
run = wandb.init(project="test")
artifact = run.use_artifact("my-dataset:latest")
path = artifact.download()
# Should download the artifact files
run.finish()
```

---

### Slice 22: Artifacts UI

**Steps:**
1. Frontend — Artifacts page (project-level):
   - Tree sidebar showing artifact types + collections + versions
   - Detail panel: Version tab (metadata), Files tab, Lineage tab
2. Frontend — Run detail → Artifacts tab:
   - List output artifacts with type, name, consumer count
3. Frontend — Lineage DAG visualization:
   - Run nodes → Artifact nodes with directed edges

---

### Slice 23: Artifact Aliases + Tags + Updates

**Steps:**
1. Implement `addAliases`, `deleteAliases`
2. Implement `updateArtifact` (metadata, description, TTL)
3. Implement `createArtifactCollectionTagAssignments`, `deleteArtifactCollectionTagAssignments`
4. Implement `deleteArtifact`, `deleteArtifactSequence`

---

## Phase 6: Reports

Goal: Create reports with embedded charts.

---

### Slice 24: Reports List + Editor Shell

**Steps:**
1. Frontend — `/reportlist` page: list reports, "Create report" button
2. Backend — reports table in DB (title, description, content JSON, author, draft/published)
3. Frontend — report editor:
   - Editable title + description
   - Slash command menu (panel grid, headings, lists, code, image, etc.)
   - Publish workflow

---

### Slice 25: Panel Grid Block in Reports

**Steps:**
1. Frontend — Panel grid block that embeds workspace-style charts
   - Re-use chart components from Slice 11/13
   - Run selector within the panel grid
   - Panel configuration (metric selection, smoothing, etc.)

---

### Slice 26: Report Viewer + Comments

**Steps:**
1. Frontend — read-only report rendering
2. Backend — comments API (create, list, delete)
3. Frontend — comment thread at bottom of report

---

## Phase 7: Collaboration + Advanced

---

### Slice 27: Alerts

**Steps:**
1. Implement `notifyScriptableRunAlert` mutation
2. Store alerts in DB, display in UI notification bell

### Slice 28: Registry (Model Registry)

**Steps:**
1. Implement `linkArtifact`, `unlinkArtifact`
2. Implement registry queries: `fetchRegistries`, `fetchRegistry`, `registryCollections`, `registryVersions`
3. Implement registry mutations: `upsertModel` (registry), `deleteModel`, `renameProject`
4. Implement registry members: `createProjectMembers`, `deleteProjectMembers`, role updates
5. Frontend — registry UI

### Slice 29: OIDC / SSO

**Steps:**
1. Implement `POST /oidc/token` endpoint (JWT bearer exchange)
2. Implement Bearer token auth middleware alongside Basic auth
3. Frontend — SSO login flow

### Slice 30: Teams + Org Management

**Steps:**
1. Implement team CRUD mutations
2. Implement invite system
3. Frontend — team settings pages


---

## Development Workflow (for each slice)

```
1. Write Go integration tests first (they will fail — red)
2. Implement backend (schema + resolver + store)
3. Run `gqlgen generate` if schema changed
4. Run `go test ./...` until green (<5s)
5. Run SDK smoke test (manual: `python test_script.py`)
6. Add the UI component (if applicable)
7. Verify in the browser
8. Commit
```

**Test strategy:** Go integration tests are the primary feedback loop (fast, automated).
SDK scripts are acceptance gates (slower, manual). The SDK is the source of truth for
what the server must do — no mocking the SDK, no mocking MySQL.

---

## Slice Dependency Graph

```
Slice 1 (scaffold)
  → Slice 2 (DB)
    → Slice 3 (auth)
      → Slice 4 (viewer/serverinfo)
        → Slice 5 (upsertBucket)
          → Slice 6 (file_stream)          ← Tier 0 MVP complete
            → Slice 7 (summary update)
              → Slice 8 (frontend scaffold)
                → Slice 9 (runs table)
                  → Slice 10 (run detail)
                    → Slice 11 (charts)     ← First charts
                    → Slice 12 (logs)
                  → Slice 13 (workspace)    ← Multi-run compare
                    → Slice 14 (system metrics)
                    → Slice 15 (filter/sort)
              → Slice 16 (file upload)
                → Slice 17 (resume)
                → Slice 18 (stop)
              → Slice 19 (artifact schema)
                → Slice 20 (artifact create)
                  → Slice 21 (artifact query)
                    → Slice 22 (artifact UI)
                    → Slice 23 (aliases/tags)
                      → Slice 28 (registry)
              → Slice 24 (reports editor)
                → Slice 25 (panel grids)
                  → Slice 26 (viewer/comments)
```

## Summary Table

| Phase | Slices | What You Get | GraphQL Surface |
|-------|--------|-------------|-----------------|
| 1 | 1-7 | SDK init/log/finish works | Viewer, ServerInfo, ServerFeatures, UpsertBucket |
| 2 | 8-12 | See runs + charts + logs in browser | Project, Run, History, Logs queries |
| 3 | 13-15 | Multi-run workspace comparison | Multi-run history queries, filters |
| 4 | 16-18 | File upload, resume, stop | CreateRunFiles, RunResumeStatus, RunStoppedStatus |
| 5 | 19-23 | Full artifact lifecycle | 15+ artifact mutations/queries |
| 6 | 24-26 | Reports with embedded charts | Reports CRUD (custom, not from SDK) |
| 7 | 27-30 | Registry, OIDC, teams | Registry + team mutations |
