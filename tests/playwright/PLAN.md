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

| Priority | Tests (desktop) | ×3 viewports | Test Folders |
|---|---|---|---|
| **P0** | 55 | 165 | `app/panels/line-plot/`, `track/project-page/`, `runs/view/`, `track/config/`, `track/logging/`, `track/summary/` |
| **P1** | 71 | 213 | `app/panels/{bar,scatter,parallel,run-comparer,overview}/`, `track/workspaces/`, `runs/{compare,management,filter,display}/`, `app/cascade-settings/`, `track/plots/` |
| **P2** | 76 | 228 | `app/panels/{parameter-importance,media,code,query-panels}/`, `artifacts/`, `reports/`, `tables/`, `app/{custom-charts,keyboard-shortcuts}/` |
| **Total** | **202** | **606** | |

> Every test runs at 3 viewports (desktop 1280×720, tablet 768×1024, mobile 375×812) via
> Playwright projects. Desktop-only runs (`--project=bandw`) use the base count for faster iteration.
> See [ARCHITECTURE.md](ARCHITECTURE.md) § "Responsive / Viewport Testing" for details.

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

Items within a step marked **parallel** can be worked on concurrently.
Check off each item as it is completed.

### Phase A: Foundation (before any tests)

- [x] A1. `tests/playwright/package.json` + `playwright.config.ts` + `tsconfig.json`
- [x] A2. `tests/playwright/pyproject.toml` for Python deps
- [x] A3. `tests/playwright/fixtures/base.ts` (incl. `isMobile` / `isTablet` fixtures) + `sdk-setup.ts` + `network-recorder.ts`
- [x] A4. `tests/playwright/shared-sdk/helpers.py`
- [x] A5. First page objects: `pages/runs-table.page.ts`, `pages/run-detail.page.ts`
- [ ] A6. ARIA attributes added to Svelte components (see 00-architecture.md)

> A1 and A2 are **parallel**. A3-A4 depend on A1/A2. A5 depends on A3.
> A6 is ongoing — add attributes as each test area is implemented.

### Phase B: P0 Tests (55 tests) — sequential within, proves core data flow

- [x] B1. `track/config/` (5 tests) — proves SDK config → UI flow
- [x] B2. `track/logging/` (8 tests) — proves SDK metrics → UI flow
- [x] B3. `track/summary/` (3 tests) — proves SDK summary → UI flow
- [ ] B4. `runs/view/` (12 tests) — verifies individual run detail pages
- [ ] B5. `track/project-page/` (14 tests) — verifies runs table & project overview
- [ ] B6. `app/panels/line-plot/` (20 tests) — verifies the most important panel type

> B1, B2, B3 are **parallel** (independent SDK setup scripts, independent pages).
> B4 depends on B1-B3 (uses the same run detail page objects).
> B5 is **parallel** with B4 (different page, different fixtures).
> B6 depends on B4 (builds on run detail page objects + charts tab).

### Phase C: P1 Tests (71 tests)

**Step C1 — Workspace & layout (21 tests):**
- [ ] C1a. `track/workspaces/` (7 tests)
- [ ] C1b. `app/panels/overview/` (8 tests)
- [ ] C1c. `app/cascade-settings/` (6 tests)

> C1a, C1b, C1c are **parallel** (independent page objects and fixtures).

**Step C2 — Additional panel types (22 tests):**
- [ ] C2a. `app/panels/bar-plot/` (3 tests)
- [ ] C2b. `app/panels/scatter-plot/` (2 tests)
- [ ] C2c. `app/panels/parallel-coordinates/` (3 tests)
- [ ] C2d. `track/plots/` (14 tests)

> C2a, C2b, C2c are **parallel**. C2d can run in **parallel** with C2a-C2c.
> All of C2 can run in **parallel** with C1 (different page areas).

**Step C3 — Run operations (42 tests):**
- [ ] C3a. `app/panels/run-comparer/` (5 tests)
- [ ] C3b. `runs/compare/` (9 tests)
- [ ] C3c. `runs/management/` (7 tests) + `runs/filter/` (7 tests)
- [ ] C3d. `runs/display/` (14 tests)

> C3a and C3b are **parallel** (both compare-related but different pages).
> C3c and C3d are **parallel** (management vs display).
> All of C3 can run in **parallel** with C1 and C2 (different page areas).

### Phase D: P2 Tests (76 tests)

**Step D1 — Specialized panels (23 tests):**
- [ ] D1a. `app/panels/media/` (13 tests)
- [ ] D1b. `app/panels/code/` (3 tests) + `app/panels/query-panels/` (3 tests)
- [ ] D1c. `app/keyboard-shortcuts/` (4 tests)

> D1a, D1b, D1c are **parallel**.

**Step D2 — Artifacts (11 tests):**
- [ ] D2a. `artifacts/core/` (6 tests)
- [ ] D2b. `artifacts/advanced/` (5 tests)

> D2a first, then D2b (advanced builds on core page objects).
> D2 is **parallel** with D1.

**Step D3 — Reports (18 tests):**
- [ ] D3a. `reports/core/` (9 tests)
- [ ] D3b. `reports/advanced/` (9 tests)

> D3a first, then D3b. D3 is **parallel** with D1 and D2.

**Step D4 — Tables & remaining (18 tests):**
- [ ] D4a. `tables/core/` (6 tests)
- [ ] D4b. `tables/advanced/` (4 tests)
- [ ] D4c. `app/custom-charts/` (8 tests)
- [ ] D4d. `app/panels/parameter-importance/` (2 tests — stub; needs ML backend)

> D4a then D4b (sequential). D4c and D4d are **parallel** with each other and with D4a/D4b.
> All of D4 is **parallel** with D1, D2, D3.

---

## Parallelism Budget

With 202 tests across ~60 spec files, at 8 parallel workers:
- Each spec file: ~20-30s (SDK setup + browser tests)
- **Desktop only** (`--project=bandw`): ~4-5 minutes for full suite, ~2 minutes P0 only
- **All 3 viewports** (`bandw` + `bandw-tablet` + `bandw-mobile`): ~12-15 minutes (3× spec files, but SDK setup is shared across viewports so no 3× on data creation)
- **Tip:** Run desktop-only during development; run all viewports in CI and before merge
