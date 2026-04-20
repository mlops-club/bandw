# Panels Overview Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/panels
**Test Directory:** `tests/playwright/tests/panels-overview/`
**Priority:** P1

---

## Tests by Docs Heading

### H2: Workspace modes

#### Test: `workspace-modes.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace in automated mode | Panels auto-generated for all logged keys |
| 2 | Verify panel count matches number of logged metric keys | Panel per metric |
| 3 | Reset workspace | Workspace clears and regenerates |
| 4 | Switch to manual mode | Workspace clears (blank slate) |
| 5 | Verify no panels present | Empty workspace |

---

### H2: Configure the workspace layout

#### Test: `workspace-layout-config.spec.ts`
**SDK Setup:** `setup_multi_run.py` (metrics with prefixed names: `train/loss`, `train/acc`, `val/loss`)

| # | Step | Assertion |
|---|---|---|
| 1 | Open workspace settings → "Workspace layout" | Settings visible |
| 2 | Verify "Hide empty sections during search" toggle works | Empty sections hide/show |
| 3 | Toggle "Sort panels alphabetically" | Panels reorder alphabetically |
| 4 | Change section organization from first-prefix to last-prefix | Sections regroup |
| 5 | Configure section display preferences (tooltip options) | Settings persist |

---

### H2: View a panel in full-screen mode

#### Test: `panel-full-screen.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the panel actions menu for a named panel | Action menu appears |
| 2 | Choose the full-screen action | Panel opens in full-screen |
| 3 | Verify panel fills viewport | Full-screen layout |
| 4 | Verify run selector is available | Sidebar visible |
| 5 | Click left arrow or press Escape | Returns to workspace |
| 6 | Verify prev/next navigation works | Arrow keys cycle panels |

---

### H2: Add panels

#### Test: `add-panel-manually.spec.ts`
**SDK Setup:** `setup_basic_run.py`
**Heading:** "Add a panel manually"

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Add panels" in control bar | Panel picker modal opens |
| 2 | Select "Line plot" | Config modal opens |
| 3 | Configure and apply | Panel added globally |
| 4 | Open the section actions menu and choose "+ Add panels" | Panel picker opens (section-scoped) |
| 5 | Select "Bar chart" and apply | Panel added to that section only |

#### Test: `quick-add-panels.spec.ts`
**SDK Setup:** `setup_basic_run.py`
**Heading:** "Quick add panels"

| # | Step | Assertion |
|---|---|---|
| 1 | Delete a panel | Panel removed |
| 2 | Click "Add panels" → "Quick add" | Quick add list appears |
| 3 | Verify checkmarks on already-present panels | Existing panels marked |
| 4 | Click "Add N panels" for bulk add | All available panels added |
| 5 | Verify individual "Add" on hover works | Single panel added |

---

### H2: Share a panel

#### Test: `share-panel-url.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the panel actions menu for a named panel and choose "Copy panel URL" | URL copied to clipboard |
| 2 | Verify the copied URL contains panel-identifying query parameters | URL matches the documented full-screen link pattern |
| 3 | Navigate to copied URL | Panel opens in full-screen mode |
| 4 | Verify the back navigation control returns to workspace | Navigation works |

#### Test: `share-panel-embed-options.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the panel share or actions menu for a named panel | Share UI opens |
| 2 | Verify embed or social-sharing options are available | Share options are visible |
| 3 | Verify the email-report option is available | Email-report action is visible |

---

### H2: Manage panels

#### Test: `manage-panels-crud.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open panel settings for a named panel | Edit modal opens |
| 2 | Change panel type | Panel type changes |
| 3 | Apply | Updated panel renders |
| 4 | Use the panel actions menu to choose "Duplicate" | Duplicate panel appears |
| 5 | Reorder the panel using the documented move interaction | Panel position changes |
| 6 | Use the panel actions menu to choose "Move" and select a target section | Panel moves to target section |
| 7 | Use the panel actions menu to choose "Delete" | Panel removed |

---

### H2: Manage sections

#### Test: `manage-sections.spec.ts`
**SDK Setup:** `setup_multi_run.py` (prefixed metrics create multiple sections)

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Add section" after last section | New section appears |
| 2 | Click section menu → "New section above" | Section inserted above |
| 3 | Click section menu → "Rename section" | Name changes |
| 4 | Resize a panel using the visible resize control | All section panels resize proportionally |
| 5 | Click pagination counter → set panels per page | Pagination changes |
| 6 | Collapse a section | Section content hides, header remains |
| 7 | Expand section | Content reappears |
| 8 | Click section menu → "Delete section" | Section and all panels removed |

---

## SDK Setup Scripts Required

- `setup_basic_run.py`
- `setup_multi_run.py`

## Total Tests: 9
