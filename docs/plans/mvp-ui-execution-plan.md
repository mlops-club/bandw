# MVP UI Plan: Projects & Runs with Metric Charts — Execution Plan

## Context

This plan restructures the original `docs/plans/mvp-ui-projects-runs.md` into an execution plan with:
- **Concrete verification gates** after each slice (automated tests + manual smoke checks)
- **Parallelization** opportunities identified and grouped into waves

The original plan has 7 slices. The dependency graph allows 3 waves of parallel work.

---

## Parallelization Strategy

```
WAVE 1 (parallel):
  ├── Track A: Slice 1 → Slice 2    (backend: store → GraphQL resolvers)
  └── Track B: Slice 3              (frontend scaffold + projects list + Go static serving)

WAVE 2 (parallel, after Wave 1 completes):
  ├── Slice 4  (runs table — needs Slice 3 frontend + existing backend)
  └── Slice 5  (run detail + charts — needs Slice 2 resolvers + Slice 3 frontend)

WAVE 3 (sequential, after Wave 2):
  ├── Slice 6  (workspace multi-run — needs Slice 5 charts)
  └── Slice 7  (polish — needs everything)
```

---

## Wave 1, Track A: Backend

### Slice 1: Store layer for history queries

**Files to modify:**
- `internal/store/run.go` — add `GetHistory`, `GetSampledHistory`, `GetHistoryKeys`
- `internal/store/run_test.go` — new test file

**Implementation:** See original plan for function signatures and SQL strategy.

**Verification gate:**
```bash
# Automated — must pass before moving to Slice 2
CGO_ENABLED=1 go test ./internal/store/ -v -run "TestGetHistory|TestGetSampledHistory|TestGetHistoryKeys"
```

Tests to write:
1. `TestGetHistory_ReturnsRowsInStepRange` — seed 100 rows, query range [10,50], verify step ordering and count
2. `TestGetHistory_LimitActsAsPagination` — seed 100 rows, limit=10, verify only 10 returned
3. `TestGetHistory_EmptyRange` — query range with no data, verify empty result
4. `TestGetSampledHistory_DownsamplesCorrectly` — seed 100 rows, request 10 samples, verify ~10 rows returned including first and last
5. `TestGetSampledHistory_KeyFiltering` — seed rows with multiple keys, request subset, verify only requested keys in output
6. `TestGetSampledHistory_NoDownsampleWhenUnderLimit` — seed 5 rows, request 100 samples, verify all 5 returned
7. `TestGetHistoryKeys_ReturnsAllKeys` — seed rows with varying keys, verify union of all keys returned
8. `TestGetHistoryKeys_PreviousValueIsLastRow` — seed rows, verify `previousValue` matches the value from the highest-step row
9. `TestGetHistoryKeys_LastStepCorrect` — verify `lastStep` matches max step number

---

### Slice 2: GraphQL resolvers for history

**Depends on:** Slice 1 (store functions)

**Files to modify:**
- `internal/graphql/schema.go` — add `scalar Int64`, add 3 fields to `Run` type
- `internal/graphql/scalars.go` — add `Int64Scalar` type
- `internal/graphql/run_resolver.go` — add `History`, `SampledHistory`, `HistoryKeys` methods
- `internal/graphql/run_history_test.go` — new integration test file
- `internal/testutil/harness.go` — add `GraphQLWithVars` and `SeedHistoryViaFileStream`

**Implementation:** See original plan for resolver signatures, Int64Scalar, and schema additions.

**Verification gate:**
```bash
# Automated — must pass before Slice 5
CGO_ENABLED=1 go test ./internal/graphql/ -v -run "TestHistory|TestSampledHistory|TestHistoryKeys"

# Also re-run all existing tests to catch regressions (schema changes can break MustParseSchema)
CGO_ENABLED=1 go test ./...
```

Tests to write:
1. `TestHistoryKeys_ViaGraphQL` — seed run with history via `SeedHistoryViaFileStream`, query `historyKeys`, verify JSON shape matches `{"lastStep": N, "keys": {"loss": {"previousValue": ...}}}`
2. `TestHistory_ViaGraphQL` — query `history(minStep, maxStep, samples)` with variables, verify returned JSON strings are parseable and contain correct steps
3. `TestSampledHistory_ViaGraphQL` — query `sampledHistory(specs)`, verify response is array of arrays matching SDK expected shape
4. `TestHistory_NullableArgs` — query with omitted minStep/maxStep, verify defaults work
5. `TestInt64Scalar_HandlesFloat64` — verify Int64 scalar correctly unmarshals float64 (the JSON number type)
6. `TestServerStarts_WithNewSchema` — verify `MustParseSchema` doesn't panic (implicitly tested by all other tests, but good to have explicit)

**Smoke check (manual):**
```bash
# Start server, seed a run via wandb SDK, query via curl
just run &
uv run python -c "
import wandb
run = wandb.init(project='test', entity='admin')
for i in range(50): wandb.log({'loss': 1/(i+1)})
run.finish()
"
curl -u api:1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5 \
  -X POST http://localhost:8080/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ project(name:\"test\", entityName:\"admin\") { run(name:\"<RUN_ID>\") { historyKeys } } }"}'
# Expect: {"data":{"project":{"run":{"historyKeys":{"lastStep":49,"keys":{"loss":{"previousValue":...}}}}}}}
```

---

## Wave 1, Track B: Frontend

### Slice 3: Frontend scaffold + projects list + Go static serving

**No backend dependencies** (projects list backend additions are part of this slice).

**Files to create/modify:**
- **Backend:** `internal/graphql/schema.go`, `internal/store/project.go`, `internal/graphql/resolver.go`, `internal/graphql/project_resolver.go`
- **Frontend:** entire `frontend/` directory (SvelteKit + URQL + route skeletons)
- **Go embed:** `internal/server/server.go` — static file serving

**Verification gate:**
```bash
# 1. Backend tests — projects list resolver
CGO_ENABLED=1 go test ./internal/graphql/ -v -run "TestProjects"
CGO_ENABLED=1 go test ./internal/store/ -v -run "TestListProjects"

# 2. Frontend builds without errors
cd frontend && npm install && npm run build && npm run check

# 3. Go embed compiles (requires frontend/build/ to exist)
go build ./cmd/server/

# 4. Full regression
CGO_ENABLED=1 go test ./...
```

Tests to write (backend):
1. `TestListProjects_ReturnsSeededProjects` — seed 3 projects, query via GraphQL, verify all returned
2. `TestListProjects_IncludesRunCount` — seed project with runs, verify `runCount` field
3. `TestProjectConnection_RelayShape` — verify `edges { node { ... } }` response shape

**Smoke check (manual):**
```bash
# Terminal 1: Start Go server
just run

# Terminal 2: Start Vite dev server
cd frontend && npm run dev

# Browser checks:
# 1. http://localhost:5173/admin/projects → see nav shell + projects table
# 2. Seed a project via wandb SDK, refresh → project appears in table
# 3. Click project → navigates to workspace route (placeholder OK)
# 4. Refresh on deep route (e.g. /admin/test/workspace) → SPA loads correctly (not 404)
# 5. Check browser console for GraphQL errors → none
```

---

## Wave 2 (after Wave 1 completes)

### Slice 4: Runs table page

**Depends on:** Slice 3 (frontend scaffold, nav, URQL client)

**Files to create:**
- `frontend/src/lib/graphql/queries.ts` — add `RUNS_QUERY`
- `frontend/src/routes/[entity]/[project]/table/+page.svelte`
- `frontend/src/lib/components/RunsTable.svelte`
- `frontend/src/lib/components/StateBadge.svelte`
- `frontend/src/lib/utils/time.ts`

**No backend changes** — uses existing `Project.runs` connection.

**Verification gate:**
```bash
# Frontend type-checks
cd frontend && npm run check

# Full Go regression (embed still works)
go build ./cmd/server/
```

**Smoke check (manual):**
```bash
# Seed multiple runs with different states
uv run python -c "
import wandb
for i in range(5):
    run = wandb.init(project='test', entity='admin')
    wandb.log({'loss': 0.5 - i*0.1})
    run.finish()
"

# Browser checks:
# 1. Navigate to /admin/test/table → see 5 runs in table
# 2. Verify columns: run name, state (finished), duration, summary metrics
# 3. Verify relative timestamps display correctly
# 4. Click a run row → navigates to /admin/test/runs/<runId>
# 5. Verify state badges show correct colors (finished=green)
```

---

### Slice 5: Run detail — Overview + Charts

**Depends on:** Slice 2 (history resolvers) + Slice 3 (frontend scaffold)

**Files to create:**
- `frontend/src/lib/graphql/queries.ts` — add `RUN_DETAIL_QUERY`, `HISTORY_KEYS_QUERY`, `SAMPLED_HISTORY_QUERY`
- `frontend/src/routes/[entity]/[project]/runs/[runId]/+page.svelte`
- `frontend/src/lib/components/LineChart.svelte`
- `frontend/src/lib/components/MetricChartGrid.svelte`
- `frontend/src/lib/utils/colors.ts`

**Verification gate:**
```bash
# Frontend type-checks
cd frontend && npm run check

# Go build still works
go build ./cmd/server/
```

**Smoke check (manual):**
```bash
# Seed a run with multiple metrics
uv run python -c "
import wandb
run = wandb.init(project='test', entity='admin')
for i in range(100):
    wandb.log({'loss': 1/(i+1), 'accuracy': 1-1/(i+1), 'lr': 0.001*(0.99**i)})
run.finish()
"

# Browser checks:
# 1. Navigate to /admin/test/runs/<runId> → see Overview tab with run metadata
# 2. Click Charts tab → see 3 line charts (loss, accuracy, lr)
# 3. Charts show correct data trends (loss decreasing, accuracy increasing, lr decaying)
# 4. Charts have labeled axes (step on X, metric value on Y)
# 5. Verify historyKeys query fires (Network tab) → response has correct shape
# 6. Verify sampledHistory queries fire → one per metric key
# 7. Empty run (no history) → shows "No metrics logged" or similar empty state
```

---

## Wave 3 (after Wave 2 completes)

### Slice 6: Workspace — multi-run chart comparison

**Depends on:** Slice 5 (LineChart component, chart infrastructure)

**Files to create:**
- `frontend/src/routes/[entity]/[project]/workspace/+page.svelte`
- `frontend/src/lib/components/RunsSidebar.svelte`
- `frontend/src/lib/components/WorkspaceChartGrid.svelte`
- `frontend/src/lib/components/LineChart.svelte` — extend to multi-series
- `frontend/src/lib/stores/workspace.ts`

**Verification gate:**
```bash
cd frontend && npm run check
go build ./cmd/server/
```

**Smoke check (manual):**
```bash
# Seed 5 runs with overlapping metrics
uv run python -c "
import wandb, random
for r in range(5):
    run = wandb.init(project='compare', entity='admin')
    base = random.uniform(0.5, 1.5)
    for i in range(100):
        wandb.log({'loss': base/(i+1), 'accuracy': 1 - base/(i+1)})
    run.finish()
"

# Browser checks:
# 1. Navigate to /admin/compare/workspace → see sidebar with 5 runs + chart grid
# 2. Each chart shows 5 overlaid lines with distinct colors
# 3. Toggle a run's eye icon → its line disappears from all charts
# 4. Toggle it back → line reappears
# 5. Run color dots in sidebar match line colors in charts
# 6. With >10 runs, only first 10 visible by default
# 7. Search/filter in sidebar works
```

---

### Slice 7: Project overview + navigation polish

**Depends on:** All previous slices

**Files to create/modify:**
- `frontend/src/routes/[entity]/[project]/overview/+page.svelte`
- `frontend/src/lib/components/Breadcrumb.svelte`
- Polish across existing components: loading spinners, empty states, error boundaries

**Verification gate:**
```bash
cd frontend && npm run check
go build ./cmd/server/

# Full regression
CGO_ENABLED=1 go test ./...
```

**Smoke check (manual — full flow):**
```bash
# Browser checks — complete navigation flow:
# 1. / → redirects to /admin/projects
# 2. Projects page → shows project list with run counts and last activity
# 3. Click project → /admin/test/overview → shows project overview
# 4. Breadcrumbs show: admin > test > overview
# 5. Sidebar highlights "Overview" link
# 6. Navigate to Table → breadcrumbs update, sidebar highlights "Table"
# 7. Navigate to Workspace → breadcrumbs update
# 8. Click run → run detail page, breadcrumbs show full path
# 9. Back button works correctly through all pages
# 10. Empty project (no runs) → shows meaningful empty state
# 11. Loading states visible during data fetch (throttle network in DevTools)
# 12. GraphQL error (stop server) → error boundary shows message, not blank page
```

---

## Execution Summary

| Wave | Slices | Parallel? | Estimated Tests | Key Risk |
|------|--------|-----------|-----------------|----------|
| 1A | 1 → 2 | Yes (with 1B) | 15 Go tests | Int64 scalar, MustParseSchema panics |
| 1B | 3 | Yes (with 1A) | 3 Go tests + frontend build | SvelteKit SPA config, go:embed `all:` prefix |
| 2 | 4, 5 | Yes (with each other) | Frontend type-checks | sampledHistory response shape, Chart.js integration |
| 3 | 6 → 7 | Sequential | Frontend type-checks | Multi-series chart performance, SPA routing edge cases |

**Total verification gates:** 7 automated (go test + npm check + go build) + 7 manual smoke checks

**Rule:** Never start a slice until all verification gates of its dependencies pass. If a gate fails, fix before proceeding.
