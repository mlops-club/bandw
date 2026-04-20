# Bar Plots Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/panels/bar-plot
**Test Directory:** `tests/playwright/tests/bar-plots/`
**Priority:** P1

---

## Tests by Docs Heading

### H2: Customize bar plots

#### Test: `create-bar-plot.spec.ts`
**SDK Setup:** `setup_multi_run.py` (5 runs with summary metrics)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Panels load |
| 2 | Start the "Add panels" flow and choose "Bar chart" by accessible name | Bar chart configuration opens |
| 3 | Select a summary metric | Preview updates |
| 4 | Apply the panel | Bar chart panel exists |
| 5 | Verify bars represent runs or groups | Bar count matches visible data |
| 6 | Screenshot for visual verification | Bars render correctly |

---

### H2: Customize bar plots

#### Test: `customize-bar-to-box-plot.spec.ts`
**SDK Setup:** `setup_grouped_runs.py` (3 groups x 3 runs each)
**Heading:** "Customize bar plots" — box/violin plot style

| # | Step | Assertion |
|---|---|---|
| 1 | Group runs using runs table grouping | Runs grouped |
| 2 | Click "Add panel" → "Bar Chart" | Config modal opens |
| 3 | Select a summary metric | Bar chart preview |
| 4 | Navigate to "Grouping" tab | Grouping settings visible |
| 5 | Change plot style to "Box plot" | Preview changes to box plot |
| 6 | Apply | Box plot panel added |
| 7 | Repeat with "Violin" style | Violin plot renders |

#### Test: `bar-plot-grouped-by-config.spec.ts`
**SDK Setup:** `setup_multi_run.py` (5 runs with different configs)

| # | Step | Assertion |
|---|---|---|
| 1 | Add bar chart panel | Panel added |
| 2 | Configure grouping by config parameter | Bars grouped by config value |
| 3 | Verify bar labels match config values | Labels correct |
| 4 | Change max displayed runs | Number of bars changes |

---

## SDK Setup Scripts Required

- `setup_multi_run.py`
- `setup_grouped_runs.py`

## Total Tests: 3
