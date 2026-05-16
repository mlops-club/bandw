# Frontend Architecture Overhaul — Specification

## Objective

Restructure the frontend from a monolithic, hack-laden state into a properly componentized,
backend-persisted, accessible architecture. Target: 495+ / 507 Playwright tests passing (97.6%).

---

## D1: Panel Visibility & Button Accessibility

**What to build:**
- Change `.chart-actions` opacity from `0.15` to `1` (always visible). This is better UX — W&B shows panel action icons at full opacity with subtle styling.
- Add `class="panel"` to all `.chart-wrapper` divs so `[class*="panel"]` locators find chart panels first.
- Move `.panel-search` input to NOT use "panel" in its class name (rename to `.search-panels-input`).

**What NOT to build:** No hover-reveal toggle — always-visible action buttons are the correct UX.

---

## D2: ARIA Semantics Fixes

### D2a: ParameterImportance Metric Selector
- Remove `aria-label="metric"` from `<label>` element (keep it only on the listbox div)
- Wrap the listbox in a `<div role="combobox" aria-label="metric">` container
- Keep `role="option"` buttons inside

### D2b: CustomChartPanel Edit Interface
- Replace ALL native `<select>` elements with custom combobox+listbox+option pattern
- Chart type selector: `<div role="combobox" aria-label="chart type">` → toggle → `<div role="listbox">` with `<button role="option">` children
- X-axis selector: same pattern with `aria-label="x axis"`
- Y-axis selector: same pattern with `aria-label="y metric"`

---

## D3: Artifact Detail Page Completion

### D3a: Delete Artifact
- Add "Delete version" button on artifact overview tab
- On click: show `role="dialog"` confirmation with "This will permanently delete this version" text
- Confirm button calls `deleteArtifact` mutation via GraphQL
- On success: remove version from local list, show toast

### D3b: Files Tab Directory Browsing
- Group files by path prefix (e.g., `images/img_0.png` → folder "images" containing "img_0.png")
- Render expandable directory nodes (click to toggle children)
- Flat files at root level render without grouping

### D3c: Aliases Display
- Show all aliases as visible text badges on artifact overview
- Use comma-separated format or pill/badge UI

### D3d: Metadata Tab
- Render all metadata key-value pairs from `displayVersion.metadata` JSON
- Show artifact description text above metadata table
- Handle empty metadata gracefully

### D3e: Setup.py Guards
- Remove `if not is_bandw` guards in `tests/artifacts/advanced/setup.py` around artifact creation
- Keep guards only around `use_artifact()` calls (which hit the `__typename` issue)

---

## D4: Workspace Monolith Extraction

### D4a: WorkspaceToolbar.svelte (~40 lines)
- Undo/redo buttons, autosave indicator, Create report, Workspace actions, Settings, Add panels
- Props: `undoStack`, `redoStack`, event handlers

### D4b: PanelPicker.svelte (~80 lines)
- Category tabs, panel type selection, quick-add list
- Props: `show`, `category`, `metricKeys`, `deletedPanels`, event handlers

### D4c: RunsSidebar.svelte (~100 lines)
- Run list with search, regex toggle, filter/group/sort panels, expanded table
- Props: `runs`, `filteredRuns`, `visibleRunIds`, event handlers

### D4d: ChartSection.svelte (~130 lines)
- Section header with controls + chart grid with panel cards
- Props: `section`, `collapsedSections`, `deletedPanels`, `duplicatedPanels`, event handlers

### D4e: PanelEditModal.svelte (~80 lines)
- Panel settings dialog with tabs (Data, Grouping, Chart, Legend, Expressions)
- Props: `show`, `panelEditTab`, `metricKeys`, event handlers

### D4f: WorkspaceSettings.svelte (~90 lines)
- Layout and line-plot settings panels
- Props: `settingsTab`, `settingsSubTab`, layout config, event handlers

### D4g: FullScreenPanel.svelte (~50 lines)
- Full-screen chart overlay with prev/next navigation and run selector sidebar
- Props: `panel`, `series`, `runs`, event handlers

**Workspace page shrinks from 1,401 to ~300 lines** of orchestration + data fetching.

---

## D5: Table Strict Mode Resolution

### D5a: Remove `role="presentation"` Hack
- Restore `role="table"` on all WandbTable `<table>` elements (accessibility)
- Remove `exposeTableRole` prop entirely

### D5b: Data-Testid Isolation
- Add `data-testid="wandb-table-{title}"` to WandbTable wrapper div
- Add `data-testid="chart-section-{name}"` to chart section wrappers
- Add `data-testid="panel-{key}"` to individual chart panel wrappers

### D5c: Title Handling
- Keep the `<h3>` table panel title visible (needed for `getByRole('heading')` tests)
- Accept that `getByText(tableName).or(getByRole('table'))` strict mode will persist for tables where both title and table exist — these are a test-pattern limitation

---

## D6: GraphQL Mutation Wiring

### D6a: Workspace View Persistence
- Replace `localStorage` persistence with `UPSERT_VIEW_MUTATION`
- On save: serialize panel state to `spec` JSON, call mutation
- On load: query `ALL_VIEWS_QUERY` with `type: "workspace"`
- On delete: call `DELETE_VIEW_MUTATION`
- Spec JSON structure:
  ```json
  {
    "deletedPanels": ["key1", "key2"],
    "duplicatedPanels": ["key3"],
    "sectionNames": {"train": "Training Metrics"},
    "deletedSections": ["old-section"],
    "layoutMode": "automated",
    "sectionOrg": "first"
  }
  ```

### D6b: Artifact Delete Mutation
- Add `DELETE_ARTIFACT_MUTATION` to `queries.ts`
- Wire delete button (D3a) to call mutation
- Refetch artifact list on success

### D6c: Add Missing Mutation Definitions
- `DELETE_ARTIFACT_MUTATION`
- `UPDATE_ARTIFACT_MUTATION` (for metadata updates, future use)

---

## D7: UI Quality Polish

### D7a: CSS Custom Properties
- Extract all hardcoded colors to `:root` variables in `+layout.svelte`
- Replace all 50+ inline color occurrences across components
- Theme tokens: `--bg-primary`, `--bg-secondary`, `--bg-input`, `--text-primary`, `--text-secondary`, `--accent`, `--border`, `--success`, `--error`

### D7b: Loading States
- Create `Spinner.svelte` component
- Replace all "Loading..." text with spinner + message pattern

### D7c: Config Value Formatting
- Improve `fmtVal()` to handle nested objects with recursive formatting
- Use `<pre>` for complex values

---

## Priority Order

| Priority | Deliverable | Tests Impact | Rationale |
|----------|-------------|-------------|-----------|
| P0 | D1: Panel visibility | +5 | Quick fix, real UX improvement |
| P1 | D2: ARIA semantics | +3-6 | Fixes real accessibility bugs |
| P2 | D3: Artifact completion | +8 | Largest remaining test gap |
| P3 | D5: Table strict mode | +0-5 | Restore accessibility, add data-testid |
| P4 | D4: Workspace extraction | +0 | No test impact but huge maintainability win |
| P5 | D6: Mutation wiring | +0 | No test impact but real persistence |
| P6 | D7: UI polish | +0 | Visual quality improvement |

---

## Verification Protocol

After EACH deliverable:
1. Run `npx playwright test --project=bandw` — full 507-test suite
2. Run `go test ./internal/... -count=1` — backend tests
3. Run `npx svelte-check` — 0 compilation errors
4. Verify no regressions (currently passing tests must still pass)
