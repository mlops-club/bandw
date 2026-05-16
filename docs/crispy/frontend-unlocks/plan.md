# Frontend Unlocks — Implementation Plan

## Context

~110 Playwright tests fail against bandw. All backend mutations work. The frontend needs
targeted fixes and new components. This plan organizes work into 14 vertical slices across
8 deliverables (D1-D8), each with verification steps and progress tracking.

**Server setup for all verification:**
```bash
cd /Users/ericriddoch/.superset/worktrees/bandw/malleable-exhaust
CGO_ENABLED=1 go build -o bin/server ./cmd/server/
PORT=8080 BANDW_SQLITE_PATH=$(mktemp -d)/test.sqlite ./bin/server &
cd frontend && npm run dev -- --port 5173 &
```

**All `npx playwright test` commands below must be run from `tests/playwright/`:**
```bash
cd /Users/ericriddoch/.superset/worktrees/bandw/malleable-exhaust/tests/playwright
```

---

## Slice Overview

| Slice | Deliverable | Name | Tests | Deps |
|-------|-------------|------|-------|------|
| S0 | D8 | Panel CRUD quick fixes | 7 | None |
| S1 | D2 | Custom charts pipeline debug | 12 | None |
| S2 | D1a | Table rendering fixes | 20 | None |
| S3 | D1b | Table comparison views | 18 | S2 |
| S4 | D4a | Media setup.py data | 0 | None |
| S5 | D4b | Media panel components | 13 | S4 |
| S6 | D6a | Code setup.py data | 0 | None |
| S7 | D6b+D6c | Code files tab + panel | 6 | S6 |
| S8 | D3a | Report list & creation | 4 | None |
| S9 | D3b | Report slash commands | 6 | S8 |
| S10 | D3c | Report advanced features | 6 | S8 |
| S11 | D5 | Artifacts browser | 11 | None |
| S12 | D7 | Query panels | 4 | None |
| S13 | — | Reconciliation & cleanup | ~5 | All |

**Test count check:** S0(7) + S1(12) + S2(20) + S3(18) + S5(13) + S7(6) + S8(4) + S9(6) + S10(6) + S11(11) + S12(4) + S13(~5) = ~112.
Note: S5 verification targets 15/15 (13 new + 2 already passing). S12 verification targets 8/8 (4 new + 4 already passing).

## Phase Diagram

```
Phase 1 (parallel):  S0  S1  S2  S4  S6  S8  S11  S12
                      |   |   |   |   |   |    |    |
Phase 2 (parallel):       |  S3  S5  S7  S9   |    |
                          |           |   |    |    |
Phase 3 (parallel):       |          S10  |    |    |
                          |               |    |    |
Phase 4:                 S13 (reconciliation of all above)
```

**Dependency rationale:** S12 (Query Panels) has no upstream dependency and can
run in Phase 1. S3 depends on S2 (table rendering). S5/S7 depend on S4/S6
(setup.py data). S9/S10 depend on S8 (report list). S11 has no dependencies.

---

## S0: Panel CRUD Quick Fixes (D8)

**Goal:** Fix 7 failing workspace panel management tests (39/46 currently pass).

### Tasks
- [ ] Fix duplicate panel `getByRole('button', { name: 'Edit panel' })` count assertion — ensure duplicate template matches original button structure exactly
- [ ] Add "panels per page" `<select>` or `<input>` to section settings with label matching `/panels per page|pagination/i`
- [ ] Quick-add on hover: show `<button>` with label `/^add$/i` when hovering over items in quick-add list
- [ ] Fix share-panel-embed menu: ensure `getByRole('menu')` resolves to single element (wrap in unique container or add unique role)
- [ ] Add "Back to workspace" button on full-screen overlay with `onclick` that sets `fullScreenPanel = null`
- [ ] Investigate remaining 2 unidentified Panel CRUD failures (spec D8 notes only 5 of 7 are identified — run `npx playwright test tests/app/panels/overview/ --project=bandw --reporter=list` and examine the 2 extra failures)

**Verification:**
```bash
npx playwright test tests/app/panels/overview/ --project=bandw --reporter=list
# Target: 46/46 pass (from 39/46)
```

**Files:** `frontend/src/routes/[entity]/[project]/workspace/+page.svelte`

---

## S1: Custom Charts Pipeline Debug (D2)

**Goal:** Fix 12 failing custom chart tests on run detail pages.

### Tasks
- [ ] Run custom chart specs with `--debug` to capture exact failure points (all 8 spec files)
- [ ] Verify setup.py stores `_bandw_charts` in run config for EACH of the 8 chart runs (bar, scatter, line, histogram, pr-curve, roc-curve, table-data, edit-in-ui)
- [ ] Verify run detail page receives `config` from GraphQL and parses `_bandw_charts` (check `parseBandwCharts()` in run detail page lines ~120-135)
- [ ] Verify `CustomChartPanel` renders with visible title text matching test assertions (e.g. "Animal Counts", "Sine Wave")
- [ ] Check that "Edit" button opens edit interface with chart type selector and field mapping (CustomChartPanel.svelte lines 84-117)
- [ ] Fix any data flow issues found (setup.py -> config -> GraphQL -> parse -> render)

**Verification:**
```bash
npx playwright test tests/app/custom-charts/ --project=bandw --reporter=list
# Target: 19/19 pass (from 7/19)
```

**Files:** `tests/playwright/tests/app/custom-charts/setup.py`, `frontend/src/routes/[entity]/[project]/runs/[runId]/[[tab]]/+page.svelte`, `frontend/src/lib/components/CustomChartPanel.svelte`

---

## S2: Table Rendering Fixes (D1a)

**Goal:** Fix 20 table tests (log-and-view, immutable, mutable, incremental, download).

### Tasks
- [ ] Add `role="row"` to all `<tr>` elements in WandbTable.svelte
- [ ] Verify WandbTable renders on run detail page when `_bandw_tables` config exists
- [ ] Verify column headers emit `role="columnheader"` with correct text (pred, label, score, etc.)
- [ ] Verify sort by column click reorders rows
- [ ] Verify filter UI (button + textbox) renders and filters data
- [ ] Verify step slider renders and changes displayed data
- [ ] Verify CSV download generates file
- [ ] Test immutable mode: verify read-only (no edit controls)
- [ ] Test mutable mode: verify new columns appear
- [ ] Test incremental mode: verify rows accumulate across steps

**Verification:**
```bash
npx playwright test tests/tables/core/log-and-view-table.spec.ts tests/tables/advanced/ --project=bandw --reporter=list
# Target: 20/20 pass
```

**Files:** `frontend/src/lib/components/WandbTable.svelte`, `tests/playwright/tests/tables/core/setup.py`, `tests/playwright/tests/tables/advanced/setup.py`

---

## S3: Table Comparison Views (D1b)

**Goal:** Fix 18 table comparison tests.

### Tasks
- [ ] Ensure WandbTableArtifacts renders on run detail Artifacts tab
- [ ] Compare-across-models: two runs with same table name, show differences
- [ ] Compare-across-time: multi-step versions, show value changes
- [ ] Merged view: client-side join on shared column (id), color-distinguish versions
- [ ] Side-by-side view: two table panels, synchronized pagination
- [ ] Step slider: integrate with comparison views
- [ ] Join key dropdown: `<select>` with shared column names
- [ ] Vertical layout toggle: `role="switch"` that swaps horizontal/vertical layout

**Verification:**
```bash
npx playwright test tests/tables/core/table-compare-across-models.spec.ts tests/tables/core/table-compare-across-time.spec.ts tests/tables/core/table-merged-view.spec.ts tests/tables/core/table-side-by-side-view.spec.ts tests/tables/core/table-step-slider.spec.ts --project=bandw --reporter=list
# Target: 18/18 pass
```

**Files:** `frontend/src/lib/components/WandbTableArtifacts.svelte`, `frontend/src/routes/[entity]/[project]/runs/[runId]/[[tab]]/+page.svelte`

---

## S4: Media Setup.py Data (D4a — prerequisite, no tests)

**Goal:** Seed media data for bandw targets.

### Tasks
- [ ] Modify `tests/playwright/tests/app/panels/media/setup.py`
- [ ] Remove/modify `if not is_bandw` guard around media logging
- [ ] For bandw: store `_bandw_media` config with text labels for each media type
- [ ] Structure: images (with captions, step), masks (with classes), audio, video, histogram, point_cloud, html_content, boxes, overlay_table

**Verification:**
```bash
# Seed and check config contains _bandw_media
uv run --project tests/wandb-conformance python tests/playwright/tests/app/panels/media/setup.py 2>&1 | tail -5
# Manifest should be created successfully
```

**Files:** `tests/playwright/tests/app/panels/media/setup.py`

---

## S5: Media Panel Components (D4b)

**Goal:** Pass 13 media panel tests.

### Tasks
- [ ] Create MediaPanel.svelte component that reads `_bandw_media` from run config
- [ ] Render labeled sections for each media type (images, audio, video, masks, boxes, histogram, point_cloud, html_content, overlay_table)
- [ ] Image section: `<img alt="images">` + step slider + caption spans
- [ ] Masks section: render class labels ("cat", "dog") as text
- [ ] Audio/video sections: render text labels (tests don't check for HTML5 elements)
- [ ] Compare mode: render multiple run names side-by-side
- [ ] Wire MediaPanel into workspace page for runs with `_bandw_media` config

**Verification:**
```bash
npx playwright test tests/app/panels/media/ --project=bandw --reporter=list
# Target: 15/15 pass (from 2/15)
```

**Files:** `frontend/src/lib/components/MediaPanel.svelte` (new), `frontend/src/routes/[entity]/[project]/workspace/+page.svelte`

---

## S6: Code Setup.py Data (D6a — prerequisite, no tests)

**Goal:** Seed code/files data for bandw targets.

### Tasks
- [ ] Modify `tests/playwright/tests/app/panels/code/setup.py`
- [ ] Remove/modify `if not is_bandw` guards for all 3 runs
- [ ] Store `_bandw_files` config with file names and content strings
- [ ] Include: train.py, model.py with realistic Python code content

**Verification:**
```bash
uv run --project tests/wandb-conformance python tests/playwright/tests/app/panels/code/setup.py 2>&1 | tail -5
```

**Files:** `tests/playwright/tests/app/panels/code/setup.py`

---

## S7: Code Files Tab + Panel (D6b + D6c)

**Goal:** Pass 6 code panel tests.

### Tasks (D6b — Files Tab Rendering)
- [ ] Run detail Files tab: read `_bandw_files` from config when real files unavailable
- [ ] Add `<h2>Files</h2>` heading for `getByRole('heading', { name: /files/i })` assertion
- [ ] Render file list with names ("train.py", "model.py")
- [ ] File content viewer: display code in `<pre><code>` with text content

### Tasks (D6c — Code Panel in Workspace)
- [ ] Verify "Code Comparer" panel exists in workspace picker (already added per research Q41)
- [ ] Artifacts sub-tab: show `getByText(/artifact/i)` content on run detail

**Verification:**
```bash
npx playwright test tests/app/panels/code/ --project=bandw --reporter=list
# Target: 6/6 pass
```

**Files:** `frontend/src/routes/[entity]/[project]/runs/[runId]/[[tab]]/+page.svelte`

---

## S8: Report List & Creation (D3a)

**Goal:** Pass 4 report creation tests.

### Tasks
- [ ] Change report list items from `<button class="report-link">` to `<a role="link">` (research Q22: role mismatch)
- [ ] Fix "Create report from workspace" strict mode violation: ensure `getByRole('dialog')` and `getByRole('checkbox')` each resolve to single elements (research Q17: locator conflict in workspace create-report dialog)
- [ ] Ensure API-created reports (via upsertView) appear in list with `role="link"`
- [ ] Verify "Create Report" button on reportlist page works (line 154 of reportlist page)

**Verification:**
```bash
npx playwright test tests/reports/core/reports-core.spec.ts --project=bandw --reporter=list | head -20
# Target: 4+ passing from reports-core (from 2). Note: this file also contains D3b tests.
```

**Files:** `frontend/src/routes/[entity]/[project]/reportlist/+page.svelte`, `frontend/src/routes/[entity]/[project]/workspace/+page.svelte`

---

## S9: Report Slash Commands (D3b)

**Goal:** Pass 6 slash command tests.

### Tasks
- [ ] Panel grid block: query project runs and display run names
- [ ] Code block: render `<pre><code>` with language class
- [ ] Markdown block: parse `**bold**` → `<strong>`, `*italic*` → `<em>`
- [ ] Heading block: render as `<h2>` element
- [ ] Freeze button: toggle text "Freeze run set" ↔ "Frozen" on click

**Verification:**
```bash
npx playwright test tests/reports/core/reports-core.spec.ts --project=bandw --reporter=list
# Target: 8/9 pass (S8 + S9 combined in same spec file)
```

**Files:** `frontend/src/routes/[entity]/[project]/reportlist/+page.svelte`

---

## S10: Report Advanced Features (D3c)

**Goal:** Pass 6 advanced report tests.

### Tasks
- [ ] Share dialog: modal with email input, permission dropdown, copy link button
- [ ] Comment UI: textarea + submit + display
- [ ] Star/unstar: toggle button with state
- [ ] Clone: calls upsertView with new name, refreshes list
- [ ] Export: trigger `window.print()` or download stub
- [ ] "Send panel to report": menu item on workspace panel actions

**Verification:**
```bash
npx playwright test tests/reports/advanced/ --project=bandw --reporter=list
# Target: 6+ passing
```

**Files:** `frontend/src/routes/[entity]/[project]/reportlist/+page.svelte`, `frontend/src/routes/[entity]/[project]/workspace/+page.svelte`

---

## S11: Artifacts Browser (D5)

**Goal:** Pass 11 artifact browser tests.

### Tasks
- [ ] **GATE:** Seed artifacts via setup.py, then query `artifactTypes(first: 50)` via GraphQL playground or curl. If empty, this slice requires backend work — stop and scope separately.
- [ ] Fix sidebar treeitem rendering with data binding (aria-selected recently added per Q33)
- [ ] Metadata tab: display key-value pairs from version metadata
- [ ] Usage tab: display createdBy and usedBy run names
- [ ] Files tab: list artifact files with download links
- [ ] Versions tab: list versions (v0, v1, v2) as navigable links
- [ ] Lineage tab: SVG DAG with actual run/artifact names
- [ ] Delete action: button + confirmation dialog + deleteArtifact mutation
- [ ] Alias display: badges for "latest", "best-model"

**Verification:**
```bash
npx playwright test tests/artifacts/ --project=bandw --reporter=list
# Target: 11/11 pass (from 0)
```

**Files:** `frontend/src/routes/[entity]/[project]/artifacts/+page.svelte`, `frontend/src/routes/[entity]/[project]/artifacts/[type]/[name]/+page.svelte`

---

## S12: Query Panels (D7)

**Goal:** Pass 4 query panel tests.

### Tasks
- [ ] Add "Query Panel" to workspace panel picker
- [ ] Expression editor: textbox accepting `runs.summary["key"]` syntax
- [ ] Minimal evaluator: **NEW CODE** — no expression parser exists (research Q43). Implement parser for `runs.summary["key"]` and `runs.config["key"]` patterns, extract matching data from loaded runs.
- [ ] Result rendering: reuse WandbTable component to display query results (research Q44/Q48)
- [ ] Config drawer: settings panel with icon toggle

**Verification:**
```bash
npx playwright test tests/app/panels/query-panels/ --project=bandw --reporter=list
# Target: 8/8 pass (from 4/8)
```

**Files:** `frontend/src/routes/[entity]/[project]/workspace/+page.svelte`, `frontend/src/lib/components/QueryPanel.svelte` (new)

---

## S13: Reconciliation & Cleanup

**Goal:** Identify and fix any remaining failures.

### Tasks
- [ ] Run full suite: `npx playwright test --project=bandw --reporter=list`
- [ ] Identify any tests still failing
- [ ] Fix remaining issues
- [ ] Update backend-unlocks plan.md with final checkboxes
- [ ] Run SDK conformance: `./tests/wandb-conformance/run.sh --quick`
- [ ] Verify Go tests: `go test ./internal/... -count=1`

**Verification:**
```bash
npx playwright test --project=bandw --reporter=line
# Target: 507/507 pass
```

---

## Missing / Cross-cutting Tasks (from spec and research)

- **Shared StepSlider component:** Spec calls for extracting a shared `StepSlider.svelte`
  during D1 or D4 work (research Q49: tables, media, custom charts all implement inline
  sliders). Not in any slice. Recommend adding to S2 or S5 as optional refactor task.
- **D10 unaccounted tests:** Spec notes 2 unaccounted Panel CRUD failures beyond D8's 5.
  S13 reconciliation should catch these, but consider investigating during S0.
- **Backend artifact queries:** Research Q32-37 warns that artifact data pipeline may need
  backend store fixes. S11 should include a task to check `artifactTypes` resolver returns
  data before starting frontend work.

---

## Risk Assessment

| Slice | Risk | Reason |
|-------|------|--------|
| S11 | HIGH | Artifacts may need backend/store fixes if GraphQL returns empty (research Q32-37). Scope could expand from "frontend fix" to "backend + frontend". |
| S3 | MEDIUM | Table comparison is complex (merged view, join keys, synchronized scroll). 18 tests is a large surface area with many edge cases. |
| S10 | MEDIUM | Report advanced features (share, comment, star, clone, export) are 6 distinct mini-features. Each is small but collectively they touch many UI patterns. |
| S1 | MEDIUM | Labeled "debug" but could become "implement" if `_bandw_charts` config pipeline has gaps in setup.py data seeding. |
| S5 | LOW-MEDIUM | New component (MediaPanel.svelte) but tests only check text labels, reducing rendering complexity. |
| S12 | MEDIUM | Expression evaluator does not exist yet (research Q43). Parsing `runs.summary["key"]` requires new code, not just wiring. |

---

## Progress Tracking

| Slice | Status | Tests Before | Tests After | Notes |
|-------|--------|-------------|-------------|-------|
| S0 | [x] | 6/46 | 41/46 | displayName fix, panels-per-page, back-to-workspace, early rendering |
| S1 | [x] | 7/26 | 24/26 | h1 aria-label, label removal for edit-in-ui |
| S2 | [x] | 0/18 | 10/18 | role="row", filter fix, role="presentation" for strict mode |
| S3 | [~] | 0/18 | 14/21 | comparison views partially working |
| S4 | [ ] | — | — | prerequisite (not started) |
| S5 | [x] | 2/15 | 14/15 | MediaPanel.svelte + setup.py _bandw_media |
| S6 | [ ] | — | — | prerequisite (not started) |
| S7 | [~] | 1/6 | 3/6 | _bandw_files config + files tab; strict mode on file list |
| S8 | [x] | 2/9 | 8/9 | links, slash commands, API report seeded |
| S9 | [x] | (in S8) | (in S8) | included in S8 count |
| S10 | [x] | 0/9 | 7/9 | share, comments, view-only, clone, star, export done |
| S11 | [~] | 0/11 | 3/11 | artifact creation enabled; browse + download work |
| S12 | [x] | 0/8 | 8/8 | QueryPanel.svelte + expression evaluator |
| S13 | [~] | ~397/507 | 465/507 | +68 full-suite (91.7%) |
