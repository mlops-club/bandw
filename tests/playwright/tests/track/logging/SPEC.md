# Logging Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/track/log
- https://docs.wandb.ai/models/track/log/customize-logging-axes

**Priority:** P0

---

## Automatically logged data

### Test: `automatically-logged-data.spec.ts`
**SDK Setup:** `setup.py` (basic run with standard W&B initialization)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Overview loads |
| 2 | Verify automatically logged metadata such as state, runtime, and host information are present | Auto-logged fields are visible |

## What data is logged with specific W&B API calls?

### Test: `api-call-data-surfaces.spec.ts`
**SDK Setup:** `setup.py` (logs config, metrics, summary values, and files through the documented APIs)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace and run detail | Relevant UI surfaces load |
| 2 | Verify config values appear in Config, metrics appear in charts, and summary values appear in Summary | Each API call's data reaches the expected UI surface |

## Common workflows

### Test: `metrics-in-workspace.spec.ts`
**SDK Setup:** `setup.py` (logs loss, accuracy, val_loss over 50 steps)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Panels load |
| 2 | Verify line chart for "loss" exists | Panel with loss title |
| 3 | Verify line chart for "accuracy" exists | Panel with accuracy title |
| 4 | Verify line chart for "val_loss" exists | Panel with val_loss title |
| 5 | Verify each chart has data points | Lines render (screenshot) |

### Test: `multiple-metrics.spec.ts`
**SDK Setup:** `setup.py` (`run.log({"loss": 0.5, "accuracy": 0.8, "learning_rate": 0.01})`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Verify all three metrics have separate panels | 3 panels present |
| 3 | Verify same x-axis step for all | Step values aligned |

## Metric naming constraints

### Test: `metric-naming.spec.ts`
**SDK Setup:** `setup.py` (metrics with valid names: accuracy, val_loss, modelAccuracy)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Verify panels exist for all validly-named metrics | Panels created |
| 3 | Verify panel titles match metric names exactly | No mangling |

## Custom logging axes (from /track/log/customize-logging-axes)

### Test: `custom-x-axis.spec.ts`
**SDK Setup:** `setup.py` (uses `define_metric("validation_loss", step_metric="epoch")`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Locate "validation_loss" chart | Panel exists |
| 3 | Verify x-axis label is "epoch" (not "Step") | Custom x-axis applied |

### Test: `define-metric-glob.spec.ts`
**SDK Setup:** `setup.py` (uses `define_metric("train/*", step_metric="train/step")`)

| # | Step | Assertion |
|---|---|---|
| 1 | Verify "train/loss" chart uses "train/step" x-axis | Glob pattern applied |
| 2 | Verify "train/accuracy" uses same custom x-axis | Pattern matches multiple metrics |
| 3 | Verify "val/loss" uses default Step x-axis | Non-matching metric unaffected |

## Best practices and tips

### Test: `logging-best-practices-surface.spec.ts`
**SDK Setup:** `setup.py` (logs independent config values and dependent metrics separately)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview and workspace views | Both surfaces load |
| 2 | Verify config values remain in Config while metrics render in charts and summary surfaces | UI separation matches the documented guidance |

## Total Tests: 8
