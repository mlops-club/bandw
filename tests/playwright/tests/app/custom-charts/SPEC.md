# Custom Charts Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/custom-charts
**Test Directory:** `tests/playwright/tests/custom-charts/`
**Priority:** P2

---

## Tests by Docs Heading

### H2: Log charts from a script — Builtin presets

#### Test: `custom-chart-line.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs `wandb.plot.line(table, "x", "y", title="Custom Line")`)
**Heading:** "Line plot" preset

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Find custom line plot panel | Panel with title "Custom Line" exists |
| 3 | Verify chart renders connected points | Line visible in chart |

#### Test: `custom-chart-scatter.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs `wandb.plot.scatter(table, "x", "y")`)
**Heading:** "Scatter plot" preset

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Find custom scatter plot panel | Panel exists |
| 3 | Verify unconnected points render | Scatter pattern visible |

#### Test: `custom-chart-bar.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs `wandb.plot.bar(table, "label", "value")`)
**Heading:** "Bar chart" preset

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Find custom bar chart panel | Panel exists |
| 3 | Verify bars with labels | Labeled bars visible |

#### Test: `custom-chart-histogram.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs `wandb.plot.histogram(table, "scores")`)
**Heading:** "Histogram" preset

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Find histogram panel | Panel exists |
| 3 | Verify binned frequency bars | Histogram shape visible |

#### Test: `custom-chart-pr-curve.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs `wandb.plot.pr_curve(y_true, y_pred)`)
**Heading:** "PR curve" preset

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Find PR curve panel | Panel exists |
| 3 | Verify precision-recall curve shape | Curve renders |

#### Test: `custom-chart-roc-curve.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs `wandb.plot.roc_curve(y_true, y_pred)`)
**Heading:** "ROC curve" preset

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Find ROC curve panel | Panel exists |
| 3 | Verify ROC curve with diagonal reference | Curve renders correctly |

---

### H2: Log data — custom table

#### Test: `custom-chart-table-data.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs `wandb.Table` with custom columns, then `wandb.plot_table`)
**Heading:** "How to log a custom table"

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Find custom chart panel | Panel exists |
| 3 | Verify chart displays data from logged table | Data renders |

---

### H2: Customize the chart (UI workflow)

#### Test: `custom-chart-edit-in-ui.spec.ts`
**SDK Setup:** `setup_custom_charts.py`
**Heading:** "Customize the chart" + "Custom visualizations"

| # | Step | Assertion |
|---|---|---|
| 1 | Open custom chart panel for editing | Edit interface opens |
| 2 | Verify GraphQL query editor visible | Query editable |
| 3 | Verify chart field mapping UI | Fields selectable |
| 4 | Map query columns to chart axes | Chart updates with mapped data |
| 5 | Modify chart type | Visualization changes |

### H3: Custom presets

#### Test: `custom-chart-custom-preset.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs data with `wandb.plot_table()` using a named custom preset)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Locate the panel created from the custom preset | Panel title and visualization match the preset |
| 3 | Verify the panel uses the logged table data | Data-driven visualization renders |

### H3: How to edit Vega

#### Test: `custom-chart-edit-vega.spec.ts`
**SDK Setup:** `setup_custom_charts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the custom chart editor for a named custom chart | Edit interface opens |
| 2 | Verify the Vega or Vega-Lite specification editor is visible | Specification text is editable |
| 3 | Modify a chart property in the specification | Preview updates |
| 4 | Save or apply the change | Updated chart renders in the workspace |

### H3: Saving chart presets

#### Test: `custom-chart-save-preset.spec.ts`
**SDK Setup:** `setup_custom_charts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the custom chart editor for a named custom chart | Editor opens |
| 2 | Save the edited chart as a preset | Preset save flow completes |
| 3 | Add a new custom chart from the saved preset | New chart uses the saved configuration |

---

## SDK Setup Scripts Required

- `setup_custom_charts.py`

## Total Tests: 11
