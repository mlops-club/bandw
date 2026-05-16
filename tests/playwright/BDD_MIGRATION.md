# BDD Migration Plan — playwright-bdd

Migrate all 202 Playwright `.spec.ts` tests to Gherkin `.feature` files + shared TypeScript step definitions using [`playwright-bdd`](https://github.com/vitalets/playwright-bdd).

## Approach

For each **test group** (folder with a shared `setup.py`):

1. **Baseline original** — run the existing `.spec.ts` tests against both targets, record pass/fail
2. **Write BDD** — create `.feature` file(s) + `steps/*.steps.ts` for the group
3. **Verify BDD** — run the new BDD tests against both targets, confirm parity with original
4. **Remove original** — delete the `.spec.ts` files once BDD versions pass on both targets

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

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | config-at-init | - | pass | pass | pass | |
| 2 | config-from-argparse | - | pass | pass | pass | |
| 3 | config-from-file | - | pass | pass | pass | |
| 4 | config-updated-after-finish | - | pass | pass | pass | |
| 5 | config-updated-mid-run | - | pass | pass | pass | |

**Shared steps to extract**: navigate to run overview, assert config key/value visible.

### B2. track/logging/ (8 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | api-call-data-surfaces | - | pass | pass | pass | |
| 2 | automatically-logged-data | - | pass | pass | pass | |
| 3 | custom-x-axis | - | pass | pass | pass | |
| 4 | define-metric-glob | - | pass | pass | pass | |
| 5 | logging-best-practices-surface | - | pass | pass | pass | |
| 6 | metric-naming | - | pass | pass | pass | |
| 7 | metrics-in-workspace | - | pass | pass | pass | |
| 8 | multiple-metrics | - | pass | pass | pass | |

**Shared steps to extract**: navigate to workspace, assert chart/metric panel visible.

### B3. track/summary/ (3 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | custom-aggregation | - | pass | pass | pass | |
| 2 | summary-in-overview | - | pass | pass | pass | |
| 3 | summary-in-table | - | pass | pass | pass | |

**Shared steps to extract**: assert summary key/value in overview, assert summary column in runs table.

---

## Phase B (cont.): P0 Tests (39 more specs)

### B4. runs/view/ (10 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | artifacts-tab | - | - | pass | ready | |
| 2 | charts-tab | - | - | pass | ready | |
| 3 | files-tab | - | - | pass | ready | |
| 4 | logs-tab | - | - | pass | ready | |
| 5 | overview-artifacts | - | - | pass | ready | |
| 6 | overview-config | - | - | pass | ready | |
| 7 | overview-editable | - | - | pass | ready | |
| 8 | overview-metadata | - | - | pass | ready | |
| 9 | overview-summary | - | - | pass | ready | |
| 10 | tab-navigation | - | - | pass | ready | |

**Shared steps to extract**: navigate to run detail, switch tab, assert tab panel content.

### B5. track/project-page/ (13 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | artifacts-tab | - | pass | pass | pass | |
| 2 | overview | - | pass | pass | pass | |
| 3 | project-lifecycle | - | pass | pass | pass | Fixed: "I open the project page" waited for table; wandb.ai lands on Workspace tab |
| 4 | project-notes | - | pass | pass | pass | |
| 5 | reports-tab | - | pass | pass | pass | |
| 6 | runs-table-bulk-ops | - | pass | pass | pass | |
| 7 | runs-table-columns | - | pass | pass | pass | |
| 8 | runs-table-filter | - | pass | pass | pass | |
| 9 | runs-table-group | - | pass | pass | pass | |
| 10 | runs-table-search | - | pass | pass | pass | |
| 11 | runs-table-sort | - | pass | pass | pass | |
| 12 | runs-table-visibility-sync | - | pass | pass | pass | |
| 13 | workspace-tab | - | pass | pass | pass | |

**Shared steps to extract**: navigate to project page, runs table assertions, column/sort/filter operations.

### B6. app/panels/line-plot/ (21 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | add-multi-metric | - | - | pass | pass | |
| 2 | add-single-metric | - | - | pass | pass | |
| 3 | change-colors-legend | - | - | pass | pass | |
| 4 | change-colors-table | - | - | pass | pass | |
| 5 | compare-metrics-one-chart | - | - | pass | pass | |
| 6 | custom-x-axis | - | - | pass | pass | |
| 7 | data-settings | - | - | pass | pass | |
| 8 | edit-individual | - | - | pass | pass | |
| 9 | edit-section | - | - | pass | pass | |
| 10 | edit-workspace | - | - | pass | pass | |
| 11 | expressions | - | - | pass | pass | |
| 12 | grouping-settings | - | - | pass | pass | |
| 13 | hide-legend | - | - | pass | pass | |
| 14 | legend-settings | - | - | pass | pass | |
| 15 | point-aggregation | - | - | pass | pass | |
| 16 | regex-groups | - | - | pass | pass | |
| 17 | smoothing-methods | - | - | pass | pass | |
| 18 | switch-x-axis | - | - | pass | pass | |
| 19 | visualize-averaged | - | - | pass | pass | |
| 20 | visualize-nan | - | - | pass | pass | |
| 21 | zoom | - | - | pass | pass | |

**Shared steps to extract**: navigate to workspace, open panel settings, assert chart rendering, axis/legend/color operations.

---

## Phase C: P1 Tests (71 specs)

### C1a. track/workspaces/ (7 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | saved-views-crud | - | fail | `ready` | fail | Pre-existing: orig 3/4 fail, BDD 3/4 fail (saved views not implemented in bandw) |
| 2 | workspace-default-settings | - | pass | `ready` | pass | |
| 3 | workspace-filter-group-sort | - | pass | `ready` | pass | |
| 4 | workspace-panel-sections | - | pass | `ready` | pass | |
| 5 | workspace-runs-sidebar | - | pass | `ready` | pass | |
| 6 | workspace-types | - | pass | `ready` | pass | |
| 7 | workspace-undo-redo | - | pass | `ready` | pass | |

### C1b. app/panels/overview/ (9 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | add-panel-manually | - | pass | - | pass | |
| 2 | manage-panels-crud | - | pass | - | pass | |
| 3 | manage-sections | - | pass | - | pass | |
| 4 | panel-full-screen | - | pass | - | pass | |
| 5 | quick-add-panels | - | fail | - | fail | Pre-existing: orig "individual add on hover" fails, BDD same |
| 6 | share-panel-embed-options | - | fail | - | fail | Pre-existing: orig 2/3 fail, BDD 2/3 fail (share/embed not implemented) |
| 7 | share-panel-url | - | pass | - | pass | |
| 8 | workspace-layout-config | - | pass | - | pass | |
| 9 | workspace-modes | - | pass | - | pass | |

### C1c. app/cascade-settings/ (6 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | panel-level-settings | - | pass | - | pass | |
| 2 | section-level-settings | - | pass | - | pass | |
| 3 | settings-cascade-hierarchy | - | pass | - | pass | |
| 4 | workspace-layout-options | - | pass | - | pass | |
| 5 | workspace-level-settings | - | pass | - | pass | |
| 6 | workspace-line-plot-defaults | - | pass | - | pass | |

### C2a. app/panels/bar-plot/ (3 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | bar-plot-grouped-by-config | - | - | ready | pass | |
| 2 | create-bar-plot | - | - | ready | pass | |
| 3 | customize-bar-to-box-plot | - | - | ready | pass | |

### C2b. app/panels/scatter-plot/ (2 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | create-scatter-plot | - | - | ready | pass | |
| 2 | scatter-plot-example | - | - | ready | pass | |

### C2c. app/panels/parallel-coordinates/ (3 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | create-parallel-coords | - | - | `ready` | `pass` | |
| 2 | parallel-coords-filter | - | - | `ready` | `pass` | |
| 3 | parallel-coords-settings | - | - | `ready` | `pass` | |

### C2d. track/plots/ (15 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | define-metric-custom-x | - | - | `ready` | `pass` | |
| 2 | define-metric-glob | - | - | `ready` | `pass` | |
| 3 | matplotlib-plotly-logging | - | - | `ready` | `pass` | |
| 4 | point-aggregation-modes | - | - | `ready` | `pass` | |
| 5 | smoothing-methods | - | - | `ready` | `pass` | |
| 6 | wandb-plot-bar | - | - | `ready` | `pass` | |
| 7 | wandb-plot-confusion-matrix | - | - | `ready` | `pass` | |
| 8 | wandb-plot-histogram | - | - | `ready` | `pass` | |
| 9 | wandb-plot-line | - | - | `ready` | `pass` | |
| 10 | wandb-plot-multiline | - | - | `ready` | `pass` | |
| 11 | wandb-plot-pr-curve | - | - | `ready` | `pass` | |
| 12 | wandb-plot-roc-curve | - | - | `ready` | `pass` | |
| 13 | wandb-plot-scatter | - | - | `ready` | `pass` | |

### C3a. app/panels/run-comparer/ (5 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | add-run-comparer | - | - | `ready` | `pass` | |
| 2 | run-comparer-diff-only | - | - | `ready` | `pass` | |
| 3 | run-comparer-dynamic-update | - | - | `ready` | `pass` | |
| 4 | run-comparer-formatting | - | - | `ready` | `pass` | |
| 5 | run-comparer-search | - | - | `ready` | `pass` | |

### C3b. runs/compare/ (9 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | baseline-comparison-tooltips | - | - | `ready` | `pass` | |
| 2 | change-baseline-run | - | - | `ready` | `pass` | |
| 3 | compare-runs-full-workflow | - | - | `ready` | `pass` | |
| 4 | compare-runs-limitations | - | - | `ready` | `pass` | |
| 5 | hide-metric-deltas | - | - | `ready` | `pass` | |
| 6 | pin-runs | - | - | `ready` | `pass` | |
| 7 | remove-baseline | - | - | `ready` | `pass` | |
| 8 | set-baseline-run | - | - | `ready` | `pass` | |
| 9 | summary-metric-deltas | - | - | `ready` | `pass` | |

### C3c. runs/management/ (11 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | add-tags-project | - | - | ready | pass | |
| 2 | add-tags-run | - | - | ready | pass | |
| 3 | add-tags-sdk | - | - | ready | pass | |
| 4 | delete-group | - | - | ready | pass | |
| 5 | group-by-job-type | - | - | ready | pass | |
| 6 | group-runs-sdk | - | - | ready | pass | |
| 7 | group-runs-ui | - | - | ready | pass | |
| 8 | move-between-groups | - | - | ready | pass | |
| 9 | move-to-project | - | - | ready | pass | |
| 10 | remove-tags | - | - | ready | pass | |
| 11 | run-state-display | - | - | ready | pass | |

### C3c (cont). runs/filter/ (6 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | default-filters | - | - | ready | pass | |
| 2 | filter-by-metric | - | - | ready | pass | |
| 3 | filter-by-state | - | - | ready | pass | |
| 4 | filter-by-tags | - | - | ready | pass | |
| 5 | filter-operators-by-type | - | - | ready | pass | |
| 6 | remove-filter | - | - | ready | pass | |

### C3d. runs/display/ (13 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | color-by-config-key | - | - | ready | ready | |
| 2 | delete-runs | - | - | ready | ready | |
| 3 | export-runs-csv | - | - | ready | ready | |
| 4 | fork-run-display | - | - | ready | ready | |
| 5 | key-based-run-coloring | - | - | ready | ready | |
| 6 | manage-columns-add-remove | - | - | ready | ready | |
| 7 | manage-columns-move-pin | - | - | ready | ready | |
| 8 | resumed-run-display | - | - | ready | ready | |
| 9 | rewind-run-display | - | - | ready | ready | |
| 10 | search-runs-by-name | - | - | ready | ready | |
| 11 | search-runs-regex-toggle | - | - | ready | ready | |
| 12 | sort-by-column-with-aggregation | - | - | ready | ready | |
| 13 | stop-run-from-ui | - | - | ready | ready | |

---

## Phase D: P2 Tests (76 specs)

### D1a. app/panels/media/ (1 spec)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | media-panels | - | - | ready | ready | |

### D1b. app/panels/code/ (1 spec)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | code-panels | - | - | ready | ready | |

### D1b (cont). app/panels/query-panels/ (1 spec)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | query-panels | - | - | ready | ready | |

### D1c. app/keyboard-shortcuts/ (1 spec)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | keyboard-shortcuts | - | - | ready | ready | |

### D1d. app/panels/parameter-importance/ (2 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | create-param-importance | - | - | ready | ready | |
| 2 | param-importance-interpretation | - | - | ready | ready | |

### D2a. artifacts/core/ (1 spec)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | artifacts-core | - | - | ready | ready | |

### D2b. artifacts/advanced/ (1 spec)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | artifacts-advanced | - | - | ready | ready | |

### D3a. reports/core/ (1 spec)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | reports-core | - | - | ready | ready | |

### D3b. reports/advanced/ (1 spec)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | reports-advanced | - | - | ready | ready | |

### D4a. tables/core/ (6 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | log-and-view-table | - | - | ready | ready | |
| 2 | table-compare-across-models | - | - | ready | ready | |
| 3 | table-compare-across-time | - | - | ready | ready | |
| 4 | table-merged-view | - | - | ready | ready | |
| 5 | table-side-by-side-view | - | - | ready | ready | |
| 6 | table-step-slider | - | - | ready | ready | |

### D4b. tables/advanced/ (4 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | table-download | - | - | ready | ready | |
| 2 | table-immutable-mode | - | - | ready | ready | |
| 3 | table-incremental-mode | - | - | ready | ready | |
| 4 | table-mutable-mode | - | - | ready | ready | |

### D4c. app/custom-charts/ (8 specs)

| # | Spec file | Orig wandb | Orig bandw | BDD wandb | BDD bandw | Notes |
|---|-----------|-----------|-----------|----------|----------|-------|
| 1 | custom-chart-bar | - | - | ready | ready | |
| 2 | custom-chart-edit-in-ui | - | - | ready | ready | |
| 3 | custom-chart-histogram | - | - | ready | ready | |
| 4 | custom-chart-line | - | - | ready | ready | |
| 5 | custom-chart-pr-curve | - | - | ready | ready | |
| 6 | custom-chart-roc-curve | - | - | ready | ready | |
| 7 | custom-chart-scatter | - | - | ready | ready | |
| 8 | custom-chart-table-data | - | - | ready | ready | |

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

| Phase | Group | Total | Orig wandb | Orig bandw | BDD wandb | BDD bandw |
|-------|-------|-------|-----------|-----------|----------|----------|
| B1 | track/config | 5 | 0/5 | 0/5 | 0/5 | 0/5 |
| B2 | track/logging | 8 | 0/8 | 0/8 | 0/8 | 0/8 |
| B3 | track/summary | 3 | 0/3 | 0/3 | 0/3 | 0/3 |
| B4 | runs/view | 10 | 0/10 | 0/10 | 0/10 | 0/10 |
| B5 | track/project-page | 13 | 0/13 | 13/13 | 0/13 | 13/13 |
| B6 | app/panels/line-plot | 21 | 0/21 | 21/21 | 0/21 | 21/21 |
| C1a | track/workspaces | 7 | 0/7 | 6/7 | 0/7 | 6/7 |
| C1b | app/panels/overview | 9 | 0/9 | 7/9 | 0/9 | 7/9 |
| C1c | app/cascade-settings | 6 | 0/6 | 6/6 | 0/6 | 6/6 |
| C2a | app/panels/bar-plot | 3 | 0/3 | 0/3 | 3/3 | 3/3 |
| C2b | app/panels/scatter-plot | 2 | 0/2 | 0/2 | 0/2 | 0/2 |
| C2c | app/panels/parallel-coords | 3 | 0/3 | 0/3 | 3/3 | 3/3 |
| C2d | track/plots | 13 | 0/13 | 0/13 | 13/13 | 13/13 |
| C3a | app/panels/run-comparer | 5 | 0/5 | 0/5 | 5/5 | 5/5 |
| C3b | runs/compare | 9 | 0/9 | 0/9 | 0/9 | 0/9 |
| C3c | runs/management + filter | 17 | 0/17 | 0/17 | 17/17 | 17/17 |
| C3d | runs/display | 13 | 0/13 | 0/13 | 13/13 | 13/13 |
| D1a | app/panels/media | 1 | 0/1 | 0/1 | 1/1 | 1/1 |
| D1b | app/panels/code + query | 2 | 0/2 | 0/2 | 2/2 | 2/2 |
| D1c | app/keyboard-shortcuts | 1 | 0/1 | 0/1 | 1/1 | 1/1 |
| D1d | app/panels/param-importance | 2 | 0/2 | 0/2 | 2/2 | 2/2 |
| D2a | artifacts/core | 1 | 0/1 | 0/1 | 1/1 | 1/1 |
| D2b | artifacts/advanced | 1 | 0/1 | 0/1 | 1/1 | 1/1 |
| D3a | reports/core | 1 | 0/1 | 0/1 | 1/1 | 1/1 |
| D3b | reports/advanced | 1 | 0/1 | 0/1 | 1/1 | 1/1 |
| D4a | tables/core | 6 | 0/6 | 0/6 | 6/6 | 6/6 |
| D4b | tables/advanced | 4 | 0/4 | 0/4 | 4/4 | 4/4 |
| D4c | app/custom-charts | 8 | 0/8 | 0/8 | 8/8 | 8/8 |
| | **TOTAL** | **177** | **0/177** | **0/177** | **0/177** | **0/177** |

---

## Subagent Coordination

Multiple agents can work in parallel on independent groups. Rules:

1. **Claim before starting** — update the group's "Orig wandb" column to `run` before executing tests
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
