# Run Management Test Plan (Tags, Grouping, Move)

**W&B Docs Pages:**
- https://docs.wandb.ai/models/runs/tags
- https://docs.wandb.ai/models/runs/grouping
- https://docs.wandb.ai/models/runs/manage-runs
- https://docs.wandb.ai/models/runs/run-states

**Priority:** P1

---

## Tags (from /runs/tags)

### H2: Add tags to one or more runs

#### Test: `add-tags-project.spec.ts`
**SDK Setup:** `setup.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to runs table | Table loads |
| 2 | Select multiple runs via checkboxes | Runs selected |
| 3 | Click "Tag" button | Tag interface appears |
| 4 | Type a new tag name | Tag created |
| 5 | Select existing tags via checkboxes | Tags applied |
| 6 | Verify tag chips appear on selected runs | Tags visible in table |

#### Test: `add-tags-run.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Activate the control to add a tag | Tag input appears |
| 3 | Add a tag | Tag chip appears |
| 4 | Add another tag | Multiple tags shown |

#### Test: `add-tags-sdk.spec.ts`
**SDK Setup:** `setup.py` (run initialized with `tags=["baseline", "v1"]`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Verify tags "baseline" and "v1" appear as chips | SDK-set tags visible |

### H2: Remove tags

#### Test: `remove-tags.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Select runs in table → Tag button → deselect a tag | Tag removed |
| 2 | Navigate to individual run → Overview | Tags visible |
| 3 | Use the tag removal control on a tag chip | Tag removed from run |

---

## Grouping (from /runs/grouping)

#### Test: `group-runs-ui.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Group" button | Group options appear |
| 2 | Select runs → "Move to group" | Group selection dialog |
| 3 | Create a new group | Runs grouped under header |

#### Test: `group-runs-sdk.spec.ts`
**SDK Setup:** `setup.py` (3 groups: A, B, C with 3 runs each)

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Group" → select by group name | Groups visible |
| 2 | Verify 3 group headers (A, B, C) | Names match SDK |
| 3 | Expand group A | 3 nested runs visible |

#### Test: `group-by-job-type.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Click "Group" → select "Job Type" | Runs grouped by job type |
| 2 | Verify "training" and "evaluation" headers | Both types present |

#### Test: `move-between-groups.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Select runs from group A | Runs selected |
| 2 | Click "Move to group" → select group B | Runs move |
| 3 | Verify counts changed | A fewer, B more |

#### Test: `delete-group.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Group runs so a named group exists | Group header is visible |
| 2 | Use the group actions menu to delete the group | Group is removed |
| 3 | Verify runs remain visible outside the deleted group | Runs are still accessible |

---

## Run States (from /runs/run-states)

#### Test: `run-state-display.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to runs table | All runs visible |
| 2 | Verify "Finished" badge | State badge correct |
| 3 | Verify "Crashed" badge | State badge correct |
| 4 | Navigate to run Overview | State field matches |

---

## Move Runs (from /runs/manage-runs)

#### Test: `move-to-project.spec.ts`

| # | Step | Assertion |
|---|---|---|
| 1 | Select runs via checkboxes | Runs selected |
| 2 | Click "Move to project" | Destination picker |
| 3 | Select destination | Runs moved |
| 4 | Verify in destination | Moved runs visible |

## Total Tests: 11
