# Scatter Plots Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/panels/scatter-plot
**Test Directory:** `tests/playwright/tests/scatter-plots/`
**Priority:** P1

---

## Tests by Docs Heading

### H2: Create a scatter plot

#### Test: `create-scatter-plot.spec.ts`
**SDK Setup:** `setup_multi_run.py` (5 runs with varied configs and metrics)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Page loads |
| 2 | Start the "Add panels" flow from the workspace controls | Panel picker opens |
| 3 | Choose "Scatter plot" | Config modal opens |
| 4 | Set X-axis to config `lr` | X-axis configured |
| 5 | Set Y-axis to summary `best_accuracy` | Y-axis configured |
| 6 | Click "Apply" | Scatter plot appears |
| 7 | Verify each point represents one run | Point count = run count |
| 8 | Screenshot for visual verification | Points render correctly |

---

### H2: Use case / Example

#### Test: `scatter-plot-example.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Create scatter plot with X=lr, Y=accuracy | Plot renders |
| 2 | Open edit modal | Settings visible |
| 3 | Set axis ranges (min/max) | Plot rescales |
| 4 | Enable log scale on X-axis | Axis changes to log |
| 5 | Hover over a point | Tooltip shows run metadata and values |

---

## SDK Setup Scripts Required

- `setup_multi_run.py`

## Total Tests: 2
