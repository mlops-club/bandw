# Line Plots Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/app/features/panels/line-plot
- https://docs.wandb.ai/models/app/features/panels/line-plot/reference
**Test Directory:** `tests/playwright/tests/line-plots/`
**Priority:** P0 (most important panel type — default for `wandb.log` metrics)

---

## Tests by Docs Heading

### H2: Add a line plot

#### Test: `add-single-metric-line-plot.spec.ts`
**SDK Setup:** `setup_basic_run.py` (1 run, 50 steps of loss/accuracy/val_loss)
**Heading:** "Single-metric line plot" tab

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Page loads, panels section visible |
| 2 | Click "Add panels" button | Panel picker modal opens |
| 3 | Click "Quick panel builder" | Quick panel builder opens |
| 4 | In the "Single-key panels" tab, add metric "loss" | Metric is selected for panel creation |
| 5 | Click the control to create the selected panel | New panel appears in workspace |
| 6 | Verify a line plot panel for "loss" renders | Selected metric is shown in the workspace |
| 7 | Verify the legend or panel labeling identifies the run | Run identity is visible without inspecting canvas internals |

#### Test: `add-multi-metric-line-plot.spec.ts`
**SDK Setup:** `setup_multi_run.py` (5 runs, metrics with prefixed names like `train/loss`, `train/acc`, `val/loss`, `val/acc`)
**Heading:** "Multi-metric line plot" tab

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Page loads |
| 2 | Click "Add panels" → "Quick panel builder" | Quick panel builder opens |
| 3 | Click "Multi-metric panels" tab | Tab content shows regex input |
| 4 | Enter regex `train/.*` | Live matches show matching metric names |
| 5 | Click "Create N panels" | Panels created for matched metrics |
| 6 | Verify correct number of panels created | Count matches regex hits |

#### Test: `add-multi-metric-regex-groups.spec.ts`
**SDK Setup:** `setup_custom_metrics.py` (runs with `layer_0_loss`, `layer_1_loss`, `layer_10_loss`)
**Heading:** "More about multi-metric regular expressions" → capture groups

| # | Step | Assertion |
|---|---|---|
| 1 | Use capturing group `(layer_0\|layer_10)_loss` | Creates separate panels per group |
| 2 | Use non-capturing group `(?:layer_0\|layer_10)_loss` | Single panel with both metrics |

---

### H2: Edit line plot settings

#### Test: `edit-individual-line-plot.spec.ts`
**SDK Setup:** `setup_basic_run.py`
**Heading:** "Individual line plot"

| # | Step | Assertion |
|---|---|---|
| 1 | Open line plot settings for a named panel | Settings drawer opens with tabs: Data, Grouping, Chart, Legend, Expressions |
| 2 | Verify the settings drawer exposes the documented tabs | Data, Grouping, Chart, Legend, Expressions are visible |
| 3 | Switch to "Chart" tab | Title, axis title fields visible |
| 4 | Change panel title to "My Custom Title" | Preview updates |
| 5 | Click "Apply" | Panel title changes in workspace |

#### Test: `edit-section-line-plots.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "All line plots in a section"

| # | Step | Assertion |
|---|---|---|
| 1 | Open the line plot settings for a named section | Section settings drawer opens |
| 2 | Change "Data" or "Display preferences" | Settings apply to all panels in section |
| 3 | Verify individual panels reflect section settings | Visual check via screenshot |

#### Test: `edit-workspace-line-plots.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "All line plots in a workspace"

| # | Step | Assertion |
|---|---|---|
| 1 | Click workspace settings gear | Settings panel opens |
| 2 | Click "Line plots" | Line plot settings visible |
| 3 | Toggle "Synchronize zooming" | Setting persists |
| 4 | Change smoothing globally | All line plots update |

---

### H2: Visualize average values on a plot

#### Test: `visualize-averaged-runs.spec.ts`
**SDK Setup:** `setup_multi_run.py` (5 runs with similar metrics)
**Heading:** "Visualize average values on a plot"

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Group" in runs sidebar/table | Group options appear |
| 2 | Select "All" | Runs grouped |
| 3 | Verify line plot shows averaged line | Screenshot comparison: individual lines → mean line |
| 4 | Verify variance shading appears | Shaded region visible around mean |

---

### H2: Visualize NaN value on a plot

#### Test: `visualize-nan-values.spec.ts`
**SDK Setup:** `setup_custom_metrics.py` (run that logs `float("nan")` at some steps)
**Heading:** "Visualize NaN value on a plot"

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Find chart for metric with NaN values | Panel exists |
| 3 | Verify chart renders without error | No error overlay on panel |
| 4 | Screenshot for visual verification | NaN gap visible in line |

---

### H2: Compare multiple metrics on one chart

#### Test: `compare-metrics-one-chart.spec.ts`
**SDK Setup:** `setup_basic_run.py` (run with loss + accuracy)
**Heading:** "Compare multiple metrics on one chart"

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Add panels" | Panel picker opens |
| 2 | Select "Line plot" | Config modal opens |
| 3 | Add multiple Y-axis metrics (loss AND accuracy) | Both appear in preview |
| 4 | Click "Apply" | Single panel with two lines |
| 5 | Verify legend shows both metric names | Two entries in legend |

---

### H2: Change the colors of the lines

#### Test: `change-line-colors-from-run-table.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "From the run table" tab

| # | Step | Assertion |
|---|---|---|
| 1 | Open the run-color control for a named run in the runs list | Color palette opens |
| 2 | Select a different color | Run color indicator updates |
| 3 | Verify the line plot uses the updated run color | Screenshot shows new color |

#### Test: `change-line-colors-from-legend.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "From the chart legend settings" tab

| # | Step | Assertion |
|---|---|---|
| 1 | Open line plot settings for a named panel | Settings modal opens |
| 2 | Choose "Legend" tab | Legend settings visible |
| 3 | Modify color settings | Preview updates |

---

### H2: Visualize on different x axes

#### Test: `switch-x-axis-types.spec.ts`
**SDK Setup:** `setup_basic_run.py`
**Heading:** "Visualize on different x axes"

| # | Step | Assertion |
|---|---|---|
| 1 | Open line plot edit modal | Modal with Data tab |
| 2 | Change X-axis from "Step" to "Relative Time (Wall)" | Preview updates |
| 3 | Apply | Chart x-axis changes |
| 4 | Change to "Wall Time" | Chart x-axis changes again |
| 5 | Verify each mode shows different x-axis labels | Screenshot per mode |

#### Test: `custom-x-axis.spec.ts`
**SDK Setup:** `setup_custom_metrics.py` (logs `custom_step` alongside metrics)
**Heading:** "Visualize on different x axes" — custom x-axis code sample

| # | Step | Assertion |
|---|---|---|
| 1 | Open line plot edit modal | Modal opens |
| 2 | Set X-axis to custom metric key | Custom metric appears in dropdown |
| 3 | Apply | Chart uses custom x values |

---

### H2: Zoom

#### Test: `zoom-line-plot.spec.ts`
**SDK Setup:** `setup_basic_run.py`
**Heading:** "Zoom"

| # | Step | Assertion |
|---|---|---|
| 1 | Locate line plot in workspace | Panel visible |
| 2 | Drag across the chart plotting area | Zoom interaction |
| 3 | Verify axes rescale to selected region | Axis labels change to zoomed range |
| 4 | Verify zoom can be reset | Double-click or reset button restores original |

---

### H2: Hide chart legend

#### Test: `hide-chart-legend.spec.ts`
**SDK Setup:** `setup_basic_run.py`
**Heading:** "Hide chart legend"

| # | Step | Assertion |
|---|---|---|
| 1 | Verify legend is visible by default | Legend entries present |
| 2 | Toggle legend visibility off | Legend disappears |
| 3 | Toggle legend visibility on | Legend reappears |

### H2: Create a run metrics notification

#### Test: `run-metrics-notification.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open line plot settings for a named panel | Settings drawer opens |
| 2 | Open the notification or alert creation flow from the panel | Notification UI opens |
| 3 | Configure a threshold or trigger condition for the plotted metric | Condition is accepted |
| 4 | Save the notification | Notification is listed or confirmed in the UI |

---

### Line Plot Reference Settings (from /line-plot/reference)

#### Test: `line-plot-data-settings.spec.ts`
**SDK Setup:** `setup_basic_run.py`
**Heading:** Reference → Data settings

| # | Step | Assertion |
|---|---|---|
| 1 | Open edit modal → Data tab | All data settings visible |
| 2 | Set Y range (min/max) | Chart rescales |
| 3 | Set X range (min/max) | Chart rescales |
| 4 | Change point aggregation to "Full fidelity" | Setting applied |
| 5 | Change smoothing method (EMA → Running average → Gaussian → None) | Chart updates per method |
| 6 | Adjust smoothing coefficient slider | Chart smoothness changes |
| 7 | Toggle "Ignore outliers" | Chart rescales excluding extremes |
| 8 | Change max runs to 5 | Only 5 runs shown |
| 9 | Change chart type (Line → Area → Percentage area) | Chart style changes |

#### Test: `line-plot-grouping-settings.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** Reference → Grouping settings

| # | Step | Assertion |
|---|---|---|
| 1 | Open edit modal → Grouping tab | Grouping controls visible |
| 2 | Enable "Group runs" | Runs aggregated |
| 3 | Set "Group by" to a config column | Groups change |
| 4 | Change aggregation (mean → median → min → max) | Aggregate line changes |
| 5 | Set range display (Min/Max → Std Dev → Std Err → None) | Shading changes |

#### Test: `line-plot-legend-settings.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** Reference → Legend settings

| # | Step | Assertion |
|---|---|---|
| 1 | Open edit modal → Legend tab | Legend template field visible |
| 2 | Customize template with `${run:displayName}` | Legend updates |
| 3 | Add config variable `${config:lr}` | Config value appears in legend |

#### Test: `line-plot-expressions.spec.ts`
**SDK Setup:** `setup_basic_run.py` (metrics: loss, accuracy)
**Heading:** Reference → Expressions

| # | Step | Assertion |
|---|---|---|
| 1 | Open edit modal → Expressions tab | Expression fields visible |
| 2 | Add Y-axis expression (e.g., `loss * 100`) | Derived line appears |
| 3 | Add X-axis expression rescaling | X-axis rescales |

---

## SDK Setup Scripts Required

- `setup_basic_run.py` — 1 run, 50 steps, loss/accuracy/val_loss, config, summary
- `setup_multi_run.py` — 5 runs, varied configs (lr, arch, batch_size), 30 steps each
- `setup_custom_metrics.py` — runs with NaN values, custom x-axes, prefixed metrics (`train/*`, `val/*`, `layer_N_*`)

## Total Tests: 19
