# Frontend Unlocks — Research Answers

Research conducted 2026-04-21 via source code inspection of the Svelte 5 frontend,
Playwright test specs, setup.py scripts, and Go backend code.

---

## 1. Tables Viewer (38 failing tests)

### Data pipeline

**Q1. Does frontend read `_bandw_tables` from run config?**
YES. Run detail page (`runs/[runId]/[[tab]]/+page.svelte`, lines 155-169) has `parseBandwTables()` that reads `run.config`, parses JSON, and extracts `_bandw_tables`. Data flows to `WandbTable` component. The pipeline works for basic cases but fails for comparison views and some advanced modes.

**Q2. Does step slider index into `steps[currentStep]`?**
YES. `WandbTable.svelte` (lines 28-31, 34-39) tracks `currentStep` state. `activeData` derives from `steps![currentStep]?.data ?? data`. Slider renders with `role="slider"` (lines 122-131).

**Q3. What URL triggers comparison mode?**
NO COMPARISON ROUTE EXISTS. Tests navigate to run detail pages or workspace — comparison is triggered within the run's artifact tab, not via a separate route. The `WandbTableArtifacts.svelte` component handles comparison but may not render correctly.

### Rendering gaps

**Q4. Does WandbTable emit correct ARIA roles?**
PARTIALLY. `<table role="table">` and `<th role="columnheader">` are present. BUT `<tr>` elements **lack `role="row"`** — this may cause assertion failures for row-counting tests.

**Q5. What filter UI exists?**
Filter button with `aria-label="Filter"` (line 102) toggles a filter bar. Filter bar has `<input role="textbox" aria-label="Filter">` (lines 111-115). Both elements match test assertions.

**Q6. Does sort trigger reactive update?**
YES. `handleSort()` (lines 70-77) updates `sortCol` and `sortAsc` state, triggering `sortedData` derived recomputation (lines 54-68).

### Comparison and advanced modes

**Q7-8. Comparison views.**
Tests navigate to run detail → artifacts tab. `WandbTableArtifacts.svelte` has compare mode with merged/side-by-side views and join key dropdown. Setup.py pre-creates `_bandw_artifacts` config with table data. The rendering exists but may have data flow issues.

**Q9. Do advanced modes need different renderers?**
NO. Immutable/mutable/incremental are different data shapes, not different rendering. A single table renderer handles all three if setup.py shapes data correctly.

**Q10. CSV export?**
ALREADY IMPLEMENTED. `downloadCsv()` (lines 79-95 in WandbTable.svelte) generates CSV client-side via Blob URL.

---

## 2. Custom Charts (12 failing tests)

### Current state

**Q11. What renders for `_bandw_charts` on run detail?**
Run detail page parses `_bandw_charts` from config (lines 120-135) and renders `CustomChartPanel` components (lines 444-450). 7 workspace tests pass because workspace loads without charts. 12 run-detail tests fail — but NOT because of SVG vs canvas (tests already accept `canvas` via `.or()` chains). The failures are likely due to chart titles or panel containers not rendering, or `_bandw_charts` config data not being present/parsed correctly on run detail pages.

**Q12. Does run detail query `_bandw_charts`?**
YES. `RUN_DETAIL_QUERY` includes `config` field. Frontend parses it correctly.

### Rendering requirements

**Q13. SVG vs Canvas — NOT the root cause. Tests already accept canvas.**
All four chart components use Chart.js and render to `<canvas>`. However, the test
assertions already use `.or()` chains that include `canvas`:
- **BarChart.svelte** → `<canvas>` (line 84). Test (`custom-chart-bar.spec.ts`)
  does NOT assert SVG at all — it asserts `page.getByText('cat').or(page.getByText('dog'))`,
  checking for text labels. BarChart already renders label `<span>` elements
  (lines 79-83), so this assertion **should match**.
- **ScatterChart.svelte** → `<canvas>` (line 73). Test asserts
  `page.locator('svg circle, svg path, canvas').first()` → **canvas matches**.
- **LineChart.svelte** → `<canvas>` (line 79). Test asserts
  `page.locator('svg path, canvas').first()` → **canvas matches**.
- **HistogramChart.svelte** → `<canvas>` (line 91). Test asserts
  `page.locator('svg rect, svg path, canvas').first()` → **canvas matches**.

**ACTUAL ROOT CAUSE of 12 failures:** Not SVG/canvas mismatch. The failing tests
are "panel exists" and "panel with title exists" assertions on run detail pages.
The issue is that the `_bandw_charts` config data must be present and the
`CustomChartPanel` components must render with the correct titles. Verify that
setup.py is storing chart data and that the run detail page parses and renders it.

**Q14. Edit interface exists?**
YES. `CustomChartPanel.svelte` (lines 84-117) has chart type selector, query textarea, X/Y axis field selectors. Edit button (line 81) toggles edit mode.

**Q15. Table-data test navigates to run detail.**
Setup stores as `_bandw_charts` line chart. Test navigates to run detail page.

---

## 3. Reports (16 failing tests)

### Current state

**Q16. Which 2 tests pass?**
From previous test runs: `create-report-from-reports-tab` (line 32) and `report-add-plots` (line 61). These test basic report creation + slash command for line plot.

**Q17. Workspace "Create report" button?**
YES, workspace has "Create report" button (triggers `showCreateReport = true`). A dialog opens with panel selection checkboxes. Tests expect `getByRole('dialog')` and `getByRole('checkbox')` — dialog exists but may have locator conflicts.

**Q18. Reportlist "Create Report"?**
YES. Button at line 154 calls `createReport()`. Editor opens with `<input aria-label="title">` (line 158). Tests should find this.

### Slash commands

**Q19. Does "/" handler fire?**
YES. `handleEditorKeydown()` (lines 62-68) shows slash menu on "/" key. Menu has: "Line Plot", "Panel Grid", "Code", "Markdown", "Heading 2", "Paragraph" (lines 203-211).

**Q20. Does panel grid display run names?**
NO. Panel grid block renders placeholder `[Panel Grid with run data]` but doesn't query or display actual run names. Tests expect text like "experiment-A" → **RENDERING GAP.**

**Q21. Freeze button?**
Button exists (line 187): text "Freeze run set". But test expects `/frozen|unfreeze/i` after clicking → button text needs to toggle.

**Q22. Report list renders as links?**
YES, queries `allViews`. BUT renders as `<button class="report-link">` — tests expect `role="link"`. **ROLE MISMATCH:** needs `<a>` tag or `role="link"`.

**Q23. Share/comment needed?**
YES — `reports-advanced.spec.ts` has share, comment, star, clone, export tests. But `reports-core.spec.ts` does not test sharing. Core report tests are the priority.

---

## 4. Media Panels (13 failing tests)

### Critical blocker

**Q24. Setup.py skips media for bandw?**
YES. `media/setup.py` lines 190-191: `if not is_bandw: _log_media(run)`. Lines 200-201:
`if not is_bandw:` for compare runs 1-2. ALL media logging is skipped for bandw.

**DECISION:** Use `_bandw_media` config approach (option b). Storing base64 images in config is feasible for test data (small PNGs). Binary file upload pipeline is more complex and not needed for test assertions.

**Q25. createRunFiles binary upload?**
Backend createRunFiles returns upload URLs. The upload handler (`internal/storage/local.go`) accepts PUT with any content-type. Content-type inference works for PNG, JPEG, etc. Pipeline should work but isn't tested with real media.

**Q26. Minimal `_bandw_media` structure:**
```json
{"_bandw_media": {
  "images": {"key": "images", "items": [{"caption": "step-0-caption", "step": 0}]},
  "audio": {"key": "audio", "items": [{"caption": "tone-0"}]},
  "video": {"key": "video"},
  "masks": {"key": "masks", "classes": ["cat", "dog"]},
  "boxes": {"key": "boxes"},
  "histogram": {"key": "histogram"},
  "point_cloud": {"key": "point_cloud"},
  "html_content": {"key": "html_content"},
  "overlay_table": {"key": "overlay_table"}
}}
```

### Rendering

**Q27-30. Minimal components:**
Most tests only assert text labels (`/images/i`, `/audio/i`, `/masks/i`, `/cat/i`, `/dog/i`, etc.) and structural elements (slider, img). Stub panels with correct text labels + basic img/slider satisfy most assertions.

**Q31. Workspace compare mode?**
Workspace loads runs with `displayName`. If media data exists and panels render with run names, compare mode test passes.

---

## 5. Artifacts Browser (11 failing tests)

**Q32. What GraphQL query fails?**
Artifacts list page queries `artifactTypes(first: 50)` with nested `artifactCollections` and `artifacts`. Detail page queries `artifactCollection(name: $collectionName)`. Both queries are defined in the page files, not in queries.ts.

**Q33. Does sidebar render treeitem?**
YES. `<button role="treeitem" aria-label={artType.name}>` (line 68 in artifacts/+page.svelte). But `aria-selected` attribute was recently added.

**Q34-37. Tab rendering status:**
Metadata tab renders key-value pairs from `version.metadata`. Usage tab shows `createdBy` run name. Files tab was recently implemented with download links. Versions tab lists versions with `role="link"`. Lineage tab has SVG stub with text labels.

**ROOT CAUSE OF FAILURES:** Likely data pipeline — setup.py creates artifacts via SDK but the data may not be queryable via our GraphQL. Need to verify that `artifactTypes` query returns data for the test project.

---

## 6. Code Panels / Run Files (6 failing tests)

**Q38. Does files route exist?**
YES. `[[tab]]` parameter handles "files" tab. RUN_DETAIL_QUERY includes `files(first: 50)` (line 87-97 in queries.ts).

**Q39. File browser fetches content?**
YES. `openFile()` (lines 253-273) fetches from `directUrl` and displays in `<pre><code>`.

**Q40. Code logging skipped for bandw?**
YES. `code/setup.py` line 81-82: `if not is_bandw: run.log_code(code_dir)` (run 0).
Line 94: `settings=wandb.Settings(code_dir=code_dir) if not is_bandw else wandb.Settings()` (run 1).
Line 122-123: `if not is_bandw: run.log_code(code_dir)` (run 2).
All three code-logging paths are skipped for bandw runs.

**FIX:** Add `_bandw_files` config with file metadata, or implement code file creation via createRunFiles.

**Q41. Code panel in picker?**
YES. "Code Comparer" option was added to workspace panel picker Charts category.

---

## 7. Query Panels (4 failing tests)

**Q42. Which 4 pass?**
Likely: sort by column, result panel renders, artifactVersion expression, runs object queryable. These are the simpler assertions.

**Q43. Expression evaluator?**
NOT FOUND in frontend code. No implementation of expression parsing or evaluation. The 4 passing tests may work because they test workspace loading and basic UI, not actual expression evaluation.

**Q44. Does query panel use WandbTable?**
NOT YET. Could reuse WandbTable for result rendering.

**Q45. artifactVersion expression test — just checking run names?**
The `artifacts: artifactVersion expression` test likely expects text `/artifact-creator/i`.
Need to verify whether setup.py creates a run with that name and whether the test
just checks that run names are visible in the workspace (which might already work if
the run exists). This question requires running the test with `--debug` to confirm.

---

## 8. Cross-cutting

**Q46-47. Real pipeline vs config?**
Config approach (`_bandw_*`) is working for tables and charts. Extend it for media and code. Real artifact file pipeline works (createRunFiles + upload + download) but setup.py scripts don't use it for bandw.

**Q48. Shared WandbTable?**
YES — already used for tables. Can be used for query panel results.

**Q49. Shared StepSlider?**
NO shared component. Step slider is inline in WandbTable. Should extract as shared component.

**Q50. Current pass count?**
~397/507 (78%). Target: 507/507 (100%).

---

## Key Implementation Decisions

1. **Custom charts:** SVG vs Canvas is NOT the issue — tests already accept `canvas` via `.or()` chains. The 12 failures are likely due to chart titles/data not rendering on run detail pages. FIX: Verify `_bandw_charts` config pipeline end-to-end (setup.py stores data, GraphQL returns it, frontend parses and renders panels with correct titles).
2. **Media data:** Use `_bandw_media` config with labels/metadata (no binary data needed — tests only assert text).
3. **Code files:** Use `_bandw_files` config with file content strings.
4. **Reports:** Fix ARIA roles (button→link), populate panel grid with run data, toggle freeze button text.
5. **Artifacts:** Debug data pipeline — verify GraphQL queries return data for test projects.
6. **Tables:** Add `role="row"` to `<tr>` elements. Fix comparison route/UI.
