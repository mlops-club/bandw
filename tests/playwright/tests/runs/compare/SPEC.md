# Pin & Compare Runs Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/runs/compare-runs
**Test Directory:** `tests/playwright/tests/compare-runs/`
**Priority:** P1

---

## Tests by Docs Heading

### H2: Pin runs

#### Test: `pin-runs.spec.ts`
**SDK Setup:** `setup_multi_run.py` (5+ runs)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Runs sidebar visible |
| 2 | Open the actions menu for a run and choose "Pin run" | Run moves to pinned section at top |
| 3 | Verify the run is marked as pinned | Pinned state is visible |
| 4 | Verify visual divider separates pinned from unpinned | Divider present |
| 5 | Pin additional runs (up to 6) | All pinned runs at top |
| 6 | Attempt to pin a 7th run | Pin action disabled or error shown |
| 7 | Use the unpin control for the pinned run | Run returns to unpinned section |
| 8 | Apply filter/sort | Pinned runs persist at top regardless |

---

### H2: Manage the baseline run

#### Test: `set-baseline-run.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "Set a baseline run"

| # | Step | Assertion |
|---|---|---|
| 1 | Open the actions menu for a run and choose "Set as baseline" | Run positioned at very top |
| 2 | Verify the run is marked as baseline | Baseline state is visible |
| 3 | Verify visual divider below baseline | Divider present |
| 4 | Verify line plots show baseline as bolder line | Screenshot: thicker line for baseline |

#### Test: `change-baseline-run.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "Change the baseline run"

| # | Step | Assertion |
|---|---|---|
| 1 | Set run A as baseline | Run A is baseline |
| 2 | Open run B's actions menu and choose "Replace baseline" | Run B becomes baseline |
| 3 | Verify run A becomes pinned automatically | Run A remains visible as a pinned run |
| 4 | Verify run B is marked as baseline | Baseline indicator is visible |

#### Test: `remove-baseline.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "Remove the baseline designation"

| # | Step | Assertion |
|---|---|---|
| 1 | Set baseline run | Baseline active |
| 2 | Open the baseline run actions menu and choose "Remove baseline" | Baseline designation removed |
| 3 | Verify previous baseline becomes pinned automatically | Pinned state appears |
| 4 | Unpin manually | Run returns to normal list |

---

### H2: Compare runs to the baseline

#### Test: `baseline-comparison-tooltips.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "Compare runs to the baseline" — hover interactions

| # | Step | Assertion |
|---|---|---|
| 1 | Set baseline and pin 2 other runs | Baseline + pinned runs visible in chart |
| 2 | Hover over line plot | Tooltip shows all visible run values |
| 3 | Highlight the baseline run from the legend or tooltip context | Baseline styling is visually distinct from the other runs |
| 4 | Highlight a non-baseline run from the legend or tooltip context | That run is emphasized relative to the baseline |

---

### H3: Summary metric deltas

#### Test: `summary-metric-deltas.spec.ts`
**SDK Setup:** `setup_multi_run.py`
**Heading:** "Summary metric deltas"

| # | Step | Assertion |
|---|---|---|
| 1 | Set baseline run | Baseline active |
| 2 | Verify delta values appear in runs table (right of metric values) | Delta column visible |
| 3 | Open the metric column settings and set "Higher values are best" | Directionality set |
| 4 | Verify outperforming runs: dark red text, light red background | Color coding correct |
| 5 | Verify underperforming runs: dark teal text, light teal background | Color coding correct |
| 6 | Change directionality to "Lower values are best" | Colors swap (for a loss metric) |

---

### H2: Hide summary metric deltas in a workspace

#### Test: `hide-metric-deltas.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Set baseline (deltas visible in table) | Deltas shown |
| 2 | Click workspace Settings → "Runs" drawer | Settings open |
| 3 | Toggle "Show value deltas in the runs table" off | Deltas disappear |
| 4 | Toggle back on | Deltas reappear |

---

### H2: Example workflow

#### Test: `compare-runs-full-workflow.spec.ts`
**SDK Setup:** `setup_multi_run.py` (runs simulating hyperparameter tuning with different lr values)
**Heading:** "Example workflow"

| # | Step | Assertion |
|---|---|---|
| 1 | Identify run with baseline config | Run visible |
| 2 | Set as baseline | Baseline active |
| 3 | Verify the baseline remains visible at the top of the run list | Baseline is implicitly pinned |
| 4 | Review metric deltas in table | Delta values visible |
| 5 | Identify best-performing run by delta | Highest accuracy run found |
| 6 | Pin best-performing run | Both baseline and best pinned |
| 7 | Compare in line plot | Both runs prominent in chart |
| 8 | Screenshot final state | Visual verification |

---

### H2: Limitations

#### Test: `compare-runs-limitations.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Set baseline | Baseline active in line plots |
| 2 | Add a bar chart panel | Bar chart renders |
| 3 | Verify baseline NOT specially styled in bar chart | No bold/dashed distinction |
| 4 | Group runs | Verify pinned/baseline not visually distinct in grouped view |

---

## SDK Setup Scripts Required

- `setup_multi_run.py`

## Total Tests: 9
