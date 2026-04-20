# Tables Advanced Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/tables/log_tables (logging modes)
- https://docs.wandb.ai/models/tables/tables-walkthrough
- https://docs.wandb.ai/models/tables/tables-download

**Test Directory:** `tests/playwright/tests/tables-advanced/`
**Priority:** P2

---

## Table Logging Modes (from /tables/log_tables)

### Create and log a table

#### Test: `table-create-and-log.spec.ts`
**SDK Setup:** `setup_media_run.py` (creates and logs a basic table)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace or artifact | Table panel or artifact is visible |
| 2 | Verify the newly logged table can be opened | Table contents render |

### IMMUTABLE Mode

#### Test: `table-immutable-mode.spec.ts`
**SDK Setup:** `setup_media_run.py` (logs table with `log_mode="IMMUTABLE"`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace or artifact | Table panel visible |
| 2 | Verify all rows rendered | Row count matches SDK data |
| 3 | Verify table is read-only (cannot be modified) | No edit controls |

### MUTABLE Mode

#### Test: `table-mutable-mode.spec.ts`
**SDK Setup:** Custom script (logs table with `log_mode="MUTABLE"`, adds columns mid-run)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Table panel visible |
| 2 | Verify table shows all rows including additions | Complete data |
| 3 | Verify newly added columns present | Column count matches final state |

### INCREMENTAL Mode

#### Test: `table-incremental-mode.spec.ts`
**SDK Setup:** Custom script (logs table with `log_mode="INCREMENTAL"` across multiple steps)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Table panel visible |
| 2 | Verify step-through capability | Can view table at different increments |
| 3 | Verify rows accumulate across increments | Later increments have more rows |
| 4 | Verify max 100 increments limit respected | UI handles limit gracefully |

---

## Tables Download (from /tables/tables-download)

#### Test: `table-download.spec.ts`
**SDK Setup:** `setup_media_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to table view | Table visible |
| 2 | Open the table export or actions menu | Export options appear |
| 3 | Select download option | File downloads |

#### Test: `table-convert-to-artifact.spec.ts`
**SDK Setup:** `setup_media_run.py` (table logged as or converted to an artifact)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to the artifact created from the table | Artifact detail loads |
| 2 | Verify the converted table data is available from the artifact UI | Table-backed artifact is accessible |

---

## SDK Setup Scripts Required

- `setup_media_run.py`
- Custom scripts for mutable/incremental modes

## Total Tests: 6
