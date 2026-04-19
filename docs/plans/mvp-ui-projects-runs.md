# MVP UI Plan: Projects & Runs with Metric Charts

## Context

The bandw backend (Phase 1) is complete: the wandb SDK can init, log metrics, and finish runs. Data is stored in the database. But there's **no frontend** and **no way to query metric history via GraphQL**. This plan adds the minimum backend history resolvers (matching the exact W&B SDK protocol) and builds an MVP Svelte 5 UI for browsing projects, runs, and viewing metric charts.

**Scope:** Projects list, runs table, run detail (overview + charts), workspace (multi-run comparison). No artifacts, no code preview, no reports.

---

## Research Findings

### W&B SDK GraphQL Protocol for History

The wandb SDK (`wandb-sdk/wandb/apis/public/history.py` and `runs.py`) uses three GraphQL fields on the `Run` type to fetch metric history:

#### 1. `history(minStep, maxStep, samples)` → `[JSONString!]`

Paginated raw history. Used by `HistoryScan` class. `samples` is used as `pageSize` — this is pagination, NOT downsampling.

```graphql
query HistoryPage($entity: String!, $project: String!, $run: String!, $minStep: Int64!, $maxStep: Int64!, $pageSize: Int!) {
    project(name: $project, entityName: $entity) {
        run(name: $run) {
            history(minStep: $minStep, maxStep: $maxStep, samples: $pageSize)
        }
    }
}
```

Source: `wandb-sdk/wandb/apis/public/history.py:172-182`

#### 2. `sampledHistory(specs: [JSONString!]!)` → `[JSON]`

Downsampled history for specific keys. Each spec is JSON: `{"keys": ["_step", "loss"], "minStep": 0, "maxStep": 100, "samples": 500}`.

```graphql
query SampledHistoryPage($entity: String!, $project: String!, $run: String!, $spec: JSONString!) {
    project(name: $project, entityName: $entity) {
        run(name: $run) { sampledHistory(specs: [$spec]) }
    }
}
```

Response shape: outer array has one element per spec, each is an array of row objects. SDK reads `response["project"]["run"]["sampledHistory"][0]`.

Source: `wandb-sdk/wandb/apis/public/history.py:265-275`, `wandb-sdk/wandb/apis/public/runs.py:1091-1103`

#### 3. `historyKeys` → `JSON`

Discover all logged metric keys and their last values. **Included in `RUN_FRAGMENT`** (`runs.py:102`) — fetched on every Run object load.

```graphql
query RunHistoryKeys($project: String!, $entity: String!, $name: String!) {
    project(name: $project, entityName: $entity) {
        run(name: $name) { historyKeys }
    }
}
```

Response shape (from `wandb-sdk/wandb/sdk/verify/verify.py:178-181`):
```json
{
  "lastStep": 99,
  "keys": {
    "loss": {"previousValue": 0.01},
    "accuracy": {"previousValue": 0.99},
    "dict.val1": {"previousValue": 1.0}
  }
}
```

### Current Backend State

- **Implemented:** `POST /graphql` (Basic auth), `POST /files/{entity}/{project}/{run}/file_stream`, `GET /healthz`
- **GraphQL schema:** `Run` type has metadata fields but NO `history`/`sampledHistory`/`historyKeys`
- **Data storage:** `run_history` table stores `{id, run_id, step, data (JSON), created_at}` — data IS being ingested via file_stream
- **Missing queries:** No way to list projects (only `project(name, entityName)` singular lookup)
- **GraphQL library:** `graph-gophers/graphql-go` v1.9.0 — method-per-field resolvers, custom scalars via `ImplementsGraphQLType`
- **Test harness:** `testutil.NewHarness(t)` provides in-memory SQLite + httptest.Server. Has `GraphQL(query)` but NO variable support.

### Key Validated Assumptions

- `@urql/svelte` supports Svelte 5 (peer dep: `^3 || ^4 || ^5`)
- Nullable field args accept non-null variable values in graph-gophers (verified)
- SvelteKit `adapter-static` with `fallback: 'index.html'` produces SPA-compatible output

---

## Vertical Slices

### Slice 1: Backend — Store layer for history queries

**Goal:** Add `GetHistory`, `GetSampledHistory`, `GetHistoryKeys` to `internal/store/run.go`, with Go tests.

**Files:**
- `internal/store/run.go` — add 3 functions
- `internal/store/run_test.go` — new file, tests with in-memory SQLite

**Store functions:**

- **`GetHistory(db, runID, minStep, maxStep, limit)` → `[]RunHistory`**
  - SQL: `WHERE run_id=? AND step >= minStep AND step < maxStep ORDER BY step LIMIT limit`
  - This is **pagination, not downsampling** — returns the first `limit` rows in the range
  - Matches SDK's `HistoryScan` which uses `samples` as `pageSize`

- **`GetSampledHistory(db, runID, keys, minStep, maxStep, samples)` → `[]map[string]any`**
  - SQL narrows by `run_id` AND step range with `ORDER BY step`
  - Downsample in Go: if count > samples, select indices `[0, N, 2N, ..., last]` where `N = count/samples`, always including first and last row
  - Key filtering in Go (not SQL) to avoid SQLite/MySQL JSON function differences
  - Each result row contains only the requested `keys` (plus `_step`)

- **`GetHistoryKeys(db, runID)` → `(lastStep int64, keys map[string]map[string]any)`**
  - Scan all `run_history` rows for the run, parse each JSON `Data` field in Go
  - Collect union of all keys, track `previousValue` for each key (the value from the last history row)
  - Return `lastStep` (max step number) and keys map with `{"previousValue": lastValue}` per key
  - For MVP, full scan is acceptable. Can be optimized later by caching at ingest time in `filestream/handler.go`

**Test seeding:** Use `PostFileStream` pattern from `testutil.Harness` (not direct DB inserts) so `HistoryLineCount` and other counters stay consistent. Add `SeedHistoryViaFileStream(runName, rows)` thin wrapper.

**Harness enhancement:** Add `GraphQLWithVars(query string, vars map[string]any) *http.Response` — the SDK queries use `$variables` and the current helper only posts raw query strings.

**Verification:** `CGO_ENABLED=1 go test ./internal/store/ -v -run TestGet`

---

### Slice 2: Backend — GraphQL resolvers for history

**Goal:** Add `history`, `sampledHistory`, `historyKeys` fields to `Run` type. **Schema + resolvers must land together** — `graph-gophers/graphql-go` validates at startup via `MustParseSchema` and panics if any schema field lacks a resolver method.

**Schema additions** (`internal/graphql/schema.go`):
```graphql
scalar Int64

type Run {
    # ... existing fields ...
    history(minStep: Int64, maxStep: Int64, samples: Int): [JSONString!]
    sampledHistory(specs: [JSONString!]!): [JSON]
    historyKeys: JSON
}
```

`minStep`/`maxStep` are **nullable** in the schema (matching W&B reference schema), even though the SDK always provides them. In Go, nullable args use pointer types.

**Int64Scalar implementation** (`internal/graphql/scalars.go`):
```go
type Int64Scalar int64

func (Int64Scalar) ImplementsGraphQLType(name string) bool { return name == "Int64" }

func (s *Int64Scalar) UnmarshalGraphQL(input interface{}) error {
    // JSON numbers arrive as float64 in Go — MUST handle this case
    switch v := input.(type) {
    case float64: *s = Int64Scalar(int64(v))
    case int:     *s = Int64Scalar(int64(v))
    case int32:   *s = Int64Scalar(int64(v))
    case int64:   *s = Int64Scalar(v)
    case string:  n, err := strconv.ParseInt(v, 10, 64); if err != nil { return err }; *s = Int64Scalar(n)
    default:      return fmt.Errorf("Int64 must be a number, got %T", input)
    }
    return nil
}

func (s Int64Scalar) MarshalJSON() ([]byte, error) {
    return json.Marshal(int64(s))
}
```

**Resolver method signatures** (must use scalar wrapper types, not raw Go types):
```go
// history — nullable args use *Int64Scalar pointers, returns []JSONString (not []string!)
func (r *RunResolver) History(args struct {
    MinStep *Int64Scalar
    MaxStep *Int64Scalar
    Samples *int32
}) (*[]JSONString, error)

// sampledHistory — each JSONScalar.Value = []map[string]any (inner array of row objects)
func (r *RunResolver) SampledHistory(args struct {
    Specs []JSONString
}) (*[]*JSONScalar, error)

// historyKeys — no args, returns *JSONScalar with Value = map[string]any{...}
func (r *RunResolver) HistoryKeys() (*JSONScalar, error)
```

**Files:**
- `internal/graphql/schema.go` — add `scalar Int64`, add 3 fields to `Run` type
- `internal/graphql/scalars.go` — add `Int64Scalar` type
- `internal/graphql/run_resolver.go` — add `History`, `SampledHistory`, `HistoryKeys` methods
- `internal/graphql/run_history_test.go` — integration tests through full HTTP stack
- `internal/testutil/harness.go` — add `GraphQLWithVars` and `SeedHistoryViaFileStream`

**Verification:** `CGO_ENABLED=1 go test ./internal/graphql/ -v -run "TestHistory|TestSampledHistory|TestHistoryKeys"`

---

### Slice 3: Frontend scaffold + Projects list (combined)

**Goal:** Working SvelteKit app with nav shell, URQL client, route skeletons, Go static file serving, AND a functioning projects list page (verified end-to-end with real data).

**Stack:** SvelteKit (adapter-static, SPA mode) + TypeScript + URQL (@urql/svelte) + Chart.js

**Backend additions for projects list:**
- `internal/graphql/schema.go` — add `projects(entityName: String!): ProjectConnection!`, `ProjectConnection`, `ProjectEdge`, add `runCount`/`lastRunAt` to `Project`
- `internal/store/project.go` — add `ListProjects(db, entityID) ([]Project, error)`
- `internal/graphql/resolver.go` — add `Projects` root resolver
- `internal/graphql/project_resolver.go` — add `RunCount()`, `LastRunAt()` resolvers

**Frontend files:**
- `frontend/package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`
- `frontend/src/app.html`, `frontend/src/app.css`
- `frontend/src/lib/graphql/client.ts` — URQL client with Basic auth header
- `frontend/src/lib/graphql/queries.ts` — `PROJECTS_QUERY`
- `frontend/src/routes/+layout.svelte` — top nav + left sidebar + `<slot/>`
- `frontend/src/routes/+page.svelte` — redirect to `/admin/projects`
- `frontend/src/routes/[entity]/projects/+page.svelte` — projects table
- Route skeletons for remaining pages

**Go static file serving** (`internal/server/server.go`):
- Use `//go:embed all:frontend/build` — the `all:` prefix is **mandatory** because SvelteKit outputs JS/CSS under `_app/` and Go's `embed` silently skips `_`-prefixed paths without `all:`
- `frontend/build` directory must exist before `go build`. For dev mode, use a conditional: if embed FS is empty, skip static serving (dev uses Vite proxy)
- Route order in chi: `/healthz`, `/graphql`, `/files/...` registered FIRST, then static file handler as catch-all
- SPA fallback: custom handler serves files if they exist, else `index.html`. Must NOT return HTML for `/graphql` or `/files/` prefixes — those should return proper 404/401

**Auth strategy:**
- Static files served OUTSIDE auth middleware group (public)
- GraphQL requests include `Authorization: Basic ${btoa("api:<key>")}` header via URQL
- MVP: API key stored in `localStorage`, simple login form accepts API key string. Default to dev key.
- Auth middleware only wraps `/graphql` and `/files/` routes (already the case in `server.go:25`)

**URQL error handling:**
- GraphQL errors come as HTTP 200 with `errors` array in JSON body (`relay.Handler` behavior)
- Configure URQL with `errorPolicy: 'all'`
- Frontend components check `result.error` and display messages

**Vite proxy:**
```ts
server: { proxy: {
    '/graphql': 'http://localhost:8080',
    '/files': 'http://localhost:8080',
    '/healthz': 'http://localhost:8080',
} }
```

**Verification:**
- `cd frontend && npm install && npm run dev` + start Go server
- Navigate to `localhost:5173/admin/projects` → see nav shell + projects table
- Click project → navigates to workspace (placeholder)
- Refresh on deep route → SPA loads correctly

---

### Slice 4: Runs table page

**Goal:** `/{entity}/{project}/table` shows paginated run list. Uses existing `Project.runs` connection (no backend changes).

**Frontend files:**
- `frontend/src/lib/graphql/queries.ts` — `RUNS_QUERY`
- `frontend/src/routes/[entity]/[project]/table/+page.svelte`
- `frontend/src/lib/components/RunsTable.svelte` — reusable table
- `frontend/src/lib/components/StateBadge.svelte` — colored state badges
- `frontend/src/lib/utils/time.ts` — relative time formatting

**Verification:** Seed runs, navigate to table, see run names/states/times/summary metrics, click run → run detail.

---

### Slice 5: Run detail — Overview + Charts tabs

**Goal:** `/{entity}/{project}/runs/{runId}` shows run metadata and line charts. **First slice using history resolvers from Slice 2.**

**Frontend files:**
- `frontend/src/lib/graphql/queries.ts` — `RUN_DETAIL_QUERY`, `HISTORY_KEYS_QUERY`, `SAMPLED_HISTORY_QUERY`
- `frontend/src/routes/[entity]/[project]/runs/[runId]/+page.svelte` — tabs: Overview | Charts
- `frontend/src/lib/components/LineChart.svelte` — Chart.js line chart (single-series initially)
- `frontend/src/lib/components/MetricChartGrid.svelte` — grid of charts: fetch historyKeys → sampledHistory per key
- `frontend/src/lib/utils/colors.ts` — color palette

**Verification:**
```bash
uv run python -c "
import wandb
run = wandb.init(project='test')
for i in range(100):
    wandb.log({'loss': 1/(i+1), 'accuracy': 1-1/(i+1), 'lr': 0.001*(0.99**i)})
run.finish()
"
```
Navigate to run → Charts tab → see 3 line charts with data.

---

### Slice 6: Workspace — multi-run chart comparison

**Goal:** `/{entity}/{project}/workspace` — runs sidebar + multi-run overlaid charts.

**Frontend files:**
- `frontend/src/routes/[entity]/[project]/workspace/+page.svelte` — sidebar + chart grid layout
- `frontend/src/lib/components/RunsSidebar.svelte` — run list with eye toggles, color dots, search
- `frontend/src/lib/components/WorkspaceChartGrid.svelte` — multi-run chart grid
- `frontend/src/lib/components/LineChart.svelte` — extend to multi-series
- `frontend/src/lib/stores/workspace.ts` — Svelte 5 state: `visibleRunIds`, `runColors`

**Performance:** Cap visible runs at 10 by default (matching W&B's default). Chart.js handles 10 runs x 500 points well.

**Verification:** Create 3+ runs, navigate to workspace, see overlaid charts, toggle run visibility.

---

### Slice 7: Project overview + navigation polish

**Goal:** Project overview page, polished breadcrumbs, active sidebar states, loading/empty states.

**Frontend files:**
- `frontend/src/routes/[entity]/[project]/overview/+page.svelte`
- `frontend/src/lib/components/Breadcrumb.svelte`
- Polish: loading spinners, empty states, error boundaries

**Verification:** Full navigation flow. Breadcrumbs update. Sidebar highlights current page. Empty states display.

---

## Dependency Graph

```
Slice 1 (store layer) ──→ Slice 2 (GraphQL resolvers) ──→ Slice 5 (run charts) ──→ Slice 6 (workspace)
                                                              ↑
Slice 3 (scaffold + projects) ──→ Slice 4 (runs table) ──────┘
                                                              ↓
                                                          Slice 7 (polish)
```

Slices 1-2 and Slice 3 can proceed in parallel. Slice 5 depends on both Slice 2 and Slice 4.

---

## Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | SvelteKit + adapter-static (SPA) | File-based routing, static build served by Go |
| GraphQL client | URQL (@urql/svelte, supports Svelte 5) | Lighter than Apollo, `errorPolicy: 'all'` for GraphQL errors |
| Charting | Chart.js (svelte-chartjs) | Mature multi-series support, capped at 10 visible runs |
| History pagination | `history()` = page-based (LIMIT), not downsampled | Matches SDK's `HistoryScan` which uses `samples` as `pageSize` |
| History sampling | `sampledHistory()` = SQL narrows step range, uniform Nth-row in Go | Key filtering in Go for SQLite/MySQL portability |
| Static serving | `//go:embed all:frontend/build` | `all:` prefix for SvelteKit's `_app/` dir; single-binary deploy |
| SPA fallback | Custom handler: file if exists, else index.html | Guards API routes from returning HTML |
| Auth (MVP) | API key in localStorage + simple login form | Basic auth header sent via URQL |
| Int64 scalar | Custom scalar; `UnmarshalGraphQL` handles float64 | JSON numbers arrive as float64 in Go |
| Test seeding | `PostFileStream` wrapper (not direct DB inserts) | Keeps HistoryLineCount and counters consistent |

## Critical Implementation Notes

1. **Schema + resolvers must land together.** `MustParseSchema` panics on missing resolver methods.
2. **Int64 scalar must handle float64 input.** JSON numbers decode as `float64` in Go.
3. **Resolver return types must use scalar wrappers.** `[]JSONString` not `[]string`, `*JSONScalar` not `map[string]any`.
4. **`sampledHistory` response shape:** `[JSON]` where each `JSON` element is an array of row objects. Resolver returns `[]*JSONScalar`, each with `Value = []map[string]any`. SDK reads `sampledHistory[0]`.
5. **`historyKeys` response shape:** `{"lastStep": N, "keys": {"loss": {"previousValue": 0.01}, ...}}`. Each key entry MUST include `previousValue`. SDK verifies this in `verify.py:178`.
6. **`historyKeys` is in `RUN_FRAGMENT`** — fetched on every Run load. Must be lightweight.
7. **`//go:embed all:frontend/build`** — `all:` is mandatory for `_app/` paths.
8. **Build order:** `frontend/build/` must exist before `go build`.
9. **GraphQL errors are HTTP 200.** relay handler returns errors in JSON body.
10. **Static serving must NOT intercept API routes.** Register API routes before catch-all.
11. **No SQL JSON functions.** All JSON parsing in Go for SQLite/MySQL compatibility.

## Critical Backend Files to Modify

- `internal/store/run.go` — add `GetHistory`, `GetSampledHistory`, `GetHistoryKeys`
- `internal/graphql/schema.go` — add `scalar Int64`, history fields, `ProjectConnection`
- `internal/graphql/scalars.go` — add `Int64Scalar`
- `internal/graphql/run_resolver.go` — add `History`, `SampledHistory`, `HistoryKeys` resolvers
- `internal/graphql/project_resolver.go` — add projects list resolver
- `internal/store/project.go` — add `ListProjects`
- `internal/server/server.go` — add static file serving with `//go:embed all:frontend/build`
- `internal/testutil/harness.go` — add `GraphQLWithVars`, `SeedHistoryViaFileStream`
