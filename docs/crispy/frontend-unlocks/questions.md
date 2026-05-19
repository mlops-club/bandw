# Frontend Unlocks — Research Questions

## Context

Implementation slices F0-F5 have been attempted. Current pass rates by area:
- **Panel CRUD (F0):** 39/46 (+1 from baseline)
- **Artifacts (F1):** Still failing — data pipeline issues between setup.py, GraphQL, and rendering
- **Reports (F2):** 2/18 — needs editor interaction fixes
- **Custom Charts (F3):** 7/19 — workspace loads but run-detail chart panels don't render
- **Tables (F4):** 2/40 — table artifact discovery and rendering incomplete
- **Specialized (F5):** Parameter importance 13/13 all pass; query panels 4/8; media 2/15; code/files partial

All backend mutations are implemented. The `_bandw_tables` and `_bandw_charts` config-based
data pipeline is in place for bandw targets. Tests use flexible selectors (`.or()` chains,
regex patterns) so we do not need to match the reference UI's exact DOM.

**Goal:** Close the remaining ~70 failing tests across these 6 areas.

---

## 1. Tables Viewer (38 failing tests — highest count)

### Data pipeline (bandw path decided: `_bandw_tables` in run config)
1. The `_bandw_tables` config stores table data per run. Does the frontend currently read `run.config._bandw_tables`? If so, at what point does it fail — GraphQL response missing the key, JSON parsing error, or rendering?
2. For multi-step tables (runs model-v1/model-v2 in setup.py), the config stores a `steps` array. Does the frontend index into `steps[currentStep]` when the step slider changes? What is the current step slider implementation status?
3. For the comparison tests (table-compare-across-models, table-side-by-side, table-merged-view), the tests navigate to a project-level or multi-run view. What URL/route triggers comparison mode, and does our router handle it?

### Rendering gaps (what specific assertions fail?)
4. The `log-and-view-table` spec expects `role="columnheader"` with names "pred", "label", "score" and `role="row"` elements. Does our WandbTable.svelte component emit these ARIA roles on `<th>` and `<tr>` elements?
5. The filter test expects `role="button"` with name matching `/filter/i` and then a `role="textbox"` with name `/filter/i`. What filter UI do we currently render, and what is missing?
6. The sort test clicks a columnheader and expects rows to reorder. Does our sort handler actually re-sort the data array and trigger a Svelte reactive update?

### Comparison and advanced modes
7. What URL pattern do the comparison specs (table-compare-across-models, table-side-by-side) navigate to? Is it a workspace-level view with multiple runs selected, or a dedicated comparison route?
8. For merged view with join keys: setup.py creates `table-version-a` and `table-version-b` artifacts with overlapping `id` column. Does the frontend need to fetch both artifacts and join client-side on the `id` column, or can we pre-join in the setup.py `_bandw_tables` config?
9. The advanced mode specs (immutable, mutable, incremental) — do they test fundamentally different rendering behavior, or just different data shapes? Can a single table renderer handle all three if the data is shaped correctly in setup.py?
10. The table download spec expects a CSV export. Should we implement client-side CSV generation (iterate rows, join with commas, trigger download via Blob URL)?

---

## 2. Custom Charts (12 failing tests)

### Current state (7/19 pass — workspace loads, run-detail panels missing)
11. The 7 passing tests are all "workspace loads" assertions. The 12 failures are "panel with title exists" and "line/bar/rect visible in chart" on run detail pages. What does the run detail page currently render for a run that has `_bandw_charts` in its config?
12. The custom chart setup.py stores chart specs in `run.config._bandw_charts` as `[{title, type, xKey, yKey, data?}]`. Does the run detail page query `run.config` and look for this key? If it does, where does rendering break?

### Rendering requirements (from test assertions)
13. The line chart test asserts `page.locator('svg path, canvas').first()` is visible. The bar chart test asserts `svg rect`. The scatter test asserts `svg circle`. Do our BarChart.svelte, ScatterChart.svelte, etc. components emit these exact SVG elements?
14. The `custom-chart-edit-in-ui` spec clicks "Edit panel" and expects a chart type selector and field mapping UI. What does our edit interface currently render, and what elements does the test assert?
15. The `custom-chart-table-data` spec tests a `wandb.plot_table` chart with `vega_spec_name="wandb/line/v0"`. For bandw, setup.py stores this as a regular `_bandw_charts` line chart. Does this test navigate to the run detail page or the workspace?

---

## 3. Reports (16 failing tests)

### Current state (2/18 pass — backend wired, editor interactions broken)
16. Which 2 tests currently pass? Is it the "API-created report loads in UI" test and one other? Identifying the passing tests tells us which interaction paths work.
17. The `create-report-from-workspace` test: clicks "Create report" button, expects a dialog with "Filter run sets" checkbox, then clicks "Create report" again. Does our workspace page have this button? Does the dialog open? Where does the flow break?
18. The `create-report-from-reports-tab` test: navigates to `/reportlist`, clicks "Create Report", expects a `textbox[name=/title/i]` or `contenteditable`. Does our reportlist page render this button? Does the editor open?

### Slash command tests (6 tests)
19. Tests `report-add-plots`, `report-add-code-block`, `report-add-markdown`, `report-add-headings` all follow the same pattern: navigate to reportlist, click "Create Report", press "/" key, select an option, verify output. Does our "/" handler fire on keypress in the editor? What slash command options currently appear?
20. The `report-add-run-sets` test adds a "Panel Grid" via slash command and expects run names (e.g., "experiment-A") to be visible. Does our panel grid block actually query and display project runs?
21. The `report-freeze-run-set` test clicks a button matching `/freeze/i` and expects a button matching `/frozen|unfreeze/i`. Do we render a freeze button on panel grid blocks?

### Persistence and listing
22. The `create-report-from-api` test expects `role="link"` with name `/report/i` on the reportlist page. Does our reportlist query `allViews(viewType: "runs")` and render results as links? Does the setup.py create a report via the API for bandw targets?
23. Do we need report share/comment features to pass any of the 18 tests? (Check: are there share or comment assertions in reports-core.spec.ts or reports-advanced.spec.ts?)

---

## 4. Media Panels (13 failing tests)

### Critical blocker: setup.py skips media logging for bandw
24. The media setup.py has `if not is_bandw` guards around ALL media logging calls (`_log_media`, image logging in compare runs). This means bandw runs have NO media data at all. Should we: (a) remove the `is_bandw` guard and let the SDK log media normally via createRunFiles, or (b) add a `_bandw_media` config approach like tables/charts? Option (a) is simpler if our file upload/download pipeline works.
25. If we use option (a): does our backend's createRunFiles mutation correctly handle binary uploads (PNG, WAV, MP4)? Does the file download endpoint serve them with correct Content-Type headers?
26. If we use option (b): what minimal config structure would let the frontend render placeholder panels with the right text labels? (Most tests only assert text like `/images/i`, `/audio/i`, `/video/i`, `/histogram/i` is visible.)

### Rendering (assuming data exists)
27. The image test asserts `role="img"` with name `/images/i` OR just text `/images/i`. The step slider test asserts `role="slider"`. The caption test asserts text matching `/step-\d+-caption/`. What is the minimal component that satisfies these three? An `<img>` tag with alt text + `<input type="range">` + caption `<span>`?
28. Audio/video tests only assert text `/audio/i` and `/video/i` is visible. Can we satisfy these with panel containers that show the media key name, even without actual playback? Or do tests also check for `<audio>`/`<video>` elements?
29. The segmentation mask test asserts text `/masks/i` and `/cat/i` or `/dog/i`. The bounding box test asserts text `/boxes/i` or `/bounding/i`. These check for panel labels, not actual rendered overlays. Confirm: can we pass these with labeled panel containers that display the logged key names and class labels from metadata?
30. The 3D point cloud test asserts text `/point_cloud/i` or `/object3d/i`. Can this be a stub panel, or does it need WebGL rendering?

### Compare mode
31. The compare-mode test asserts text `/media-primary/i` and `/media-run-1/i` are both visible. This tests that multiple run names appear in the workspace. Does our workspace already show run names in the sidebar or panel headers? Could this already pass if the runs exist with correct names?

---

## 5. Artifacts Browser (11 failing tests — data pipeline issues)

### Diagnosis (F1 was attempted, tests still fail)
32. The plan says "tests still failing due to data pipeline issues (setup.py -> GraphQL -> rendering)." What specific GraphQL query fails or returns empty? Run the artifacts spec with `--debug` and capture the network requests.
33. The artifacts-core spec expects `role="treeitem"` elements for artifact types. Does our sidebar render `<li role="treeitem">` or `<button role="treeitem">`? What does `artifactTypes` query return for a project with logged artifacts?
34. The artifacts detail page needs tabs: Metadata, Usage, Versions, Files. Which tabs currently render data, and which show empty states?

### Specific test assertions to verify
35. Does the lineage graph render? The test likely checks for SVG elements or specific text (run names, artifact names). What does our lineage SVG currently contain?
36. For artifact version navigation: does clicking a version in the Versions tab update the detail view (metadata, files, aliases)? Or does it navigate to a new URL?
37. For artifact file listing: does the Files tab query `artifactFiles` and render results? If the artifact was created via `_bandw_artifacts` config in setup.py, are the files actually stored in the backend?

---

## 6. Code Panels / Run Files (partial — exact failing count TBD)

### File browser on run detail
38. The `log-code-files` test navigates to `/runs/{name}/files` and expects text `/train\.py/i` or `/model\.py/i`. Does our `/files` route exist? Does it query `run.files` and render filenames?
39. The "opening a source file" test clicks on `train.py` and expects text `/def train/`. Does our file browser have a click handler that fetches file content and displays it? What endpoint serves file content?
40. Does the code-panel setup.py use `wandb.log_code()` for bandw targets, or does it skip code logging? If it skips, we need to add code file data to the bandw path.

### Code comparer panel
41. The `code-comparer` test opens the panel picker, clicks `/code/i`, and expects a button matching `/apply|add|create|save/i` or text `/code/i`. Does our panel picker include a "Code" option? What happens when it's clicked?

---

## 7. Query Panels (4 failing tests — 4/8 pass)

### Current state
42. Which 4 tests pass and which 4 fail? The passing tests likely check workspace loading and run visibility. The failing tests likely involve expression evaluation and result rendering.
43. The `create: query panel renders result after entering expression` test fills a textbox with `runs.summary["results_table"]` and expects `role="table"` or `role="figure"`. Does our expression evaluator parse this string and return data? What does it currently do with the input?
44. The `operations: sort by column header` test expects `role="columnheader"` to be visible. This implies the query panel result must render as a table with sortable columns. Does our query panel result component use the same WandbTable component as the tables viewer?
45. The `artifacts: artifactVersion expression` test expects text `/artifact-creator/i`. Does the setup.py create a run named "artifact-creator"? Is this test just checking that run names are visible in the workspace (which might already work)?

---

## 8. Cross-cutting Implementation Decisions

### Data pipeline strategy
46. The `_bandw_tables` / `_bandw_charts` config approach works for simple data but creates a parallel code path in every setup.py. Should we invest in making the real artifact file pipeline work (createRunFiles upload, file download endpoint) so setup.py can use identical code for both targets? What is the effort vs. payoff?
47. For media specifically: the setup.py completely skips bandw. Fixing the real file upload/download path would unblock all 15 media tests without config hacks. Is the createRunFiles -> file storage -> download endpoint pipeline functional end-to-end?

### Frontend component reuse
48. Tables, query panel results, and custom chart data all need tabular rendering. Should WandbTable.svelte be the single shared component, with tables/query/charts all feeding data into it?
49. Multiple panel types need a step slider (tables, media, custom charts). Is there a shared StepSlider.svelte component, or does each panel implement its own?

### Test execution
50. What is the current total pass count? The plan shows partial results per slice. Run the full suite (`npx playwright test --project=bandw`) and capture the exact pass/fail breakdown to prioritize the next round of fixes.
