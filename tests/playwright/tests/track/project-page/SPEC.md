# Project Page Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/track/project-page
**Test Directory:** `tests/playwright/tests/project-page/`
**Priority:** P0

---

## Tests by Docs Heading

### Overview Tab

#### Test: `project-overview.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to project overview page | Page loads |
| 2 | Verify project name displayed | Name matches created project |
| 3 | Verify details section: contributor count, total runs, compute time | Values are non-zero |
| 4 | Verify project visibility setting shown | Privacy indicator visible |
| 5 | Click "Edit" button | Edit modal opens with name, description fields |
| 6 | Add/edit project description | Description saved |

---

### Workspace Tab

#### Test: `project-workspace-tab.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to project workspace tab | Workspace loads |
| 2 | Verify runs sidebar visible with run count | Sidebar shows "Runs N" |
| 3 | Verify panel sections with charts | Panels render |
| 4 | Verify project navigation exposes the documented tabs | All tabs are accessible |

---

### Runs Tab

#### Test: `runs-table-columns.spec.ts`
**SDK Setup:** `setup_multi_run.py` (varied configs and summaries)
**Heading:** Runs tab → Customize columns

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to runs table | Table loads with runs |
| 2 | Verify default columns: checkbox, visibility, color, NAME, STATE, CREATED, RUNTIME | Columns present |
| 3 | Verify config columns auto-generated (lr, batch_size, arch) | Config keys as columns |
| 4 | Verify summary columns auto-generated (loss, accuracy) | Summary keys as columns |
| 5 | Drag a column to reorder | Column position changes |
| 6 | Open the column actions menu and pin a column | Column pins near Name |
| 7 | Open the column actions menu and hide a column | Column disappears |
| 8 | Click "Columns" button | Column manager opens |
| 9 | Show/hide/pin multiple columns | Changes apply |

#### Test: `runs-table-sort.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** Runs tab → Sort

| # | Step | Assertion |
|---|---|---|
| 1 | Open the column header actions menu and sort ascending | Rows reorder by that column |
| 2 | Click "Sort" button | Multi-sort dropdown appears |
| 3 | Add sort by loss ASC | Rows sort by loss |
| 4 | Add secondary sort by created DESC | Ties broken by creation time |
| 5 | Remove a sort criteria | Sort simplifies |

#### Test: `runs-table-filter.spec.ts`
**SDK Setup:** `setup_multi_run.py` (some runs finished, some crashed)
**Heading:** Runs tab → Filter

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Filter" button | Filter expression builder opens |
| 2 | Click "New filter" | Three dropdowns appear: column, operator, value |
| 3 | Set filter: state = "finished" | Only finished runs shown |
| 4 | Add another filter: loss <= 0.5 | Rows further narrow |
| 5 | Remove a filter with the filter removal control | Rows expand back |

#### Test: `runs-table-group.spec.ts`
**SDK Setup:** `setup_grouped_runs.py` (runs with group and job_type set)
**Heading:** Runs tab → Group

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Group" button | Group dropdown appears |
| 2 | Select config column (e.g., arch) | Runs collapse under group headers |
| 3 | Verify group headers show aggregated metrics | Summary values visible |
| 4 | Expand a group | Individual runs visible |
| 5 | Clear grouping | All runs flat again |

#### Test: `runs-table-search.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Type in search box | Runs filter by name |
| 2 | Toggle regex mode | Regex patterns accepted |
| 3 | Enter regex pattern matching subset | Correct subset shown |
| 4 | Clear search | All runs visible |

#### Test: `runs-table-bulk-ops.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Select multiple runs | Selection count shown |
| 2 | Click "Tag" button | Tag interface appears |
| 3 | Apply a tag to selected runs | Tag appears on all selected |
| 4 | Verify pagination controls | Page navigation works |
| 5 | Change rows per page | Table adjusts |

#### Test: `runs-table-visibility-sync.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Use the run-visibility control in the table | Run visibility toggles |
| 2 | Navigate to workspace | Same run hidden in charts |
| 3 | Toggle visibility back in workspace sidebar | Run reappears |
| 4 | Return to runs table | Visibility synced |

---

### Artifacts Tab

#### Test: `project-artifacts-tab.spec.ts`
**SDK Setup:** `setup_artifacts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts tab | Artifact list visible |
| 2 | Select an artifact | Latest version details shown |
| 3 | Click "Metadata" tab | Metadata key-values visible |
| 4 | Click "Usage" tab | Code snippet and related runs shown |
| 5 | Click "Files" tab | File list visible |
| 6 | Click "Lineage" tab | DAG graph renders |
| 7 | Click "Versions" tab | Version list visible |

---

### Reports Tab

#### Test: `project-reports-tab.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Reports tab | Reports list visible (may be empty) |
| 2 | Click "Create Report" | Report creation flow initiates |

---

### Automations Tab

#### Test: `project-automations-tab.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Automations tab | Automations tab loads |
| 2 | Verify automation configuration or empty state is visible | Automations surface is present |

---

### Sweeps Tab

#### Test: `project-sweeps-tab.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Sweeps tab | Sweeps tab loads |
| 2 | Verify sweep list or empty state is visible | Sweeps surface is present |

---

### Create/Star/Delete a Project

#### Test: `project-lifecycle.spec.ts`
**SDK Setup:** None (tests project creation via SDK)

| # | Step | Assertion |
|---|---|---|
| 1 | SDK creates project via `wandb.init(project=unique_name)` | Project appears in projects list |
| 2 | Navigate to project | Project loads |
| 3 | Create a second project through the W&B App flow | Newly created project opens |
| 4 | Activate the project star control | Star indicator active |
| 5 | Verify project appears in starred list | Starred section shows project |
| 6 | Unstar the project | Star indicator inactive |

---

### Add Notes to a Project

#### Test: `project-notes.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to overview tab | Overview loads |
| 2 | Click "Edit" button | Edit modal opens |
| 3 | Add description text | Description field populated |
| 4 | Click "Save" | Description persists on refresh |

---

## SDK Setup Scripts Required

- `setup_basic_run.py`
- `setup_multi_run.py`
- `setup_grouped_runs.py`
- `setup_artifacts.py`

## Total Tests: 16
