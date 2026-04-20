# Workspaces Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/track/workspaces
**Test Directory:** `tests/playwright/tests/workspaces/`
**Priority:** P1

---

## Tests by Docs Heading

### H2: Workspace types

#### Test: `workspace-types.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Personal workspace loads |
| 2 | Verify workspace shows as "Personal" | Badge/label indicates personal workspace |
| 3 | Verify workspace name is editable | Name field accepts input |

---

### H2: Saved workspace views

#### Test: `saved-views-crud.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Headings:** "Create", "Update", "Delete", "Share" a saved workspace view

| # | Step | Assertion |
|---|---|---|
| 1 | Make edits to workspace (e.g., hide a panel) | Workspace modified |
| 2 | Open the workspace view actions menu → "Save as a new view" | View saved |
| 3 | Verify saved view appears in navigation menu | View listed |
| 4 | Navigate to saved view | View loads with saved state |
| 5 | Modify the view and click Save | Confirmation dialog appears |
| 6 | Confirm save | Changes persisted |
| 7 | Navigate away and back to view | Modifications still present |
| 8 | Open the saved-view actions menu → "Delete view" → confirm | View removed from navigation |

---

### H2: Workspace templates (Enterprise)

#### Test: `workspace-default-settings.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "Default workspace settings"

| # | Step | Assertion |
|---|---|---|
| 1 | Open workspace settings | Settings panel visible |
| 2 | Verify "Hide empty sections during search" toggle | Toggle exists, default off |
| 3 | Verify "Sort panels alphabetically" toggle | Toggle exists, default off |
| 4 | Verify section organization default (first prefix) | Default grouping correct |
| 5 | Verify line plot defaults: X=Step, Smoothing=Time Weight EMA (0), Max runs=10 | Defaults match docs |

---

### Workspace UI interactions (from docs page body)

#### Test: `workspace-runs-sidebar.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Source:** Workspace → Runs Sidebar section

| # | Step | Assertion |
|---|---|---|
| 1 | Verify runs sidebar shows run count badge | "Runs N" visible |
| 2 | Use the run-visibility control for a run | Run visibility toggles in charts |
| 3 | Use the run-color control for a run | Color picker appears |
| 4 | Change color | Color updates in sidebar and charts |
| 5 | Search runs by name in sidebar search | List filters to matching runs |
| 6 | Toggle regex search | Regex mode activated |
| 7 | Click run name link | Navigates to run detail page |
| 8 | Click expand button on sidebar | Full runs table opens |
| 9 | Use keyboard shortcut Cmd+./Ctrl+. to collapse | Sidebar collapses |
| 10 | Repeat shortcut to restore | Sidebar expands |

#### Test: `workspace-filter-group-sort.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Source:** Workspace → Runs Sidebar → Toolbar

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Filter" button | Filter expression builder opens |
| 2 | Add filter (e.g., state = "finished") | Runs filtered in sidebar and charts |
| 3 | Click "Group" button | Group column picker opens |
| 4 | Select config column (e.g., "arch") | Runs grouped, charts show mean with variance shading |
| 5 | Click "Sort" button | Sort config opens |
| 6 | Sort by loss ascending | Run order changes in sidebar |
| 7 | Click "Columns" button | Column picker opens |
| 8 | Hide/show/pin columns | Column visibility changes |

#### Test: `workspace-undo-redo.spec.ts`
**SDK Setup:** `setup_basic_run.py`
**Source:** Workspace → Header section

| # | Step | Assertion |
|---|---|---|
| 1 | Make a change (e.g., delete a panel) | Panel removed |
| 2 | Click Undo button | Panel restored |
| 3 | Click Redo button | Panel removed again |
| 4 | Verify autosave indicator | "Saved just now" or similar text visible |

#### Test: `workspace-panel-sections.spec.ts`
**SDK Setup:** `setup_multi_run.py` (prefixed metrics for multiple sections)
**Source:** Workspace → Charts Panel section

| # | Step | Assertion |
|---|---|---|
| 1 | Verify sections exist with collapse toggles | Section headers visible |
| 2 | Verify section names match metric prefixes | e.g., "train", "val" sections |
| 3 | Collapse a section | Content hides |
| 4 | Verify section panel count badge | Badge shows correct count |
| 5 | Navigate section pagination (prev/next) | Panels paginate |
| 6 | Search panels with "Search panels" input | Panels filter by title |
| 7 | Verify 3-column responsive panel grid | Panels in grid layout |
| 8 | Reorder a panel using the documented move interaction | Panel position changes |

### Workspace template CRUD

#### Test: `workspace-template-crud.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the workspace template flow | Template UI loads |
| 2 | Save the current workspace as a template | Template is created |
| 3 | View and update the template | Template changes persist |
| 4 | Delete the template | Template is removed |

### Programmatically created workspaces

#### Test: `workspace-api-created-view.spec.ts`
**SDK Setup:** `setup_multi_run.py` + Workspace API-created saved view copied to another workspace

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to the workspace or saved view created by the Workspace API | Programmatically-created view loads |
| 2 | Verify copied view state matches the setup definition | Panels, filters, and layout match setup |

---

## SDK Setup Scripts Required

- `setup_basic_run.py`
- `setup_multi_run.py`

## Total Tests: 9
