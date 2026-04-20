# Reports Advanced Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/reports/collaborate-on-reports
- https://docs.wandb.ai/models/reports/cross-project-reports
- https://docs.wandb.ai/models/reports/clone-and-export-reports
- https://docs.wandb.ai/models/reports/embed-reports

**Test Directory:** `tests/playwright/tests/reports-advanced/`
**Priority:** P2

---

## Collaborate on Reports (from /reports/collaborate-on-reports)

### Share a report

#### Test: `report-share.spec.ts`
**SDK Setup:** `setup_basic_run.py` + create a report

| # | Step | Assertion |
|---|---|---|
| 1 | Open a report | Report loads |
| 2 | Click "Share" button | Share modal opens |
| 3 | Verify "Invite" option (enter email/username) | Input field present |
| 4 | Verify "Can view" / "Can edit" permission dropdown | Permission options available |
| 5 | Verify shareable link generation | Link generated |

### Edit a report collaboratively

#### Test: `report-edit-draft.spec.ts`
**SDK Setup:** `setup_basic_run.py` + create a report

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Edit" on a report | Edit mode active, auto-saves as draft |
| 2 | Make changes (add text) | Changes saved as draft |
| 3 | Click "Save to report" button | Changes published |

### Comment on reports

#### Test: `report-comments.spec.ts`
**SDK Setup:** `setup_basic_run.py` + create a report

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Comment" button on report | Comment interface opens |
| 2 | Type a report-level comment | Comment submitted |
| 3 | Open the panel comment control for a named panel | Panel-specific comment opens |
| 4 | Type a panel-specific comment | Comment submitted |

### Star a report

#### Test: `report-star.spec.ts`
**SDK Setup:** `setup_basic_run.py` + create a report

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Reports tab | Reports listed |
| 2 | Activate the report star control | Star count increments |
| 3 | Verify report appears at top of list | Starred report prioritized |
| 4 | Click star again to unstar | Star count decrements |

---

## Cross-Project Reports (from /reports/cross-project-reports)

#### Test: `cross-project-report.spec.ts`
**SDK Setup:** Two separate projects with runs (setup_basic_run.py x2)

| # | Step | Assertion |
|---|---|---|
| 1 | Create a report | Report editor opens |
| 2 | Add a run set from current project | Runs shown |
| 3 | Click project selector → choose alternate project | Second project's runs loaded |
| 4 | Verify runs from both projects visible in report | Cross-project data |

#### Test: `view-only-report-links.spec.ts`
**SDK Setup:** `setup_basic_run.py` + create a report

| # | Step | Assertion |
|---|---|---|
| 1 | Open a shared report | Report loads |
| 2 | Create or copy a view-only report link | Link generation succeeds |
| 3 | Open the view-only link in a clean session | Report is readable without edit controls |

---

## Clone and Export Reports (from /reports/clone-and-export-reports)

### Clone a report

#### Test: `report-clone.spec.ts`
**SDK Setup:** `setup_basic_run.py` + create a report

| # | Step | Assertion |
|---|---|---|
| 1 | Open the report actions menu | Menu appears |
| 2 | Click "Clone this report" | Destination modal opens |
| 3 | Select destination and confirm | Cloned report created |
| 4 | Navigate to cloned report | Clone loads with same content |

### Export a report

#### Test: `report-export.spec.ts`
**SDK Setup:** `setup_basic_run.py` + create a report

| # | Step | Assertion |
|---|---|---|
| 1 | Open the report actions menu | Menu appears |
| 2 | Click "Download" | Format options appear (PDF, LaTeX) |
| 3 | Select PDF | PDF file downloads |

---

## Send a Graph to a Report

#### Test: `send-panel-to-report.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts visible |
| 2 | Click panel dropdown menu → "Add to report" | Report selector appears |
| 3 | Select destination report | Panel added to report |
| 4 | Open the report | Panel visible in report |

---

## Embed Reports (from /reports/embed-reports)

#### Test: `report-embed-code.spec.ts`
**SDK Setup:** `setup_basic_run.py` + create a report

| # | Step | Assertion |
|---|---|---|
| 1 | Open the report share or embed flow | Embed UI opens |
| 2 | Copy the generated HTML iframe embed code | Iframe snippet is available |
| 3 | Verify the snippet contains the report URL needed for Confluence, Notion, and Gradio embeds | Embed code matches the documented host-integration flow |

---

## SDK Setup Scripts Required

- `setup_basic_run.py`
- `setup_multi_run.py`

## Total Tests: 11
