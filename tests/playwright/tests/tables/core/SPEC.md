# W&B Tables Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/tables
- https://docs.wandb.ai/models/tables/visualize-tables

**Test Directory:** `tests/playwright/tests/tables/`
**Priority:** P2

---

## Tables Overview (from /tables)

#### Test: `log-and-view-table.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs `wandb.Table(columns=["pred", "label", "score"], data=...)`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run's workspace or artifact | Table panel/artifact visible |
| 2 | Verify table renders with correct columns | Column headers match SDK |
| 3 | Verify data rows present | Row count matches SDK data |
| 4 | Verify table supports sorting by column | Click column → rows reorder |
| 5 | Verify table supports filtering | Filter rows by value |

---

## Visualize and Analyze Tables (from /tables/visualize-tables)

### Table comparison options

#### Test: `table-merged-view.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs 2 table artifacts with overlapping columns)
**Heading:** "Merged view"

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → select table artifact | Table visible |
| 2 | Open the comparison flow for a second version | Comparison view opens |
| 3 | Verify merged view with color coding (blue=first, yellow=second) | Colors distinguish versions |
| 4 | Select join key from dropdown | Rows joined by key |
| 5 | Use filter expressions with table indices (`0`, `1`) | Filters work per table |

#### Test: `table-side-by-side-view.spec.ts`
**SDK Setup:** `setup_media_run.py`
**Heading:** "Side-by-side view"

| # | Step | Assertion |
|---|---|---|
| 1 | Change dropdown to "List of: Table" | Side-by-side view activates |
| 2 | Adjust page size | Both tables paginate |
| 3 | Enable the vertical layout toggle | Layout switches to vertical |
| 4 | Apply sort/filter | Operations apply to both tables simultaneously |

### Compare tables across time

#### Test: `table-compare-across-time.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs tables at multiple training intervals)
**Heading:** "Compare tables across time"

| # | Step | Assertion |
|---|---|---|
| 1 | View table artifacts at different steps | Multiple versions available |
| 2 | Compare two versions | Differences visible |
| 3 | Verify temporal changes in predictions | Values differ across time |

### Compare tables across model variants

#### Test: `table-compare-across-models.spec.ts`
**SDK Setup:** `setup_media_run.py` (two model variants logging tables at same step)
**Heading:** "Compare tables across model variants"

| # | Step | Assertion |
|---|---|---|
| 1 | Compare tables from different model configs | Comparison view opens |
| 2 | Filter to incorrect predictions | Subset shown |
| 3 | Verify differences between model outputs | Predictions differ |

### Visualize how values change throughout runs

#### Test: `table-step-slider.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs tables at multiple steps)
**Heading:** "Visualize how values change throughout your runs" — step slider

| # | Step | Assertion |
|---|---|---|
| 1 | Add Query panel → set Render As "Stepper" | Stepper widget appears |
| 2 | Set Stepper Key to `_step` | Slider controls step |
| 3 | Move slider to different step values | Table content updates per step |
| 4 | Verify missing steps use last logged value | Graceful fallback |

### Custom step key

#### Test: `table-custom-step-key.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs table snapshots with a non-default step key)

| # | Step | Assertion |
|---|---|---|
| 1 | Add or open the stepper visualization for the table | Stepper widget appears |
| 2 | Set the Stepper Key to the custom logged key | Slider uses the configured step values |

### Save your view

#### Test: `table-save-view.spec.ts`
**SDK Setup:** `setup_media_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Apply a table comparison or filter configuration | Modified table view is visible |
| 2 | Save the current table view | Saved-view flow completes |
| 3 | Reopen the saved view | Table state is restored |

---

## SDK Setup Scripts Required

- `setup_media_run.py`

## Total Tests: 8
