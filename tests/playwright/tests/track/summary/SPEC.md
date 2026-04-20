# Summary Metrics Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/track/log/log-summary
**Priority:** P0

---

## Log summary metrics

### Test: `summary-in-overview.spec.ts`
**SDK Setup:** `setup.py` (sets `run.summary["best_accuracy"] = 0.95`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Scroll to Summary section | Summary visible |
| 3 | Verify "best_accuracy" key with value 0.95 | Custom summary present |
| 4 | Verify auto-generated summary keys (loss, accuracy) | Last values present |

### Test: `summary-in-table.spec.ts`
**SDK Setup:** `setup.py` (multiple runs with different summary values)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to runs table | Table loads |
| 2 | Verify summary columns exist (loss, accuracy, best_accuracy) | Columns visible |
| 3 | Verify values differ across runs | Each run has its own summary |
| 4 | Sort by best_accuracy descending | Runs reorder correctly |

## Customize summary metrics

### Test: `custom-aggregation.spec.ts`
**SDK Setup:** `setup.py` (uses `define_metric("loss", summary="min")`, `define_metric("accuracy", summary="max")`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview → Summary | Summary visible |
| 2 | Verify "loss" summary shows minimum value across all steps | Min value correct |
| 3 | Verify "accuracy" summary shows maximum value across all steps | Max value correct |
| 4 | Verify in runs table the same aggregated values appear as columns | Table matches |

## Total Tests: 3
