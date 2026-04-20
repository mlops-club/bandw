# UI Test Suite Architecture

## Purpose

A Playwright test suite that validates W&B UI workflows against both:
- **wandb.ai** (reference implementation, for reverse-engineering and conformance)
- **bandw frontend** (our Svelte 5 clone, the real target)

Each test is a **"testing pair"**: Python SDK code to set up data + Playwright code to verify the UI. The Python and TypeScript code for each test are **co-located** in the same folder.

## Spec Authoring Workflow

Every test plan must be authored from **observed W&B behavior**, not from docs alone. The docs define scope, but the real W&B UI defines the interaction model, selectors, request shapes, and undocumented edge behavior.

Before writing or updating any `SPEC.md` or Playwright test:

1. Run the folder's SDK setup script against **real wandb.ai** to create representative data.
2. Open the real W&B UI in **Chrome MCP** (preferred) or a manual browser session.
3. Explore the full workflow in the real UI while recording a **HAR** for the session.
4. Observe the actual UI behavior, visible labels, ARIA roles, keyboard interactions, panel states, and request / response payloads.
5. Only then write or update the `SPEC.md` and Playwright test using the observed behavior as the source of truth.

If the docs and the observed UI differ:
- Treat the linked docs as the scope boundary.
- Treat the observed UI as the implementation reference for selectors, workflows, and network behavior.
- Call out doc / UI mismatches in the spec instead of guessing.

## Directory Structure

```
tests/playwright/
  playwright.config.ts            # Dual-project config (bandw + wandb targets)
  package.json                    # @playwright/test, dependencies
  tsconfig.json
  pyproject.toml                  # Python dependencies for ALL SDK setup scripts
                                  #   (wandb, numpy, etc.) — managed via uv

  fixtures/
    base.ts                       # Target config, target-aware auth, authenticated page
    sdk-setup.ts                  # Runs Python SDK scripts via uv, parses JSON
    network-recorder.ts           # Always-on HAR recording for all network traffic

  pages/                          # Page objects (aria-first selectors)
    projects-list.page.ts
    runs-table.page.ts
    workspace.page.ts
    run-detail.page.ts
    run-detail-overview.page.ts
    run-detail-charts.page.ts
    run-detail-logs.page.ts
    run-detail-system.page.ts
    artifacts.page.ts
    artifact-lineage.page.ts
    reports.page.ts
    report-editor.page.ts
    tables.page.ts

  shared-sdk/                     # Shared Python helpers (imported by per-test setup.py)
    helpers.py                    # Unique project names, env config, JSON output contract

  PLAN.md                         # Master plan index (moved from docs/plans/ui-tests/INDEX.md)
  ARCHITECTURE.md                 # This file (moved from docs/plans/ui-tests/00-architecture.md)

  tests/                          # Mirrors docs.wandb.ai/models/ hierarchy
    track/                        # /models/track/*
      config/                     # Config at init, mid-run update
        SPEC.md                   # Test spec (from 13-config-and-logging.md, config portion)
        setup.py
        config-at-init.spec.ts
        config-updated-mid-run.spec.ts
      logging/                    # Logging metrics, custom axes, naming
        SPEC.md
        setup.py
        metrics-in-workspace.spec.ts
        multiple-metrics.spec.ts
        metric-naming.spec.ts
        custom-x-axis.spec.ts
        define-metric-glob.spec.ts
      summary/                    # Summary metrics: overview, table, aggregation
        SPEC.md
        setup.py
        summary-in-overview.spec.ts
        summary-in-table.spec.ts
        custom-aggregation.spec.ts
      plots/                      # wandb.plot.* presets + matplotlib/plotly
        SPEC.md
        setup.py
        line.spec.ts
        scatter.spec.ts
        bar.spec.ts
        histogram.spec.ts
        multiline.spec.ts
        confusion-matrix.spec.ts
        pr-curve.spec.ts
        roc-curve.spec.ts
        matplotlib-plotly.spec.ts
      workspaces/                 # Workspace types, saved views, sidebar, sections
        SPEC.md
        setup.py
        types.spec.ts
        saved-views-crud.spec.ts
        default-settings.spec.ts
        runs-sidebar.spec.ts
        filter-group-sort.spec.ts
        undo-redo.spec.ts
        panel-sections.spec.ts
      project-page/               # Project overview, runs table, artifacts/reports tabs
        SPEC.md
        setup.py
        overview.spec.ts
        workspace-tab.spec.ts
        runs-table-columns.spec.ts
        runs-table-sort.spec.ts
        runs-table-filter.spec.ts
        runs-table-group.spec.ts
        runs-table-search.spec.ts
        runs-table-bulk-ops.spec.ts
        runs-table-visibility-sync.spec.ts
        artifacts-tab.spec.ts
        reports-tab.spec.ts
        project-lifecycle.spec.ts
        project-notes.spec.ts

    runs/                         # /models/runs/*
      view/                       # Run detail tabs: overview, charts, logs, system, files
        SPEC.md
        setup.py
        overview-metadata.spec.ts
        overview-config.spec.ts
        overview-summary.spec.ts
        overview-editable.spec.ts
        overview-artifacts.spec.ts
        charts-tab.spec.ts
        logs-tab.spec.ts
        system-tab.spec.ts
        files-tab.spec.ts
        artifacts-tab.spec.ts
        tab-navigation.spec.ts
      compare/                    # Pin, baseline, deltas, full workflow
        SPEC.md
        setup.py
        pin-runs.spec.ts
        set-baseline.spec.ts
        change-baseline.spec.ts
        remove-baseline.spec.ts
        baseline-tooltips.spec.ts
        summary-metric-deltas.spec.ts
        hide-metric-deltas.spec.ts
        full-workflow.spec.ts
        limitations.spec.ts
      management/                 # Tags, grouping, job type, move
        SPEC.md
        setup.py
        add-tags-project.spec.ts
        add-tags-run.spec.ts
        add-tags-sdk.spec.ts
        remove-tags.spec.ts
        group-runs-ui.spec.ts
        group-runs-sdk.spec.ts
        group-by-job-type.spec.ts
        move-between-groups.spec.ts
        move-to-project.spec.ts
      filter/                     # Filter by state, metric, tags, defaults
        SPEC.md
        setup.py
        filter-by-state.spec.ts
        filter-by-metric.spec.ts
        filter-by-tags.spec.ts
        default-filters.spec.ts
      display/                    # Columns, sort, search, colors, delete, stop, fork
        SPEC.md
        setup.py
        manage-columns-add-remove.spec.ts
        manage-columns-move-pin.spec.ts
        sort-by-column-aggregation.spec.ts
        export-csv.spec.ts
        search-by-name.spec.ts
        search-regex-toggle.spec.ts
        key-based-coloring.spec.ts
        color-by-config.spec.ts
        run-state-display.spec.ts
        delete-runs.spec.ts
        stop-run.spec.ts
        fork-run-display.spec.ts
        rewind-run-display.spec.ts
        resumed-run-display.spec.ts

    app/                          # /models/app/*
      panels/                     # /models/app/features/panels/*
        overview/                 # Workspace modes, layout, full-screen, add/manage
          SPEC.md
          setup.py
          workspace-modes.spec.ts
          workspace-layout-config.spec.ts
          panel-full-screen.spec.ts
          add-panel-manually.spec.ts
          quick-add-panels.spec.ts
          share-panel-url.spec.ts
          manage-panels-crud.spec.ts
          manage-sections.spec.ts
        line-plot/                # Add, edit, zoom, colors, axes, NaN, smoothing, sampling
          SPEC.md
          setup.py
          add-single-metric.spec.ts
          add-multi-metric.spec.ts
          regex-groups.spec.ts
          edit-individual.spec.ts
          edit-section.spec.ts
          edit-workspace.spec.ts
          visualize-averaged.spec.ts
          visualize-nan.spec.ts
          compare-metrics-one-chart.spec.ts
          change-colors-table.spec.ts
          change-colors-legend.spec.ts
          switch-x-axis.spec.ts
          custom-x-axis.spec.ts
          zoom.spec.ts
          hide-legend.spec.ts
          data-settings.spec.ts
          grouping-settings.spec.ts
          legend-settings.spec.ts
          expressions.spec.ts
          smoothing-methods.spec.ts
          point-aggregation.spec.ts
        bar-plot/                 # Auto-gen, box/violin, grouped
          SPEC.md
          setup.py
          auto-generated.spec.ts
          customize-box-violin.spec.ts
          grouped-by-config.spec.ts
        scatter-plot/             # Create, features (log scale, z-axis, tooltips)
          SPEC.md
          setup.py
          create.spec.ts
          features.spec.ts
        parallel-coordinates/     # Create, settings, filter by range
          SPEC.md
          setup.py
          create.spec.ts
          settings.spec.ts
          filter.spec.ts
        run-comparer/             # Add, search, diff-only, formatting, dynamic
          SPEC.md
          setup.py
          add.spec.ts
          search.spec.ts
          diff-only.spec.ts
          formatting.spec.ts
          dynamic-update.spec.ts
        parameter-importance/     # Create, interpret
          SPEC.md
          setup.py
          create.spec.ts
          interpretation.spec.ts
        media/                    # Images, masks, boxes, audio, video, 3D, compare
          SPEC.md
          setup.py
          images.spec.ts
          segmentation-masks.spec.ts
          bounding-boxes.spec.ts
          histograms.spec.ts
          audio.spec.ts
          video.spec.ts
          point-clouds.spec.ts
          html.spec.ts
          panel-add-configure.spec.ts
          compare-mode.spec.ts
          sync.spec.ts
          overlays.spec.ts
        code/                     # Code comparer, jupyter artifacts
          SPEC.md
          setup.py
          code-comparer.spec.ts
          jupyter-artifact.spec.ts
        query-panels/             # Create, operations, config, artifact access
          SPEC.md
          setup.py
          create.spec.ts
          operations.spec.ts
          config.spec.ts
          artifacts.spec.ts
      cascade-settings/           # Workspace/section/panel levels, hierarchy
        SPEC.md
        setup.py
        workspace-level.spec.ts
        layout-options.spec.ts
        line-plot-defaults.spec.ts
        section-level.spec.ts
        panel-level.spec.ts
        cascade-hierarchy.spec.ts
      custom-charts/              # 6 presets, table data, edit in UI
        SPEC.md
        setup.py
        presets-line.spec.ts
        presets-scatter.spec.ts
        presets-bar.spec.ts
        presets-histogram.spec.ts
        presets-pr-curve.spec.ts
        presets-roc-curve.spec.ts
        table-data.spec.ts
        edit-in-ui.spec.ts
      keyboard-shortcuts/         # Undo/redo, navigation, media
        SPEC.md
        setup.py
        undo-redo.spec.ts
        navigation.spec.ts
        panel-navigation.spec.ts
        media-shortcuts.spec.ts

    artifacts/                    # /models/artifacts/*
      core/                       # Browse, versions, lineage, I/O tracking
        SPEC.md
        setup.py
        create-and-browse.spec.ts
        versions.spec.ts
        lineage-view.spec.ts
        lineage-navigate.spec.ts
        lineage-clusters.spec.ts
        input-output.spec.ts
      advanced/                   # Construct, aliases, versioning, delete, metadata
        SPEC.md
        setup.py
        files-and-dirs.spec.ts
        custom-aliases.spec.ts
        version-auto-increment.spec.ts
        delete.spec.ts
        update-metadata.spec.ts

    reports/                      # /models/reports/*
      core/                       # Create, add content, freeze, collapse
        SPEC.md
        setup.py
        create-from-workspace.spec.ts
        create-from-tab.spec.ts
        add-plots.spec.ts
        add-run-sets.spec.ts
        freeze-run-set.spec.ts
        add-code-block.spec.ts
        add-markdown.spec.ts
        add-headings.spec.ts
        collapse-headers.spec.ts
      advanced/                   # Share, collaborate, cross-project, clone, export
        SPEC.md
        setup.py
        share.spec.ts
        edit-draft.spec.ts
        comments.spec.ts
        star.spec.ts
        cross-project.spec.ts
        clone.spec.ts
        export.spec.ts
        send-panel-to-report.spec.ts

    tables/                       # /models/tables/*
      core/                       # Log & view, merged, side-by-side, compare, slider
        SPEC.md
        setup.py
        log-and-view.spec.ts
        merged-view.spec.ts
        side-by-side-view.spec.ts
        compare-across-time.spec.ts
        compare-across-models.spec.ts
        step-slider.spec.ts
      advanced/                   # Logging modes (immutable/mutable/incremental), download
        SPEC.md
        setup.py
        immutable-mode.spec.ts
        mutable-mode.spec.ts
        incremental-mode.spec.ts
        download.spec.ts

  snapshots/                       # Network recordings (HAR files), mirrors test tree
    wandb/                        # Recorded against real wandb.ai (committed to git)
      track/config/requests.har
      app/panels/line-plot/requests.har
      ...
    bandw/                        # Recorded against bandw (gitignored or committed)
      track/config/requests.har
      ...
  screenshots/{bandw,wandb}/      # Visual captures at assertion points
```

## Python Dependency Management

All SDK setup scripts share a single `pyproject.toml` at the `tests/playwright/` root:

```toml
[project]
name = "bandw-playwright-sdk"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "wandb>=0.17",
    "numpy",
    "pillow",        # for wandb.Image from arrays
    "scikit-learn",  # for PR/ROC curve test data
]

[tool.uv]
# Lock file managed by uv
```

**Run any setup script with:** `uv run --project tests/playwright python tests/playwright/tests/line-plots/setup.py`

The `sdk-setup.ts` fixture handles this automatically — it calls `uv run` with the correct `--project` flag pointing at `tests/playwright/pyproject.toml`.

Each `setup.py` imports shared helpers:
```python
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared-sdk"))
from helpers import create_project, output_manifest, get_wandb_config
```

## Testing Pair Pattern

### SDK Script Contract

Each `setup.py` outputs JSON to stdout:
```json
{
  "project": "pw-line-plots-a7f3b2c1",
  "entity": "admin",
  "runs": [
    { "id": "abc123", "name": "run-abc123", "displayName": "train-v1" }
  ],
  "artifacts": [],
  "extra": {}
}
```

### Fixture Chain

1. `sdkSetup(folderName)` — file-scoped fixture, calls `uv run python tests/playwright/tests/{folder}/setup.py`
2. Environment variables `WANDB_BASE_URL` + `WANDB_API_KEY` point at active target
3. Script creates data, prints JSON, exits
4. Tests receive `{ project, entity, runs }`
5. Page objects and route helpers build target-specific URLs instead of hard-coding a single path shape

### Why File-Scoped

SDK run creation is slow (5-15s). Tests within a folder share setup data but get independent browser pages. Between folders, full parallelism.

### Co-location Benefits

- **Discoverability**: open any test folder, see both the data setup and the UI verification
- **Atomicity**: the setup and tests evolve together — changing what's logged and what's asserted happens in the same commit
- **Shared imports**: common SDK patterns in `shared-sdk/helpers.py`, not duplicated

## Parallel Execution

- **Isolation**: unique UUID-stamped project per test folder (no shared state)
- **`fullyParallel: true`** in Playwright config
- **Workers**: CPU count (default), each folder gets its own worker
- **Within a folder**: serial (shared SDK data)
- **Across folders**: fully parallel

### Grouping Strategy

Tests that need the same SDK setup share a folder. A folder's `setup.py` creates all the data needed by every `.spec.ts` in that folder.

## Dual-Target Config

```typescript
// playwright.config.ts
projects: [
  {
    name: 'bandw',
    use: { baseURL: 'http://localhost:5173' },
    // env: WANDB_BASE_URL=http://localhost:8081, WANDB_API_KEY=<dev-key>
  },
  {
    name: 'wandb',
    use: { baseURL: 'https://wandb.ai' },
    // env: WANDB_BASE_URL=https://api.wandb.ai, WANDB_API_KEY=<from-env>
  },
]
```

**Commands:**
- `npx playwright test --project=bandw` — local dev (default)
- `npx playwright test --project=wandb` — conformance against real W&B
- `npx playwright test` — both targets

### Dual-Target Requirements

Every spec and page object must work against both targets without depending on one frontend's DOM structure or auth implementation.

- **Auth must be abstracted per target**:
  - `wandb`: authenticate with cookies / `storageState`
  - `bandw`: authenticate with local storage, session storage, or dev cookies as needed
- **SDK setup must stay target-aware**:
  - `WANDB_BASE_URL` must point the SDK at the active backend
  - the same setup script must be able to seed either target
- **URLs must be parameterized**:
  - tests must navigate through route helpers / page objects
  - do not hard-code W&B-only URL patterns inside specs
- **Selectors must be implementation-agnostic**:
  - no React-specific attributes
  - no Svelte-specific assumptions
  - no dependency on one target's current HTML layout
- **Reference-only artifacts from wandb.ai**:
  - HARs and screenshots from wandb.ai are reference fixtures
  - assertions must still be written against shared user-visible behavior

## Selector Strategy

**Allowed selector APIs only**:

1. `getByRole(...)`
2. `getByLabel(...)`
3. `getByText(...)`
4. `getByTestId(...)`
5. `getByPlaceholder(...)`

Use the most semantic option available. Prefer `getByRole()` first, then `getByLabel()` / `getByPlaceholder()` for form controls, then `getByText()` for stable visible copy, and `getByTestId()` only when the UI element has no stable semantic hook.

**Do not use**:

- CSS selectors
- XPath
- class names
- tag names
- DOM ancestry / descendant structure
- positional selectors such as "third button" or `nth()`
- framework-specific component names or implementation details
- canvas internals

For chart and canvas assertions:

- verify the surrounding semantic container with ARIA selectors
- use screenshot comparisons for visual behavior
- use panel / chart counts instead of querying inside the canvas

### ARIA Attributes Required in Svelte Components

| Component | Element | Change Needed |
|---|---|---|
| Runs table | `<table>` | `aria-label="Runs"` |
| Search inputs | `<input>` | `role="searchbox"` + `aria-label` |
| Run detail tabs | `<button>` | `role="tab"` + `aria-selected`, wrap in `role="tablist"` |
| Tab content | `<div>` | `role="tabpanel"` |
| Sidebar | `<aside>` | `aria-label="Runs sidebar"` |
| Chart canvases | `<canvas>` | `aria-label="{metric} chart"` |
| State badges | `<span>` | `role="status"` |
| Panel sections | `<section>` | `aria-label="{section name}"` |
| Filter button | `<button>` | `aria-label="Filter runs"` |
| Sort button | `<button>` | `aria-label="Sort runs"` |
| Group button | `<button>` | `aria-label="Group runs"` |
| Color dot | `<button>` | `aria-label="Change run color"` |
| Pin icon | `<button>` | `aria-label="Pin run"` / `aria-label="Unpin run"` |
| Baseline icon | `<button>` | `aria-label="Set as baseline"` |
| Panel edit | `<button>` | `aria-label="Edit panel"` |
| Panel actions | `<button>` | `aria-label="Panel actions"` |
| Section actions | `<button>` | `aria-label="Section actions"` |

## Network Recording & Diff Analysis

Every exploration session and every test run — against **both** targets — records all network traffic through a `network-recorder.ts` fixture. This is **always-on**, not opt-in. The recordings are not used as assertions; they are a corpus for offline analysis of how our backend / frontend differs from the real W&B.

### What gets recorded

The fixture uses `page.context().recordHar()` to capture **all** network requests (not just GraphQL) into HAR files:

```
snapshots/
  wandb/                          # Recorded against real wandb.ai
    track/config/                 # Mirrors test folder hierarchy
      requests.har
    app/panels/line-plot/
      requests.har
    ...
  bandw/                          # Recorded against our backend + frontend
    track/config/
      requests.har
    ...
```

### What gets captured per request

Each HAR entry includes:
- **URL + method** (e.g., `POST /graphql`, `POST /files/{entity}/{project}/{runId}/file_stream`)
- **Request body** — full GraphQL query text, variables, operation name; file stream payloads
- **Response body** — complete JSON response including all fields
- **Timing** — request duration, time-to-first-byte
- **Status code** — 200, 400, 404, etc.
- **Headers** — auth headers, content types, cache headers

### Fixture implementation (`network-recorder.ts`)

```typescript
import { test as base } from '@playwright/test';
import path from 'path';

export const test = base.extend<{}, { networkRecording: void }>({
  networkRecording: [async ({ browser }, use, workerInfo) => {
    // Worker-scoped: records HAR for the entire test file
    // HAR path derived from test file location in the tree
    // e.g., tests/track/config/ → snapshots/{target}/track/config/requests.har
    // ...
    await use();
  }, { scope: 'worker', auto: true }],
});
```

Key details:
- **Worker-scoped + auto**: attaches to every test file automatically, records once per file (not per test)
- **HAR path mirrors test path**: `tests/app/panels/line-plot/*.spec.ts` → `snapshots/{target}/app/panels/line-plot/requests.har`
- **Full capture is required**: do not narrow recording to `/graphql` or `/files/`; capture the complete request set for the workflow

### Offline diff analysis

The HAR files enable several analyses that are **not** part of test assertions but inform development:

1. **GraphQL query comparison** — extract all `operationName` values from wandb HAR, compare against bandw HAR to find:
   - Queries our frontend makes that our backend doesn't handle yet
   - Queries W&B makes that we haven't implemented
   - Response shape differences (missing fields, different nesting)

2. **REST endpoint comparison** — catalog all non-GraphQL endpoints hit (file_stream, file upload, etc.)

3. **Response field coverage** — for each GraphQL operation, diff the response fields present in wandb vs bandw to identify gaps

4. **Timing baseline** — compare request durations to identify performance gaps

5. **Error rate comparison** — identify requests that succeed against wandb but fail against bandw

6. **Exploration-to-test traceability** — keep the exploration HAR for each workflow so a spec can be traced back to the real requests and responses that informed it

A future `scripts/analyze-snapshots.py` script can automate these comparisons:
```bash
uv run python scripts/analyze-snapshots.py --wandb snapshots/wandb --bandw snapshots/bandw
```

### When to refresh recordings

- Run `npx playwright test --project=wandb` periodically (weekly or before major frontend work) to refresh the wandb baseline
- The wandb HAR files should be **committed to git** — they are reference artifacts, not transient test output
- The bandw HAR files can be `.gitignore`d (regenerated on every CI run) or committed for historical comparison

## Screenshot Strategy

- `page.screenshot()` at key assertion points
- Saved to `screenshots/{target}/{testFolder}/{stepName}.png`
- Chart content verified via screenshots (canvas has no queryable DOM)
- For structural assertions (e.g., "3 charts exist"), count `<canvas>` elements

## Implementation Phases

| Phase | Test Count | Plan Files | Priority |
|---|---|---|---|
| **A: Foundation** | 0 | 00-architecture | Setup |
| **B: Core** | 53 | 01, 09, 10, 13 | P0 |
| **C: Workspace & Panels** | 71 | 02-05, 07-08, 11-12, 18-19, 22 | P1 |
| **D: Advanced** | 76 | 06, 14-17, 20-21, 23-26 | P2 |
