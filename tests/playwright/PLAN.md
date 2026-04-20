# UI Test Suite Plan — Index

## Overview

This test suite validates W&B UI workflows as "testing pairs" (Python SDK setup + Playwright verification). Tests are organized by the corresponding W&B docs page, with one test per documented heading/behavior.

**Architecture:** [00-architecture.md](00-architecture.md)

### File Layout

All detailed test specs live alongside the tests as `SPEC.md` files in `tests/playwright/tests/`. This directory (`docs/plans/ui-tests/`) contains only the top-level plan overview.

- `tests/playwright/ARCHITECTURE.md` — full architecture reference
- `tests/playwright/PLAN.md` — copy of this index
- `tests/playwright/tests/{path}/SPEC.md` — per-folder test specification

### Network Recording (always-on)

Every test run records full HAR network traffic to `tests/playwright/snapshots/{target}/`. When tests run against wandb.ai, we capture the real GraphQL queries, REST calls, response shapes, and timing — this corpus enables offline diff analysis against our bandw backend without being a test assertion. See [00-architecture.md](00-architecture.md) § "Network Recording & Diff Analysis" for details.

---

## Test Plans by W&B Docs Page

| # | SPEC.md Location | Docs Coverage | Tests | Pri |
|---|---|---|---|---|
| 01 | `app/panels/line-plot/` | line-plot + reference + smoothing + sampling | 20 | P0 |
| 02 | `app/panels/bar-plot/` | bar-plot | 3 | P1 |
| 03 | `app/panels/scatter-plot/` | scatter-plot | 2 | P1 |
| 04 | `app/panels/parallel-coordinates/` | parallel-coordinates | 3 | P1 |
| 05 | `app/panels/run-comparer/` | run-comparer | 5 | P1 |
| 06 | `app/panels/parameter-importance/` | parameter-importance | 2 | P2 |
| 07 | `app/panels/overview/` | panels overview | 8 | P1 |
| 08 | `track/workspaces/` | workspaces | 7 | P1 |
| 09 | `track/project-page/` | project-page | 14 | P0 |
| 10 | `runs/view/` | view-logged-runs | 12 | P0 |
| 11 | `runs/compare/` | compare-runs | 9 | P1 |
| 12 | `runs/management/` + `runs/filter/` | tags, grouping, filter, states, manage | 14 | P1 |
| 13 | `track/config/` + `track/logging/` + `track/summary/` | config, log, log-summary | 10 | P0 |
| 14 | `artifacts/core/` | artifacts, lineage graph | 6 | P2 |
| 15 | `reports/core/` | create, edit | 9 | P2 |
| 16 | `tables/core/` | tables, visualize-tables | 6 | P2 |
| 17 | `app/custom-charts/` | custom-charts | 8 | P2 |
| 18 | `app/cascade-settings/` | cascade-settings | 6 | P1 |
| 19 | `runs/display/` | customize-run-display, search, colors, delete, stop, fork, rewind, resume | 14 | P1 |
| 20 | `app/panels/media/` | panels/media, log/media | 13 | P2 |
| 21 | `app/panels/code/` + `app/panels/query-panels/` | panels/code, query-panels | 6 | P2 |
| 22 | `track/plots/` | customize-logging-axes, plots, smoothing, sampling | 14 | P1 |
| 23 | `app/keyboard-shortcuts/` | keyboard-shortcuts | 4 | P2 |
| 24 | `tables/advanced/` | log_tables modes, download | 4 | P2 |
| 25 | `artifacts/advanced/` | construct, aliases, versions, update, delete | 5 | P2 |
| 26 | `reports/advanced/` | collaborate, cross-project, clone, export | 9 | P2 |

All SPEC.md paths are relative to `tests/playwright/tests/`.

---

## Test Count Summary

| Priority | Test Count | Test Folders |
|---|---|---|
| **P0** | 55 | `app/panels/line-plot/`, `track/project-page/`, `runs/view/`, `track/config/`, `track/logging/`, `track/summary/` |
| **P1** | 71 | `app/panels/{bar,scatter,parallel,run-comparer,overview}/`, `track/workspaces/`, `runs/{compare,management,filter,display}/`, `app/cascade-settings/`, `track/plots/` |
| **P2** | 76 | `app/panels/{parameter-importance,media,code,query-panels}/`, `artifacts/`, `reports/`, `tables/`, `app/{custom-charts,keyboard-shortcuts}/` |
| **Total** | **202** | |

---

## Directory Structure

Test folders mirror the `docs.wandb.ai/models/` hierarchy. Each leaf folder is a co-located testing pair: `setup.py` (Python SDK) + `*.spec.ts` (Playwright).

```
tests/playwright/
  playwright.config.ts
  package.json / tsconfig.json
  pyproject.toml                  # Python deps (wandb, numpy, etc.) — managed via uv

  fixtures/  base.ts, sdk-setup.ts, graphql-recorder.ts
  pages/     *.page.ts (aria-based page objects)
  shared-sdk/helpers.py

  tests/
    track/
      config/          setup.py + *.spec.ts     (config at init, mid-run update)
      logging/         setup.py + *.spec.ts     (metrics, custom x-axis, naming)
      summary/         setup.py + *.spec.ts     (overview, table, aggregation)
      plots/           setup.py + *.spec.ts     (wandb.plot.* presets)
      workspaces/      setup.py + *.spec.ts     (types, saved views, sidebar)
      project-page/    setup.py + *.spec.ts     (overview, runs table, tabs)

    runs/
      view/            setup.py + *.spec.ts     (detail tabs: overview, charts, logs, system, files)
      compare/         setup.py + *.spec.ts     (pin, baseline, deltas)
      management/      setup.py + *.spec.ts     (tags, grouping, job type, move)
      filter/          setup.py + *.spec.ts     (by state, metric, tags, defaults)
      display/         setup.py + *.spec.ts     (columns, sort, search, colors, delete, stop, fork)

    app/
      panels/
        overview/              (modes, layout, full-screen, add/manage, sections)
        line-plot/             (add, edit, zoom, colors, x-axes, NaN, smoothing, sampling)
        bar-plot/              (auto-gen, box/violin, grouped)
        scatter-plot/          (create, features)
        parallel-coordinates/  (create, settings, filter)
        run-comparer/          (add, search, diff-only, dynamic update)
        parameter-importance/  (create, interpret)
        media/                 (images, masks, boxes, audio, video, 3D, compare mode)
        code/                  (code comparer, jupyter)
        query-panels/          (create, operations, config)
      cascade-settings/        (workspace/section/panel levels, hierarchy)
      custom-charts/           (6 presets, table data, edit in UI)
      keyboard-shortcuts/      (undo/redo, navigation, media)

    artifacts/
      core/            (browse, versions, lineage view/navigate/clusters, I/O)
      advanced/        (files/dirs, aliases, auto-increment, delete, metadata)

    reports/
      core/            (create, add plots/run sets/code/markdown, freeze, collapse)
      advanced/        (share, edit, comments, star, cross-project, clone, export)

    tables/
      core/            (log & view, merged, side-by-side, compare, step slider)
      advanced/        (immutable/mutable/incremental modes, download)
```

See [00-architecture.md](00-architecture.md) for the complete expanded tree.

---

## Plan File → Test Folder Mapping

| Plan File | Destination `SPEC.md` Location |
|---|---|
| `01-line-plots.md` | `tests/app/panels/line-plot/SPEC.md` |
| `02-bar-plots.md` | `tests/app/panels/bar-plot/SPEC.md` |
| `03-scatter-plots.md` | `tests/app/panels/scatter-plot/SPEC.md` |
| `04-parallel-coordinates.md` | `tests/app/panels/parallel-coordinates/SPEC.md` |
| `05-run-comparer.md` | `tests/app/panels/run-comparer/SPEC.md` |
| `06-parameter-importance.md` | `tests/app/panels/parameter-importance/SPEC.md` |
| `07-panels-overview.md` | `tests/app/panels/overview/SPEC.md` |
| `08-workspaces.md` | `tests/track/workspaces/SPEC.md` |
| `09-project-page.md` | `tests/track/project-page/SPEC.md` |
| `10-run-detail.md` | `tests/runs/view/SPEC.md` |
| `11-compare-runs.md` | `tests/runs/compare/SPEC.md` |
| `12-run-management.md` | `tests/runs/management/SPEC.md` + `tests/runs/filter/SPEC.md` |
| `13-config-and-logging.md` | `tests/track/config/SPEC.md` + `tests/track/logging/SPEC.md` + `tests/track/summary/SPEC.md` |
| `14-artifacts.md` | `tests/artifacts/core/SPEC.md` |
| `15-reports.md` | `tests/reports/core/SPEC.md` |
| `16-tables.md` | `tests/tables/core/SPEC.md` |
| `17-custom-charts.md` | `tests/app/custom-charts/SPEC.md` |
| `18-cascade-settings.md` | `tests/app/cascade-settings/SPEC.md` |
| `19-run-display-and-search.md` | `tests/runs/display/SPEC.md` |
| `20-media-panels.md` | `tests/app/panels/media/SPEC.md` |
| `21-code-query-panels.md` | `tests/app/panels/code/SPEC.md` + `tests/app/panels/query-panels/SPEC.md` |
| `22-logging-axes-and-plots.md` | `tests/track/plots/SPEC.md` (+ smoothing/sampling folded into `tests/app/panels/line-plot/SPEC.md`) |
| `23-keyboard-shortcuts.md` | `tests/app/keyboard-shortcuts/SPEC.md` |
| `24-tables-advanced.md` | `tests/tables/advanced/SPEC.md` |
| `25-artifacts-advanced.md` | `tests/artifacts/advanced/SPEC.md` |
| `26-reports-advanced.md` | `tests/reports/advanced/SPEC.md` |

---

## SDK Setup Scripts Required

| Script | Description | Used By |
|---|---|---|
| `shared-sdk/helpers.py` | Shared utilities: unique names, env config, JSON output | All |
| Per-folder `setup.py` | Co-located with test specs, imports from helpers | Each test folder |

---

## Implementation Order

### Phase A: Foundation (before any tests)
1. `tests/playwright/package.json` + `playwright.config.ts` + `tsconfig.json`
2. `tests/playwright/pyproject.toml` for Python deps
3. `tests/playwright/fixtures/base.ts` + `sdk-setup.ts`
4. `tests/playwright/shared-sdk/helpers.py`
5. First page object: `pages/runs-table.page.ts`
6. ARIA attributes added to Svelte components (see 00-architecture.md)

### Phase B: P0 Tests (53 tests)
1. `config-and-logging/` — proves SDK-to-UI data flow
2. `run-detail/` — verifies individual run pages
3. `project-page/` — verifies runs table
4. `line-plots/` — verifies the most important panel type

### Phase C: P1 Tests (71 tests)
5. `workspaces/` + `panels-overview/` + `cascade-settings/`
6. `bar-plots/` + `scatter-plots/` + `parallel-coordinates/` + `logging-axes-and-plots/`
7. `run-comparer/` + `compare-runs/` + `run-management/` + `run-display-and-search/`

### Phase D: P2 Tests (76 tests)
8. `media-panels/` + `code-query-panels/` + `keyboard-shortcuts/`
9. `artifacts/` + `artifacts-advanced/`
10. `reports/` + `reports-advanced/`
11. `tables/` + `tables-advanced/`
12. `custom-charts/` + `parameter-importance/`

---

## Parallelism Budget

With 200 tests across ~60 spec files, at 8 parallel workers:
- Each spec file: ~20-30s (SDK setup + browser tests)
- Total wall time estimate: ~4-5 minutes for full suite
- P0 only: ~2 minutes
