# Run Display, Search & Colors Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/runs/customize-run-display
- https://docs.wandb.ai/models/runs/search-runs
- https://docs.wandb.ai/models/runs/color-code-runs
- https://docs.wandb.ai/models/runs/delete-runs
- https://docs.wandb.ai/models/runs/stop-runs
- https://docs.wandb.ai/models/runs/forking
- https://docs.wandb.ai/models/runs/rewind
- https://docs.wandb.ai/models/runs/resuming

**Test Directory:** `tests/playwright/tests/run-display-and-search/`
**Priority:** P1

---

## Customize Run Display (from /runs/customize-run-display)

### H2: Manage columns

#### Test: `manage-columns-add-remove.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Runs tab | Table loads |
| 2 | Click the "Columns" control | Columns modal opens |
| 3 | Select property from "Hidden" section | Column appears in table |
| 4 | Drag column to reorder in modal | Column position changes |
| 5 | Close modal | Columns reflect changes |
| 6 | Reopen Columns → deselect a visible column | Column hidden |

#### Test: `manage-columns-move-pin.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Drag a column left/right in the table | Column repositions |
| 2 | Open "Columns" and pin a column from the column management UI | Column pins to left side |
| 3 | Verify pinned columns on left, unpinned on right | Layout correct |
| 4 | Use the column actions menu to unpin the column | Column unpins |
| 5 | Use the column actions menu to hide the column | Column disappears |
| 6 | Verify pin state syncs between Runs and Workspace tabs | Cross-tab consistency |

### H2: Sort runs by column

#### Test: `sort-by-column-with-aggregation.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the column actions menu | Options appear |
| 2 | Select "Show latest" dropdown → choose "Max" | Aggregation changes |
| 3 | Click "Sort ascending" | Rows reorder by max value ascending |
| 4 | Verify sort persists in Workspace tab Runs selector | Cross-tab persistence |

### H2: Export runs table to CSV

#### Test: `export-runs-csv.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Runs tab | Table loads |
| 2 | Click the Download control | CSV file downloads |
| 3 | Verify downloaded file is valid CSV | File contains run data |

---

## Search Runs (from /runs/search-runs)

### H2: Search for runs by name or ID

#### Test: `search-runs-by-name.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Runs tab | Table loads, all runs visible |
| 2 | Click search box at top | Search active |
| 3 | Type partial run name | Runs filter to matches |
| 4 | Type run ID | Specific run shown |
| 5 | Clear search | All runs visible again |

### H2: Turn off regular expressions search

#### Test: `search-runs-regex-toggle.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Verify regex toggle (.*) is active by default | Toggle enabled |
| 2 | Enter regex pattern (e.g., `run-\d+`) | Pattern matches filtered |
| 3 | Click regex toggle to disable | Toggle grays out |
| 4 | Same input treated as literal string | Different results |

---

## Color-Code Runs (from /runs/color-code-runs)

### H2: Turn on key-based colors

#### Test: `key-based-run-coloring.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Charts load |
| 2 | Open Settings → "Runs" section | Run color settings visible |
| 3 | Enable "Key-based colors" | Color mode changes |
| 4 | Select Key (e.g., "loss") | Key dropdown populated |
| 5 | Select Y value (Latest/Max/Min) | Option selected |
| 6 | Set bucket count (e.g., 4) | Buckets configured |
| 7 | Verify runs colored by buckets | Darker = higher loss, lighter = lower |
| 8 | Verify chart lines match bucket colors | Color consistency |

### H2: Set a metric / configuration key

#### Test: `color-by-config-key.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Enable key-based colors | Active |
| 2 | Set Key to config parameter (e.g., "lr") | Config keys available in dropdown |
| 3 | Verify runs colored by config value buckets | Color mapping correct |

---

## Delete Runs (from /runs/delete-runs)

#### Test: `delete-runs.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Runs tab | All runs visible |
| 2 | Select runs via checkboxes | Runs selected |
| 3 | Click the delete-runs control | Confirmation dialog appears |
| 4 | Confirm deletion | Runs removed from table |
| 5 | Verify run count decreased | Count updated |

---

## Stop Runs (from /runs/stop-runs)

#### Test: `stop-run-from-ui.spec.ts`
**SDK Setup:** Custom script that creates a long-running run (still "Running")

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to running run → Overview tab | State shows "Running" |
| 2 | Click the stop-run control | Run begins stopping |
| 3 | Verify state transitions to "Killed" | State badge updates |

---

## Fork a Run (from /runs/forking)

#### Test: `fork-run-display.spec.ts`
**SDK Setup:** Custom script that forks a run at step 200

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to forked run → Overview tab | Overview loads |
| 2 | Verify "Forked From" field shows source run | Source run link present |
| 3 | Click source run link | Navigates to original run |
| 4 | Navigate to forked run → Charts tab | Charts show data from fork point onward |

---

## Rewind a Run (from /runs/rewind)

#### Test: `rewind-run-display.spec.ts`
**SDK Setup:** Custom script that rewinds a run

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to rewound run → Overview tab | Overview loads |
| 2 | Verify "Forked From" field shows rewind history | History chain visible |
| 3 | Click link to access archived source run | Navigates to archive |

---

## Resume a Run (from /runs/resuming)

#### Test: `resumed-run-display.spec.ts`
**SDK Setup:** Custom script that creates a run, finishes it, then resumes it

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to resumed run → Charts tab | Charts visible |
| 2 | Verify metrics continue from where the run left off | No gap in step sequence |
| 3 | Verify run shows as single continuous run | Not two separate runs |

---

## SDK Setup Scripts Required

- `setup_multi_run.py`
- Custom scripts for stop/fork/rewind/resume (or extend `setup_multi_run.py`)

## Total Tests: 14
