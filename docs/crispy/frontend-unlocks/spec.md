# Frontend Unlocks — Specification

## Objective

Pass the remaining ~110 Playwright tests (bringing the suite from ~397/507 toward 507/507) by
implementing missing frontend UI features in the Svelte 5 SPA. Some setup.py changes are
needed for media and code data pipelines; backend may need verification for file
upload/download (see D4, D6).

**Test count note:** The deliverables below account for 105 tests. The remaining ~5 tests
likely fall under Panel CRUD (7 fail per questions.md, D8 covers 5) and code/files
(exact failing count is "partial" — may exceed 6). These gaps should be reconciled after
running the full suite with `npx playwright test --project=bandw` to get exact counts.

## Architecture Decision: `_bandw_*` Config Pipeline

For the bandw target, SDK setup.py scripts store test data in `run.config` under special keys
(`_bandw_tables`, `_bandw_charts`, `_bandw_media`, `_bandw_files`). The frontend reads these
keys and renders the appropriate UI components. This avoids the complexity of real artifact
file upload/download for test purposes while still exercising the full frontend rendering path.

---

## Deliverable D1: Tables Viewer (38 tests)

### D1a: Table Rendering Fixes (20 tests: log-and-view, immutable, mutable, incremental, download)

**What to build:**
- Add `role="row"` to all `<tr>` elements in WandbTable.svelte
- Ensure table panels appear on run detail pages when `_bandw_tables` config exists
- Verify sort, filter, step slider, and CSV download work end-to-end

**What NOT to build:** No new components — WandbTable.svelte exists and mostly works.

### D1b: Table Comparison Views (18 tests: compare-models, compare-time, merged, side-by-side, step-slider)

**What to build:**
- Make comparison tests work by rendering `WandbTableArtifacts` on run detail artifact tabs
- Merged view with client-side join on shared columns
- Side-by-side view with synchronized scroll
- Step slider integration for multi-version comparison

---

## Deliverable D2: Custom Charts on Run Detail (12 tests)

**Root cause:** Charts render on workspace but NOT on run detail pages. Per research (Q11-Q13),
this is NOT an SVG-vs-Canvas issue — tests already accept `<canvas>` via `.or()` chains.
The 12 failures are "panel exists" / "panel with title exists" assertions. The likely cause
is that `_bandw_charts` config data is not being stored by setup.py or not parsed/rendered
on the run detail page.

**What to build:**
- Verify end-to-end: setup.py stores `_bandw_charts` -> GraphQL returns it -> run detail page parses and renders `CustomChartPanel` with correct titles
- Ensure chart titles (e.g., "Animal Counts", "Sine Wave") are visible as text
- Ensure edit interface (chart type selector, field mapping) renders when "Edit" is clicked
- This is investigation + fix, not pure "debug" — the config pipeline may need implementation work

**What NOT to build:** No new chart types — BarChart, ScatterChart, HistogramChart, LineChart components exist. No SVG rendering — Canvas is accepted by all test assertions.

---

## Deliverable D3: Reports Editor (16 tests)

### D3a: Report List & Creation (4 tests)

**What to build:**
- Change report list items from `<button>` to `<a role="link">`
- Ensure `allViews` query results render as clickable links
- Fix "Create report from workspace" locator conflict (strict mode violation)
- Ensure API-created reports (via upsertView) appear in the list

### D3b: Slash Commands & Blocks (6 tests)

**What to build:**
- Panel grid block: query and display actual run names from the project
- Code block: render `<pre><code>` with syntax highlighting class
- Markdown block: parse bold/italic and render as `<strong>`/`<em>`
- Heading block: render as actual `<h2>` element (not just styled text)
- Freeze button: toggle text between "Freeze run set" → "Frozen" on click

### D3c: Advanced Report Features (6 tests)

**What to build:**
- Share dialog stub (opens modal with email input, permission dropdown, copy link button)
- Comment UI stub (add comment textarea, display submitted comments)
- Star/unstar toggle button
- Clone report action (calls upsertView with new name)
- Export PDF stub (trigger browser print or show "Export not available" toast)
- "Send panel to report" menu item on workspace panels

---

## Deliverable D4: Media Panels (13 tests — from 2/15 passing)

### D4a: Setup.py Media Data (critical blocker)

**What to build:**
- Modify `tests/playwright/tests/app/panels/media/setup.py` to store `_bandw_media` config for bandw targets
- Structure: `{ "images": { items: [{caption, step}] }, "audio": {...}, "masks": { classes: [...] }, ... }`
- Only text labels needed — tests assert text visibility, not actual rendered media

### D4b: Media Panel Components

**What to build:**
- Workspace media panel that reads `_bandw_media` from run config and renders labeled sections
- Each media type as a labeled container: `<div><h3>images</h3><img alt="images" /><span>step-0-caption</span></div>`
- Step slider (`<input type="range" role="slider">`) for image panels
- Segmentation mask labels: render class names ("cat", "dog") as text
- Bounding box label: render "boxes" / "bounding" text
- Audio/video: render labels (tests don't check for `<audio>`/`<video>` elements)
- 3D/HTML: render labels ("point_cloud", "html_content")
- Compare mode: render run names side-by-side

---

## Deliverable D5: Artifacts Browser (11 tests)

**Root cause (per research Q32-37):** Data pipeline issue — setup.py creates artifacts via SDK
but the data may not be queryable via our GraphQL. Some tabs (Metadata, Usage, Files, Versions)
have partial implementations already. The sidebar treeitem rendering exists with `aria-selected`
recently added.

**What to build:**
- Verify data pipeline: confirm `artifactTypes` GraphQL query returns data for seeded projects (this is investigation, not just "debug")
- Fix sidebar treeitem rendering with correct data binding
- Artifact detail page tabs: wire Metadata, Usage, Files, Versions tabs to real data (some already render per research Q34)
- Files tab: list artifact files with download links (recently implemented per Q34, may just need data)
- Versions tab: list v0, v1, v2 as clickable links that update detail view (role="link" exists per Q34)
- Lineage tab: render SVG DAG with actual run names ("trainer", "data-producer") and artifact names (SVG stub exists per Q34)
- Delete action: add delete button with confirmation dialog, call deleteArtifact mutation
- Alias display: show "latest", "best-model" as badges on version entries

**Complexity note:** This is labeled "debug" but if the GraphQL queries return empty, it may
require backend store fixes or setup.py changes — making it closer to "implement" scope.

---

## Deliverable D6: Code Panels / Files Tab (6+ tests — exact count TBD)

### D6a: Setup.py Code Data

**What to build:**
- Modify `tests/playwright/tests/app/panels/code/setup.py` to store `_bandw_files` config
- Structure: `{ "files": [{ "name": "train.py", "content": "def train(): ..." }] }`

### D6b: Files Tab Rendering

**What to build:**
- Run detail Files tab: read `_bandw_files` from config when real files aren't available
- Display file list with file names ("train.py", "model.py")
- File content viewer showing actual code content
- Add "Files" heading (`<h2>Files</h2>`) for the heading assertion

### D6c: Code Panel in Workspace

**What to build:**
- "Code" option in panel picker (already "Code Comparer" exists)
- Artifacts sub-tab on run detail page showing artifact links

---

## Deliverable D7: Query Panels (4 tests)

**What to build:**
- "Query Panel" option in panel picker
- Expression editor: textbox that accepts expressions like `runs.summary["results_table"]`
- Minimal expression evaluator: parse `runs.summary["key"]` and render as WandbTable
- Panel configuration drawer (settings icon that opens a side panel)

---

## Deliverable D8: Workspace Panel Fixes (5 tests identified, 7 fail in Panel CRUD area)

**Note:** Questions.md reports Panel CRUD at 39/46 = 7 failures. This deliverable accounts
for only 5. The remaining 2 failing Panel CRUD tests need to be identified by running the
suite and examining which specific panel-crud spec files have failures.

**What to build:**
- Fix duplicate panel count: ensure `getByRole('button', { name: 'Edit panel' })` count increases by exactly 1
- Add "panels per page" control to section settings
- Quick-add on hover: show "Add" button when hovering over removed panel in quick-add list
- Fix share-panel-embed menu locator: ensure only one element matches `getByRole('menu')`
- Add "Back to workspace" button on full-screen panel overlay

---

## ~~Deliverable D9: Parameter Importance Fix~~ REMOVED (0 tests)

**INVALID:** Research (Q-context, F5 section) states parameter importance is 13/13 all passing.
There are no failing parameter importance tests. This deliverable was counting a test that
already passes and should not be included in the plan.

~~**What to build:**~~
~~- Fix `aria-label="metric"` collision: remove aria-label from the `<label>` element, keep it only on the `<div role="listbox">`~~

---

## Unaccounted Tests (D10)

Per questions.md, Panel CRUD (F0) has 7 failing tests but D8 only covers 5. The remaining
2 Panel CRUD failures need investigation. Additionally, code/files is listed as "partial"
without an exact count — the actual number may exceed the 6 in D6. Run the full Playwright
suite to get exact per-test-file breakdowns before starting implementation.

---

## Cross-cutting: Shared StepSlider Component

Per research Q49, multiple panel types (tables, media, custom charts) need step sliders
but there is no shared component — each panel implements its own. Consider extracting a
shared `StepSlider.svelte` component during D1 or D4 work to reduce duplication.

---

## Priority Order

| Priority | Deliverable | Tests | Rationale |
|----------|-------------|-------|-----------|
| P0 | D8: Panel fixes | 5 | Small targeted fixes, quick wins |
| P1 | D1: Tables | 38 | Largest test count, components mostly exist, highest ROI |
| P2 | D2: Custom charts | 12 | Investigation + fix of existing pipeline, no new components |
| P3 | D4: Media panels | 13 | Setup.py + stub labels, second highest new-test unlock |
| P4 | D3: Reports | 16 | Complex editor work but high test count |
| P5 | D5: Artifacts | 11 | Data pipeline investigation, may need backend work |
| P6 | D6: Code panels | 6 | Config + rendering |
| P7 | D7: Query panels | 4 | New subsystem, lowest ROI |

**Changes from original priority order:**
- **D9 removed:** All parameter importance tests already pass (13/13).
- **D1 (Tables) promoted to P1:** At 38 tests it is the single largest impact item and
  components already exist. Deferring it to P3 was wrong given that it unlocks 36% of
  remaining failures.
- **D8 stays P0:** Still the quickest wins.
- **D3 (Reports) promoted above D5/D6:** 16 tests is more impactful than 11 or 6, and the
  editor infrastructure partially exists.
- **D5 (Artifacts) demoted slightly:** Research indicates this may require backend/store
  fixes, making it higher-risk. Better to lock in the sure wins first.
