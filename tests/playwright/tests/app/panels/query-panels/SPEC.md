# Query Panels Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/panels/query-panels
**Priority:** P2

---

## Create a Query Panel

### Test: `create.spec.ts`
**SDK Setup:** `setup.py` (run with tables logged)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Page loads |
| 2 | Click "Add panel" → "Query panel" | Query panel added |
| 3 | Verify expression editor visible | Editor present |
| 4 | Type `runs.summary["table_name"]` | Expression accepted |
| 5 | Verify result renders as table or plot | Visualization appears |

## Query Components

### Test: `expressions.spec.ts`
**SDK Setup:** `setup.py` (run with tables logged)

| # | Step | Assertion |
|---|---|---|
| 1 | Create a query panel | Query panel is visible |
| 2 | Enter a table-query expression from the docs example | Expression evaluates successfully |
| 3 | Verify the result panel renders the returned data | Result panel is populated |

## Query Panel Operations

### Test: `operations.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Create query panel with runs data | Data displayed |
| 2 | Sort by column header | Rows reorder |
| 3 | Click filter button → add filter | Rows narrow |
| 4 | Use groupby on a field | Data aggregated |
| 5 | Apply a `map` operation | Derived values render |
| 6 | Apply a `concat` operation | Combined rows render |
| 7 | Apply a `join` operation | Joined data render |

## Query Panel Configuration

### Test: `config.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the panel configuration drawer for the query panel | Configuration panel opens |
| 2 | Change panel type (table → plot) | Rendering changes |
| 3 | Verify `runs` variable auto-injected | Expression works |

### Test: `result-panels.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Create a query panel with a table result | Table result panel renders |
| 2 | Change the result panel to a plot-capable visualization | Plot result panel renders |

## Access Artifacts via Query

### Test: `artifacts.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Use `artifactVersion()` in expression | Artifact data returned |
| 2 | Verify artifact files/metadata accessible | Data renders |

## Runs object

### Test: `runs-object.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Create a query panel using the injected `runs` object | Runs data is returned |
| 2 | Verify run summary and config fields are queryable | Data renders in the result panel |

## Total Tests: 7
