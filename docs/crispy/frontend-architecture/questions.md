# Frontend Architecture Overhaul — Research Questions

## Context

The Playwright suite is at 465/507 (91.7%, +68 from ~397 baseline). The remaining 42 failures
are not random bugs — they cluster around structural frontend problems:

- **Workspace monolith**: 1,401 lines, ~60 `$state` variables, no component extraction
- **Sparse mutations**: Only 2 GraphQL mutations (UPSERT_VIEW, DELETE_VIEW); workspace views persist to localStorage only
- **Strict mode collisions**: Playwright `.or()` locators match multiple visible elements because page-chrome text (h1, breadcrumbs, labels) overlaps with component text (chart titles, table data)
- **Invisible panel buttons**: `opacity: 0.15` on action buttons fails Playwright actionability
- **Fragile CSS tricks**: Run detail h1 uses `::after` pseudo-element instead of real text

The user wants proper architectural fixes (not more hacks), improved UI quality,
and real backend persistence via GraphQL mutations.

---

## 1. Workspace Monolith Decomposition

### State management
1. The workspace page has ~60 `$state` variables (lines 29-178). Which of these are truly page-level state vs. which should be component-local state? For example, should `showPanelMenu`, `showPanelEdit`, `panelEditTab` live in a `ChartSection` component instead?
2. The undo/redo stack (lines 192-233) tracks section and panel deletions. If we extract components, how should undo/redo work across component boundaries? Should there be a shared store or context?
3. The `savedViews` state uses `localStorage` (line 180). What GraphQL queries/mutations already exist for workspace views? Can we use `UPSERT_VIEW_MUTATION` with `type: "workspace"` to persist panel layout?

### Component boundaries
4. What are the natural component boundaries? The plan proposes 7 extracted components. Are there dependencies between them that would make extraction harder (e.g., does the PanelPicker need access to `allMetricKeys` which is derived from chart data)?
5. The chart sections render both original panels and duplicated panels (lines 880-940). How should a `ChartSection` component handle the `duplicatedPanels` array — should it be a prop or should duplication be managed at the page level?
6. The fullscreen overlay (lines 1048-1069) references `fullScreenSeries` and `runs`. Should this be a standalone `FullScreenPanel.svelte` component with props, or does it need too much shared state?

---

## 2. Playwright Strict Mode Resolution

### The `.or()` problem
7. Playwright's `.or()` creates a union of all matching elements. If both sub-locators each match a visible element, strict mode fails. What is the COMPLETE list of `.or()` patterns used in failing tests? (Need to grep all test files for `.or(` patterns that are in failing tests.)
8. For each collision pattern, what are the conflicting elements? The known patterns are:
   - h1 run name vs chart title (e.g., "custom-pr-curve" h1 vs "pr-curve" chart title)
   - Table h3 title vs `<table>` element
   - Label text vs input element (e.g., "Query" label vs "query" textbox)
   - Multiple data cells matching (e.g., "cat" and "dog" both visible)
9. Which of these can be fixed by removing redundant visible text (labels, duplicate headings) vs. which require structural DOM changes (data-testid scoping, shadow DOM)?

### The `opacity` problem
10. Panel action buttons use `opacity: 0.15` (workspace line 1204). Playwright considers elements with opacity < some threshold as non-actionable. What opacity value does Playwright require for clickability? Is `opacity: 1` (always visible) acceptable UX, or should we use a different visibility approach (e.g., `visibility: hidden` + `:hover` → `visibility: visible`)?
11. The send-panel-to-report test uses `locator('[class*="panel"]').first()` which matches `.panel-search` before any chart panel. What DOM elements have "panel" in their class name, and what order do they appear in?

---

## 3. Component Semantics (ARIA Roles)

### Parameter Importance
12. The ParameterImportance component uses `role="listbox"` with `role="option"` buttons. The test expects `role="combobox"`. What is the correct ARIA pattern for a metric selector — combobox (collapsed dropdown) or listbox (always-visible list)? The test does `getByRole('combobox', { name: /metric/i })` — does this work with a listbox?
13. The metric selector has `aria-label="metric"` on BOTH the `<label>` element AND the `<div role="listbox">`. Does this cause a Playwright strict mode violation when `getByLabel(/metric/i)` is used?

### Custom Chart Edit Interface
14. The edit interface uses native `<select>` elements. Playwright's `getByRole('option')` does NOT match `<option>` inside native `<select>`. What ARIA pattern should replace native selects — custom combobox+listbox, or can we use `selectOption()` instead? (We can't change the tests.)
15. The test at line 60 does `getByRole('combobox', { name: /x/i }).or(getByLabel(/x.axis/i))` then clicks, then expects `getByRole('option')`. Can a custom combobox with `role="option"` buttons satisfy this?

---

## 4. Artifact Detail Page

### Backend capabilities
16. What GraphQL mutations already exist for artifacts? The backend has resolvers for `deleteArtifact`, `updateArtifact`, `deleteArtifactSequence` — are these wired to the schema and tested?
17. The artifact `use_artifact` call fails for bandw because `ArtifactCollection.__typename` returns "ArtifactCollection" instead of "ArtifactSequence". What is the correct fix — make `ArtifactCollection` a GraphQL interface, or rename the type?
18. Does the `files` connection on `Artifact` actually return file data? The Files tab renders `displayVersion?.files?.edges` — are these populated by the backend?

### Frontend gaps
19. The artifact detail page (270 lines) is missing: directory browsing in Files tab, delete button + confirmation dialog, metadata display when no metadata exists. What is the complete list of UI elements the tests expect that don't exist?
20. The version navigation currently switches to the overview tab on click (line 175: `activeTab = 'overview'`). The test expects to stay on the versions tab after clicking a version. Should clicking a version just update `selectedVersion` without changing `activeTab`?

---

## 5. GraphQL Mutation Wiring

### Existing mutations
21. The `UPSERT_VIEW_MUTATION` takes `UpsertViewInput` with fields `entityName, projectName, displayName, type, spec`. Can the `spec` field store arbitrary JSON (panel layout, section config, etc.) for workspace state persistence?
22. The `DELETE_VIEW_MUTATION` takes `DeleteViewInput` with field `id`. Is the view ID available after creation from `upsertView`?
23. Are there any rate limits or size limits on the `spec` field that would constrain workspace state persistence?

### Missing mutations
24. What mutations are needed for artifact operations? The backend schema defines `deleteArtifact(input: DeleteArtifactInput!)` — what fields does `DeleteArtifactInput` require?
25. The workspace panel state (deleted panels, duplicated panels, section ordering) is currently in-memory. Should this persist as part of the view spec JSON, or as separate mutations?

---

## 6. UI Quality

### Current state
26. The workspace uses hardcoded dark-theme colors (e.g., `#16213e`, `#1e2d4a`, `#0d1117`). Are these defined as CSS custom properties anywhere, or inline in each component?
27. The loading states show plain `<p class="loading">Loading...</p>` text. What loading patterns does the codebase use — are there any skeleton components or spinner components?
28. The run detail page shows raw JSON for config values (`fmtVal` function, line 303). Is there a better way to format nested objects and arrays?

### Responsive design
29. The workspace uses `grid-template-columns: repeat(auto-fill, minmax(400px, 1fr))` for charts. Does this work on mobile viewports? Do any tests run with non-default viewport sizes?
30. The sidebar uses fixed `width: 260px`. Should it collapse on narrow viewports?

---

## 7. Test Infrastructure

### Verification strategy
31. After component extraction (Phase 4), how do we verify no behavioral regressions? Should we run the full 507-test suite after each extraction, or can we run per-slice subsets?
32. The Playwright config has `timeout: 15_000` for bandw tests. Some artifact tests timeout at 15.3s — is the timeout too aggressive, or are the pages genuinely slow?
33. The setup.py scripts use `if not is_bandw` guards around artifact creation. After removing these guards, does the SDK's `log_artifact()` work correctly against our backend for ALL artifact types (dataset, model, etc.)?

### Regression safety
34. The `role="presentation"` hack on WandbTable (line 141) hides the table from screen readers. Is there a better approach that maintains accessibility while avoiding strict mode collisions?
35. The run detail h1 uses `::after` to render text. If we revert to real text, which tests will regress? (Need to run the specific PR/ROC/edit-in-ui tests with real h1 text to identify.)
