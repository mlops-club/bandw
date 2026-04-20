# Custom Logging Axes & Plots Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/track/log/customize-logging-axes
- https://docs.wandb.ai/models/track/log/plots
- https://docs.wandb.ai/models/app/features/panels/line-plot/smoothing
- https://docs.wandb.ai/models/app/features/panels/line-plot/sampling

**Test Directory:** `tests/playwright/tests/logging-axes-and-plots/`
**Priority:** P1

---

## Custom Logging Axes (from /track/log/customize-logging-axes)

### define_metric with custom x-axis

#### Test: `define-metric-custom-x.spec.ts`
**SDK Setup:** `setup_custom_metrics.py` (uses `define_metric("validation_loss", step_metric="epoch")`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Locate "validation_loss" chart | Panel exists |
| 3 | Verify x-axis label is "epoch" (not "Step") | Custom x-axis applied |
| 4 | Verify x-axis values match logged epoch values | Values correct |

### define_metric with glob patterns

#### Test: `define-metric-glob.spec.ts`
**SDK Setup:** `setup_custom_metrics.py` (uses `define_metric("train/*", step_metric="train/step")`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Verify "train/loss" chart uses "train/step" x-axis | Glob pattern applied |
| 3 | Verify "train/accuracy" chart uses same custom x-axis | Pattern matches multiple metrics |
| 4 | Verify "val/loss" chart uses default Step x-axis | Non-matching metric unaffected |

---

## Plots (from /track/log/plots)

### wandb.plot.line

#### Test: `wandb-plot-line.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs `wandb.plot.line()`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Locate custom line plot panel | Panel with custom title exists |
| 3 | Verify connected points render | Line visible |

### wandb.plot.scatter

#### Test: `wandb-plot-scatter.spec.ts`
**SDK Setup:** `setup_custom_charts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Locate scatter plot panel | Panel exists |
| 2 | Verify unconnected points | Scatter pattern visible |

### wandb.plot.bar

#### Test: `wandb-plot-bar.spec.ts`
**SDK Setup:** `setup_custom_charts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Locate bar chart panel | Panel exists |
| 2 | Verify bars with correct labels | Labels match SDK data |

### wandb.plot.histogram

#### Test: `wandb-plot-histogram.spec.ts`
**SDK Setup:** `setup_custom_charts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Locate histogram panel | Panel exists |
| 2 | Verify binned frequency distribution | Bars visible |

### wandb.plot.line_series (multi-line)

#### Test: `wandb-plot-multiline.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs `wandb.plot.line_series()`)

| # | Step | Assertion |
|---|---|---|
| 1 | Locate multi-line plot | Panel exists |
| 2 | Verify multiple Y-series on one chart | Multiple colored lines |
| 3 | Verify legend shows series names | Names match `keys` parameter |

### wandb.plot.confusion_matrix

#### Test: `wandb-plot-confusion-matrix.spec.ts`
**SDK Setup:** `setup_custom_charts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Locate confusion matrix panel | Panel exists |
| 2 | Verify matrix grid renders | Grid with class labels |
| 3 | Verify color intensity reflects counts | Heatmap style |

### wandb.plot.pr_curve

#### Test: `wandb-plot-pr-curve.spec.ts`
**SDK Setup:** `setup_custom_charts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Locate PR curve panel | Panel exists |
| 2 | Verify precision-recall curve shape | Curve renders |

### wandb.plot.roc_curve

#### Test: `wandb-plot-roc-curve.spec.ts`
**SDK Setup:** `setup_custom_charts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Locate ROC curve panel | Panel exists |
| 2 | Verify ROC curve with diagonal reference | Curve and reference line |

### Matplotlib/Plotly Integration

#### Test: `matplotlib-plotly-logging.spec.ts`
**SDK Setup:** `setup_custom_charts.py` (logs matplotlib figure and Plotly figure)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Locate matplotlib-generated panel | Panel rendered as image or interactive Plotly |
| 3 | Locate Plotly-generated panel | Interactive Plotly chart |

---

## Smoothing (from /line-plot/smoothing)

#### Test: `smoothing-methods.spec.ts`
**SDK Setup:** `setup_basic_run.py` (noisy metrics for visible smoothing effect)

| # | Step | Assertion |
|---|---|---|
| 1 | Open line plot edit modal → Data tab | Smoothing settings visible |
| 2 | Set smoothing to "Time Weighted EMA" (default) with coefficient 0.5 | Chart smooths |
| 3 | Change to "Gaussian" smoothing | Different smooth profile |
| 4 | Change to "Running average" with window size | Different smooth profile |
| 5 | Change to "No smoothing" | Raw data shown |
| 6 | Toggle "Show Original" to show/hide faint original line | Original line toggles |
| 7 | Screenshot each method for visual comparison | Distinct smoothing visible |

---

## Point Aggregation / Sampling (from /line-plot/sampling)

#### Test: `point-aggregation-modes.spec.ts`
**SDK Setup:** `setup_custom_metrics.py` (run with many data points, >1500)

| # | Step | Assertion |
|---|---|---|
| 1 | Open workspace settings → Line plots → Point aggregation | Setting visible |
| 2 | Set to "Full fidelity" (default) | Min/max shading available |
| 3 | Configure shading: Min/Max | Shaded region shows value range |
| 4 | Configure shading: Std Dev | Shading changes to std dev |
| 5 | Configure shading: None | No shading |
| 6 | Switch to "Random sampling" | 1500-point sampling applied |
| 7 | Zoom into chart region | Full fidelity: re-buckets; random: same samples |

---

## SDK Setup Scripts Required

- `setup_basic_run.py`
- `setup_custom_metrics.py`
- `setup_custom_charts.py`

## Total Tests: 14
