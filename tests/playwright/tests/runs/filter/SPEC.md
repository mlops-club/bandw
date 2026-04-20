# Run Filtering Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/runs/filter-runs
**Priority:** P1

---

## H2: Common operators by type

### Test: `filter-operators-by-type.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the filter builder | Filter UI is visible |
| 2 | Select a string field, numeric field, and tag field in turn | Operator choices change by field type |
| 3 | Verify each field type exposes the documented operators | Operator list matches the field type |

## H2: Create a filter expression

### Test: `filter-by-state.spec.ts`
**SDK Setup:** `setup.py` (mix of finished and crashed runs)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Runs tab | All runs visible |
| 2 | Click Filter button | Filter builder opens |
| 3 | Select column: "State", operator: "=", value: "finished" | Filter applied |
| 4 | Verify only finished runs shown | No crashed runs visible |
| 5 | Change value to "crashed" | Only crashed runs shown |

### Test: `filter-by-metric.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Click Filter → New filter | Three dropdowns appear |
| 2 | Set: summary.loss <= 0.5 | Runs with high loss filtered out |
| 3 | Verify remaining runs all have loss <= 0.5 | Values verified |

## H3: Filter runs with tags

### Test: `filter-by-tags.spec.ts`
**SDK Setup:** `setup.py` (some runs tagged "baseline")

| # | Step | Assertion |
|---|---|---|
| 1 | Select "Tags" field | Tags operator appears |
| 2 | Set "tags is baseline" | Only tagged runs shown |
| 3 | Change to "tags is not baseline" | Non-tagged runs shown |

## H2: Default filters

### Test: `default-filters.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Check for "Show only my work" toggle | Toggle exists |
| 2 | Check for "Hide crashed runs" toggle | Toggle exists |
| 3 | Toggle "Hide crashed runs" on | Crashed runs disappear |
| 4 | Toggle off | Crashed runs reappear |

## H2: Remove a filter

### Test: `remove-filter.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Create a filter | Filter chip or row is visible |
| 2 | Remove the filter using the filter removal control | Runs return to the unfiltered state |

## Total Tests: 6
