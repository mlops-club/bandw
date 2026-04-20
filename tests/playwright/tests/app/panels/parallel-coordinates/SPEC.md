# Parallel Coordinates Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/panels/parallel-coordinates
**Test Directory:** `tests/playwright/tests/parallel-coordinates/`
**Priority:** P1

---

## Tests by Docs Heading

### H2: Create a parallel coordinates panel

#### Test: `create-parallel-coords.spec.ts`
**SDK Setup:** `setup_multi_run.py` (5 runs with varied configs: lr, batch_size, epochs, arch)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Page loads |
| 2 | Click "Add Panels" | Panel picker opens |
| 3 | Select "Parallel coordinates" | Panel added to workspace |
| 4 | Verify panel renders with vertical axes | Multiple axes visible |
| 5 | Verify each line represents one run | Line count matches run count |
| 6 | Verify axes include config keys and metric keys | Axis labels match logged data |

---

### H2: Panel settings

#### Test: `parallel-coords-settings.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Click edit button on parallel coords panel | Settings open |
| 2 | Hover over a line | Tooltip shows run details |
| 3 | Edit axis titles for readability | Titles update |
| 4 | Customize color gradient | Gradient changes |
| 5 | Enable log scale on a numeric axis | Axis rescales to log |
| 6 | Flip an axis direction | Axis direction reverses |
| 7 | Screenshot for visual verification | All settings reflected |

#### Test: `parallel-coords-filter.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Drag to select a range on one axis | Filter applied |
| 2 | Verify matching lines stay colored | Filtered lines prominent |
| 3 | Verify non-matching lines gray out | Grayed out lines visible |
| 4 | Clear filter | All lines restore color |

---

## SDK Setup Scripts Required

- `setup_multi_run.py`

## Total Tests: 3
