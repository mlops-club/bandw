# Run Comparer Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/panels/run-comparer
**Test Directory:** `tests/playwright/tests/run-comparer/`
**Priority:** P1

---

## Tests by Docs Heading

### H2: Add a Run Comparer panel

#### Test: `add-run-comparer.spec.ts`
**SDK Setup:** `setup_multi_run.py` (5 runs with different configs)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Page loads |
| 2 | Click "Add panels" | Panel picker opens |
| 3 | Expand "Evaluation" section | Run comparer option visible |
| 4 | Select "Run comparer" | Panel added |
| 5 | Verify panel shows columns (one per visible run) | Column count matches visible runs (up to 10) |
| 6 | Verify config keys appear as rows | Config parameters listed |
| 7 | Verify metric values appear as rows | Summary metrics listed |

---

### H2: Use Run Comparer

#### Test: `run-comparer-search.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Locate run comparer panel | Panel visible |
| 2 | Type a config key name in search field | Rows filter to matching keys |
| 3 | Clear search | All rows reappear |
| 4 | Search for metadata key (e.g., "Python") | Metadata rows appear |

#### Test: `run-comparer-diff-only.spec.ts`
**SDK Setup:** `setup_multi_run.py` (runs with some identical and some different config values)

| # | Step | Assertion |
|---|---|---|
| 1 | Locate run comparer panel | Panel visible, all rows shown |
| 2 | Toggle "Diff only" on | Identical rows hidden |
| 3 | Verify only differing values remain | Row count decreases |
| 4 | Toggle "Diff only" off | All rows reappear |

#### Test: `run-comparer-formatting.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Click column width adjustment buttons | Columns widen/narrow |
| 2 | Click row height adjustment buttons | Rows grow/shrink |
| 3 | Hover over a value | Copy button appears |
| 4 | Click copy button | Value copied to clipboard |

#### Test: `run-comparer-dynamic-update.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Note visible runs in run comparer | N columns shown |
| 2 | Toggle a run's visibility off in sidebar | Column disappears from comparer |
| 3 | Toggle run back on | Column reappears |
| 4 | Filter runs in sidebar by name | Comparer updates to show only matching runs |

---

## SDK Setup Scripts Required

- `setup_multi_run.py`

## Total Tests: 5
