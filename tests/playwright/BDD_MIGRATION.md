# BDD Migration Plan — playwright-bdd

Migrate all 202 Playwright `.spec.ts` tests to Gherkin `.feature` files + shared TypeScript step definitions using [`playwright-bdd`](https://github.com/vitalets/playwright-bdd).

## Approach

For each **test group** (folder with a shared `setup.py`):

1. **Baseline original** — run the existing `.spec.ts` tests, record pass/fail
2. **Write BDD** — create `.feature` file(s) + `steps/*.steps.ts` for the group
3. **Verify BDD** — run the new BDD tests, confirm parity with original
4. **Remove original** — delete the `.spec.ts` files once BDD versions pass

A group is **done** when all four columns show checkmarks.

## Infrastructure (do first)

- [ ] Install `playwright-bdd` (`npm add -D playwright-bdd`)
- [ ] Update `playwright.config.ts` with `defineBddConfig()` pointing at `tests/**/*.feature` and `tests/**/steps/*.steps.ts`
- [ ] Create `steps/common.steps.ts` with shared Given/When/Then steps (navigate, config section, etc.)
- [ ] Verify a single feature file (track/config) works end-to-end before proceeding

## Progress Key

| Symbol | Meaning |
|--------|---------|
| `-`    | Not started |
| `run`  | Tests executed, recording results |
| `pass` | All tests pass |
| `fail` | One or more tests fail (see notes) |
| `skip` | Intentionally skipped (see notes) |
| `n/a`  | Not applicable |

---

## Phase B: P0 Tests (16 specs)

### B1. track/config/ (5 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | config-at-init | pass | pass | |
| 2 | config-from-argparse | pass | pass | |
| 3 | config-from-file | pass | pass | |
| 4 | config-updated-after-finish | pass | pass | |
| 5 | config-updated-mid-run | pass | pass | |

**Shared steps to extract**: navigate to run overview, assert config key/value visible.

### B2. track/logging/ (8 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | api-call-data-surfaces | pass | pass | |
| 2 | automatically-logged-data | pass | pass | |
| 3 | custom-x-axis | pass | pass | |
| 4 | define-metric-glob | pass | pass | |
| 5 | logging-best-practices-surface | pass | pass | |
| 6 | metric-naming | pass | pass | |
| 7 | metrics-in-workspace | pass | pass | |
| 8 | multiple-metrics | pass | pass | |

**Shared steps to extract**: navigate to workspace, assert chart/metric panel visible.

### B3. track/summary/ (3 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | custom-aggregation | pass | pass | |
| 2 | summary-in-overview | pass | pass | |
| 3 | summary-in-table | pass | pass | |

**Shared steps to extract**: assert summary key/value in overview, assert summary column in runs table.

---

## Phase B (cont.): P0 Tests (39 more specs)

### B4. runs/view/ (10 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | artifacts-tab | - | ready | |
| 2 | charts-tab | - | ready | |
| 3 | files-tab | - | ready | |
| 4 | logs-tab | - | ready | |
| 5 | overview-artifacts | - | ready | |
| 6 | overview-config | - | ready | |
| 7 | overview-editable | - | ready | |
| 8 | overview-metadata | - | ready | |
| 9 | overview-summary | - | ready | |
| 10 | tab-navigation | - | ready | |

**Shared steps to extract**: navigate to run detail, switch tab, assert tab panel content.

### B5. track/project-page/ (13 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | artifacts-tab | pass | pass | |
| 2 | overview | pass | pass | |
| 3 | project-lifecycle | pass | pass | Fixed: "I open the project page" step now waits for any heading |
| 4 | project-notes | pass | pass | |
| 5 | reports-tab | pass | pass | |
| 6 | runs-table-bulk-ops | pass | pass | |
| 7 | runs-table-columns | pass | pass | |
| 8 | runs-table-filter | pass | pass | |
| 9 | runs-table-group | pass | pass | |
| 10 | runs-table-search | pass | pass | |
| 11 | runs-table-sort | pass | pass | |
| 12 | runs-table-visibility-sync | pass | pass | |
| 13 | workspace-tab | pass | pass | |

**Shared steps to extract**: navigate to project page, runs table assertions, column/sort/filter operations.

### B6. app/panels/line-plot/ (21 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | add-multi-metric | - | pass | |
| 2 | add-single-metric | - | pass | |
| 3 | change-colors-legend | - | pass | |
| 4 | change-colors-table | - | pass | |
| 5 | compare-metrics-one-chart | - | pass | |
| 6 | custom-x-axis | - | pass | |
| 7 | data-settings | - | pass | |
| 8 | edit-individual | - | pass | |
| 9 | edit-section | - | pass | |
| 10 | edit-workspace | - | pass | |
| 11 | expressions | - | pass | |
| 12 | grouping-settings | - | pass | |
| 13 | hide-legend | - | pass | |
| 14 | legend-settings | - | pass | |
| 15 | point-aggregation | - | pass | |
| 16 | regex-groups | - | pass | |
| 17 | smoothing-methods | - | pass | |
| 18 | switch-x-axis | - | pass | |
| 19 | visualize-averaged | - | pass | |
| 20 | visualize-nan | - | pass | |
| 21 | zoom | - | pass | |

**Shared steps to extract**: navigate to workspace, open panel settings, assert chart rendering, axis/legend/color operations.

---

## Phase C: P1 Tests (71 specs)

### C1a. track/workspaces/ (7 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | saved-views-crud | fail | fail | Pre-existing: orig 3/4 fail, BDD 3/4 fail (saved views not implemented in bandw) |
| 2 | workspace-default-settings | pass | pass | |
| 3 | workspace-filter-group-sort | pass | pass | |
| 4 | workspace-panel-sections | pass | pass | |
| 5 | workspace-runs-sidebar | pass | pass | |
| 6 | workspace-types | pass | pass | |
| 7 | workspace-undo-redo | pass | pass | |

### C1b. app/panels/overview/ (9 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | add-panel-manually | pass | pass | |
| 2 | manage-panels-crud | pass | pass | |
| 3 | manage-sections | pass | pass | |
| 4 | panel-full-screen | pass | pass | |
| 5 | quick-add-panels | fail | fail | Pre-existing: orig "individual add on hover" fails, BDD same |
| 6 | share-panel-embed-options | fail | fail | Pre-existing: orig 2/3 fail, BDD 2/3 fail (share/embed not implemented) |
| 7 | share-panel-url | pass | pass | |
| 8 | workspace-layout-config | pass | pass | |
| 9 | workspace-modes | pass | pass | |

### C1c. app/cascade-settings/ (6 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | panel-level-settings | pass | pass | |
| 2 | section-level-settings | pass | pass | |
| 3 | settings-cascade-hierarchy | pass | pass | |
| 4 | workspace-layout-options | pass | pass | |
| 5 | workspace-level-settings | pass | pass | |
| 6 | workspace-line-plot-defaults | pass | pass | |

### C2a. app/panels/bar-plot/ (3 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | bar-plot-grouped-by-config | - | pass | |
| 2 | create-bar-plot | - | pass | |
| 3 | customize-bar-to-box-plot | - | pass | |

### C2b. app/panels/scatter-plot/ (2 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | create-scatter-plot | - | pass | |
| 2 | scatter-plot-example | - | pass | |

### C2c. app/panels/parallel-coordinates/ (3 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | create-parallel-coords | - | `pass` | |
| 2 | parallel-coords-filter | - | `pass` | |
| 3 | parallel-coords-settings | - | `pass` | |

### C2d. track/plots/ (15 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | define-metric-custom-x | - | `pass` | |
| 2 | define-metric-glob | - | `pass` | |
| 3 | matplotlib-plotly-logging | - | `pass` | |
| 4 | point-aggregation-modes | - | `pass` | |
| 5 | smoothing-methods | - | `pass` | |
| 6 | wandb-plot-bar | - | `pass` | |
| 7 | wandb-plot-confusion-matrix | - | `pass` | |
| 8 | wandb-plot-histogram | - | `pass` | |
| 9 | wandb-plot-line | - | `pass` | |
| 10 | wandb-plot-multiline | - | `pass` | |
| 11 | wandb-plot-pr-curve | - | `pass` | |
| 12 | wandb-plot-roc-curve | - | `pass` | |
| 13 | wandb-plot-scatter | - | `pass` | |

### C3a. app/panels/run-comparer/ (5 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | add-run-comparer | - | `pass` | |
| 2 | run-comparer-diff-only | - | `pass` | |
| 3 | run-comparer-dynamic-update | - | `pass` | |
| 4 | run-comparer-formatting | - | `pass` | |
| 5 | run-comparer-search | - | `pass` | |

### C3b. runs/compare/ (9 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | baseline-comparison-tooltips | - | `pass` | |
| 2 | change-baseline-run | - | `pass` | |
| 3 | compare-runs-full-workflow | - | `pass` | |
| 4 | compare-runs-limitations | - | `pass` | |
| 5 | hide-metric-deltas | - | `pass` | |
| 6 | pin-runs | - | `pass` | |
| 7 | remove-baseline | - | `pass` | |
| 8 | set-baseline-run | - | `pass` | |
| 9 | summary-metric-deltas | - | `pass` | |

### C3c. runs/management/ (11 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | add-tags-project | - | pass | |
| 2 | add-tags-run | - | pass | |
| 3 | add-tags-sdk | - | pass | |
| 4 | delete-group | - | pass | |
| 5 | group-by-job-type | - | pass | |
| 6 | group-runs-sdk | - | pass | |
| 7 | group-runs-ui | - | pass | |
| 8 | move-between-groups | - | pass | |
| 9 | move-to-project | - | pass | |
| 10 | remove-tags | - | pass | |
| 11 | run-state-display | - | pass | |

### C3c (cont). runs/filter/ (6 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | default-filters | - | pass | |
| 2 | filter-by-metric | - | pass | |
| 3 | filter-by-state | - | pass | |
| 4 | filter-by-tags | - | pass | |
| 5 | filter-operators-by-type | - | pass | |
| 6 | remove-filter | - | pass | |

### C3d. runs/display/ (13 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | color-by-config-key | - | ready | |
| 2 | delete-runs | - | ready | |
| 3 | export-runs-csv | - | ready | |
| 4 | fork-run-display | - | ready | |
| 5 | key-based-run-coloring | - | ready | |
| 6 | manage-columns-add-remove | - | ready | |
| 7 | manage-columns-move-pin | - | ready | |
| 8 | resumed-run-display | - | ready | |
| 9 | rewind-run-display | - | ready | |
| 10 | search-runs-by-name | - | ready | |
| 11 | search-runs-regex-toggle | - | ready | |
| 12 | sort-by-column-with-aggregation | - | ready | |
| 13 | stop-run-from-ui | - | ready | |

---

## Phase D: P2 Tests (76 specs)

### D1a. app/panels/media/ (1 spec)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | media-panels | - | ready | |

### D1b. app/panels/code/ (1 spec)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | code-panels | - | ready | |

### D1b (cont). app/panels/query-panels/ (1 spec)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | query-panels | - | ready | |

### D1c. app/keyboard-shortcuts/ (1 spec)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | keyboard-shortcuts | - | ready | |

### D1d. app/panels/parameter-importance/ (2 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | create-param-importance | - | ready | |
| 2 | param-importance-interpretation | - | ready | |

### D2a. artifacts/core/ (1 spec)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | artifacts-core | - | ready | |

### D2b. artifacts/advanced/ (1 spec)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | artifacts-advanced | - | ready | |

### D3a. reports/core/ (1 spec)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | reports-core | - | ready | |

### D3b. reports/advanced/ (1 spec)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | reports-advanced | - | ready | |

### D4a. tables/core/ (6 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | log-and-view-table | - | ready | |
| 2 | table-compare-across-models | - | ready | |
| 3 | table-compare-across-time | - | ready | |
| 4 | table-merged-view | - | ready | |
| 5 | table-side-by-side-view | - | ready | |
| 6 | table-step-slider | - | ready | |

### D4b. tables/advanced/ (4 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | table-download | - | ready | |
| 2 | table-immutable-mode | - | ready | |
| 3 | table-incremental-mode | - | ready | |
| 4 | table-mutable-mode | - | ready | |

### D4c. app/custom-charts/ (8 specs)

| # | Spec file | Orig bandw | BDD bandw | Notes |
|---|-----------|-----------|----------|-------|
| 1 | custom-chart-bar | - | ready | |
| 2 | custom-chart-edit-in-ui | - | ready | |
| 3 | custom-chart-histogram | - | ready | |
| 4 | custom-chart-line | - | ready | |
| 5 | custom-chart-pr-curve | - | ready | |
| 6 | custom-chart-roc-curve | - | ready | |
| 7 | custom-chart-scatter | - | ready | |
| 8 | custom-chart-table-data | - | ready | |

---

## Shared Step Definitions

These files hold reusable steps shared across multiple feature areas. Create them during the infrastructure phase and grow them as patterns emerge.

| File | Steps | Used by |
|------|-------|---------|
| `steps/common.steps.ts` | Given a run named {string} exists, When I open the run overview page | All |
| `steps/config.steps.ts` | Then the config section should show {string} with value {string} | track/config, runs/view |
| `steps/summary.steps.ts` | Then the summary section should show {string} with value {string} | track/summary, runs/view |
| `steps/workspace.steps.ts` | When I open the project workspace, Then I should see a chart for {string} | track/logging, track/plots, app/panels/* |
| `steps/runs-table.steps.ts` | When I open the project page, Then the runs table should show {int} runs | track/project-page, runs/* |
| `steps/panels.steps.ts` | When I add a panel of type {string}, When I open panel settings | app/panels/* |
| `steps/artifacts.steps.ts` | When I open the artifacts tab, Then I should see artifact {string} | artifacts/* |
| `steps/reports.steps.ts` | When I create a new report, When I add a {string} block | reports/* |
| `steps/tables.steps.ts` | When I open the table viewer, Then the table should have {int} rows | tables/* |

---

## Scoreboard

| Phase | Group | Total | Orig bandw | BDD bandw |
|-------|-------|-------|-----------|----------|
| B1 | track/config | 0/5 | 0/5 | 0/5 |
| B2 | track/logging | 0/8 | 0/8 | 0/8 |
| B3 | track/summary | 0/3 | 0/3 | 0/3 |
| B4 | runs/view | 0/10 | 0/10 | 0/10 |
| B5 | track/project-page | 0/13 | 0/13 | 13/13 |
| B6 | app/panels/line-plot | 0/21 | 0/21 | 21/21 |
| C1a | track/workspaces | 0/7 | 0/7 | 6/7 |
| C1b | app/panels/overview | 0/9 | 0/9 | 7/9 |
| C1c | app/cascade-settings | 0/6 | 0/6 | 6/6 |
| C2a | app/panels/bar-plot | 0/3 | 3/3 | 3/3 |
| C2b | app/panels/scatter-plot | 0/2 | 0/2 | 0/2 |
| C2c | app/panels/parallel-coords | 0/3 | 3/3 | 3/3 |
| C2d | track/plots | 0/13 | 13/13 | 13/13 |
| C3a | app/panels/run-comparer | 0/5 | 5/5 | 5/5 |
| C3b | runs/compare | 0/9 | 0/9 | 0/9 |
| C3c | runs/management + filter | 0/17 | 17/17 | 17/17 |
| C3d | runs/display | 0/13 | 13/13 | 13/13 |
| D1a | app/panels/media | 0/1 | 1/1 | 1/1 |
| D1b | app/panels/code + query | 0/2 | 2/2 | 2/2 |
| D1c | app/keyboard-shortcuts | 0/1 | 1/1 | 1/1 |
| D1d | app/panels/param-importance | 0/2 | 2/2 | 2/2 |
| D2a | artifacts/core | 0/1 | 1/1 | 1/1 |
| D2b | artifacts/advanced | 0/1 | 1/1 | 1/1 |
| D3a | reports/core | 0/1 | 1/1 | 1/1 |
| D3b | reports/advanced | 0/1 | 1/1 | 1/1 |
| D4a | tables/core | 0/6 | 6/6 | 6/6 |
| D4b | tables/advanced | 0/4 | 4/4 | 4/4 |
| D4c | app/custom-charts | 0/8 | 8/8 | 8/8 |
| | **TOTAL** | **0/177** | **0/177** | **0/177** |

---

## Subagent Coordination

Multiple agents can work in parallel on independent groups. Rules:

1. **Claim before starting** — update the group's "Orig bandw" column to `run` before executing tests
2. **One agent per group** — groups sharing a `setup.py` must be handled by the same agent (e.g., runs/management and runs/filter share setup, so C3c is one unit)
3. **Infrastructure first** — no BDD work until the infrastructure checklist is complete
4. **Record failures** — if original tests fail, note the failure in the Notes column; don't block BDD conversion, but the BDD version should match (fail on the same tests, not new ones)
5. **Shared steps** — when writing a step that could be reused, check `steps/common.steps.ts` first; add it there if missing; avoid duplicating step patterns across groups

### Parallelism map (what can run concurrently)

```
Infrastructure ──────────────────────────────────────────────
  │
  ├── B1 (config)  ─┐
  ├── B2 (logging)  ├── can run in parallel
  ├── B3 (summary)  ─┘
  │
  ├── B4 (runs/view)         ─┐
  ├── B5 (project-page)       ├── parallel after B1-B3 shared steps exist
  │                            │
  ├── C1a (workspaces)        │
  ├── C1b (panels/overview)   ├── parallel (independent fixtures)
  ├── C1c (cascade-settings)  │
  ├── C2a-C2c (bar/scatter/   │
  │    parallel-coords)       ├── parallel
  ├── C2d (plots)             │
  ├── C3a (run-comparer)      │
  ├── C3b (runs/compare)      ├── parallel
  ├── C3c (management+filter) │
  ├── C3d (runs/display)      ─┘
  │
  ├── B6 (line-plot)          ── after workspace steps exist
  │
  ├── D1-D4 (all P2)         ── parallel, any order
  │
  done
```
