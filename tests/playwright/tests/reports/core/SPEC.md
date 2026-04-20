# Reports Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/reports/create-a-report
- https://docs.wandb.ai/models/reports/edit-a-report

**Test Directory:** `tests/playwright/tests/reports/`
**Priority:** P2

---

## Create a Report (from /reports/create-a-report)

### W&B App Tab

#### Test: `create-report-from-workspace.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Workspace loads with charts |
| 2 | Click the "Create report" control | Report creation modal opens |
| 3 | Verify chart selection options | Charts from workspace shown |
| 4 | Toggle "Filter run sets" | Toggle works |
| 5 | Click "Create report" | Draft report opens |
| 6 | Verify report contains selected charts | Panels present in report |

### Report Tab

#### Test: `create-report-from-reports-tab.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to project → Reports tab | Reports list visible |
| 2 | Click "Create Report" button | Report creation initiates |
| 3 | Verify new report opens in editor | Editor visible |

### Report and Workspace API Tab

#### Test: `create-report-from-api.spec.ts`
**SDK Setup:** `setup_basic_run.py` + API-created report

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to the report created through the Reports and Workspaces API | Report loads in the W&B UI |
| 2 | Verify title and blocks created by the API are present | API-authored content renders correctly |

---

## Edit a Report (from /reports/edit-a-report)

### Add plots

#### Test: `report-add-plots.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open a report in edit mode | Report editor loads |
| 2 | Type "/" to open command menu | Dropdown menu appears |
| 3 | Select "Add panel" | Panel type picker opens |
| 4 | Choose "Line plot" | Line plot config opens |
| 5 | Configure and apply | Line plot added to report |
| 6 | Add scatter plot via same workflow | Second panel added |

### Add run sets

#### Test: `report-add-run-sets.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open report in edit mode | Editor loads |
| 2 | Type "/" → select "Panel Grid" | Panel grid added with project run sets |
| 3 | Verify runs imported into report | Run names visible |
| 4 | Open the actions menu for a run in the run set and rename it | Run name changes in report |

### Freeze a run set

#### Test: `report-freeze-run-set.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open report | Run set visible |
| 2 | Use the run-set freeze control | Run set frozen |
| 3 | Verify visual indicator of frozen state | Snowflake active |

### Group a run set programmatically

#### Test: `report-group-run-set-programmatically.spec.ts`
**SDK Setup:** `setup_multi_run.py` + API-created report with grouped run set

| # | Step | Assertion |
|---|---|---|
| 1 | Open the API-authored report | Report loads |
| 2 | Verify runs are grouped by config, metadata, or summary key as defined in setup | Group headers and grouped rows are visible |

### Filter a run set programmatically

#### Test: `report-filter-run-set-programmatically.spec.ts`
**SDK Setup:** `setup_multi_run.py` + API-created report with config, metric, summary, and tag filters

| # | Step | Assertion |
|---|---|---|
| 1 | Open the API-authored report | Report loads |
| 2 | Verify config-based filtering is applied | Non-matching runs are absent |
| 3 | Verify metric, summary, and tag filters are applied | Visible runs match filter criteria |

### Add code blocks

#### Test: `report-add-code-block.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open report in edit mode | Editor loads |
| 2 | Type "/" → select "Code" | Language picker appears |
| 3 | Select "Python" | Code block inserted |
| 4 | Type code into block | Code rendered with syntax highlighting |

### Add markdown

#### Test: `report-add-markdown.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open report in edit mode | Editor loads |
| 2 | Type "/" → select "Markdown" | Markdown block inserted |
| 3 | Type markdown text with **bold** and *italic* | Text renders correctly |

### Add HTML elements

#### Test: `report-add-headings.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Type "/" → select "Heading 2" | H2 block inserted |
| 2 | Type heading text | Heading renders |
| 3 | Add paragraph text below | Text block added |

### Embed rich media links

#### Test: `report-embed-rich-media.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open report in edit mode | Editor loads |
| 2 | Add an embed block for a Twitter, YouTube, or SoundCloud link | Embedded block is inserted |
| 3 | Verify embedded rich media renders in the report | Embedded content is visible |

### Duplicate and delete panel grids

#### Test: `report-panel-grid-crud.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open a report with a panel grid | Panel grid is visible |
| 2 | Duplicate the panel grid | Duplicate grid appears |
| 3 | Delete one panel grid | Remaining grid persists |

### Collapse headers

#### Test: `report-collapse-headers.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Create report with multiple H2 sections | Sections visible |
| 2 | Collapse a header section | Content hidden |
| 3 | Expand the section | Content reappears |
| 4 | Verify only expanded headers show content on load | Collapsed state persists |

### Visualize relationships across multiple dimensions

#### Test: `report-multidimensional-viz.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open a report in edit mode | Editor loads |
| 2 | Add a visualization that compares multiple dimensions from the run set | Visualization block is added |
| 3 | Verify multiple dimensions are represented in the rendered chart | Visualization matches the configured fields |

---

## SDK Setup Scripts Required

- `setup_basic_run.py`
- `setup_multi_run.py`

## Total Tests: 15
