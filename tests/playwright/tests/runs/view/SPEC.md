# Run Detail Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/runs/view-logged-runs
**Test Directory:** `tests/playwright/tests/run-detail/`
**Priority:** P0

---

## Tests by Docs Heading

### H2: Overview tab

#### Test: `run-overview-metadata.spec.ts`
**SDK Setup:** `setup_basic_run.py` (1 run with config, summary, tags)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab content loads |
| 2 | Verify run info section: state badge | State shows "finished" |
| 3 | Verify start time, runtime fields | Non-empty datetime values |
| 4 | Verify hostname, OS, Python version fields | System metadata present |
| 5 | Verify run path with copy button | Path format: `entity/project/run_id` |
| 6 | Verify git repository and git state fields | Git info shown (if available) |
| 7 | Verify command field | Training command displayed |

#### Test: `run-overview-config.spec.ts`
**SDK Setup:** `setup_basic_run.py` (config: lr=0.01, epochs=10, arch="resnet18")

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Scroll to Config section | Config key-value pairs visible |
| 3 | Verify config keys present: lr, epochs, arch | All keys listed |
| 4 | Verify config values match SDK input | lr=0.01, epochs=10, arch="resnet18" |
| 5 | Use search/filter box to search "lr" | Filters to matching config key |
| 6 | Clear search | All config keys visible |

#### Test: `run-overview-summary.spec.ts`
**SDK Setup:** `setup_basic_run.py` (summary: best_accuracy set, loss/accuracy last values)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Scroll to Summary section | Summary key-value pairs visible |
| 3 | Verify custom summary key "best_accuracy" present | Value matches SDK-set value |
| 4 | Verify auto-summary keys (loss, accuracy) present | Last logged values shown |
| 5 | Search for a specific summary key | Filters correctly |

#### Test: `run-overview-editable-fields.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to overview tab | Tab loads |
| 2 | Click notes field ("What makes this run special?") | Field becomes editable |
| 3 | Type a note | Text entered |
| 4 | Save note | Note persists on refresh |
| 5 | Activate the control to add a tag | Tag input appears |
| 6 | Add a tag | Tag chip appears |
| 7 | Use the tag removal control on the chip | Tag removed |

#### Test: `run-overview-artifacts.spec.ts`
**SDK Setup:** `setup_artifacts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Scroll to "Artifact Outputs" section | Artifacts listed |
| 3 | Verify artifact names and types | Match SDK-logged artifacts |
| 4 | Click artifact link | Navigates to artifact detail |

---

### H2: Logs tab

#### Test: `run-logs-tab.spec.ts`
**SDK Setup:** `setup_basic_run.py` (run that produces stdout/stderr output)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Logs tab | Tab loads |
| 2 | Verify terminal-style log viewer | Log lines with line numbers |
| 3 | Toggle timestamp visibility | Timestamps appear/disappear |
| 4 | Search logs by keyword | Matching lines highlighted |
| 5 | Click "Copy to clipboard" button | Logs copied |
| 6 | Click "Download" button | Log file downloads |
| 7 | Verify `wandb:` prefix lines visible | Info-level logs present |

---

### H2: Code tab

#### Test: `run-code-tab.spec.ts`
**SDK Setup:** `setup_basic_run.py` (run with saved code)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Code tab | Tab loads |
| 2 | Verify saved source files or notebook content are visible | Code content renders |
| 3 | Open a code file | File contents display |

---

### H2: Files tab

#### Test: `run-files-tab.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Files tab | Tab loads |
| 2 | Verify file browser table visible | File list shown |
| 3 | Verify breadcrumb trail (root > ...) | Breadcrumbs clickable |
| 4 | Click into a subdirectory | Breadcrumb updates, files change |
| 5 | Navigate back via breadcrumb | Returns to parent |

---

### H2: Artifacts tab (run-scoped)

#### Test: `run-artifacts-tab.spec.ts`
**SDK Setup:** `setup_artifacts.py` (run that produces and consumes artifacts)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Artifacts tab | Tab loads |
| 2 | Verify input artifacts listed | Consumed artifacts shown |
| 3 | Verify output artifacts listed | Produced artifacts shown |
| 4 | Click an artifact link | Navigates to artifact detail |

---

### Tab navigation

#### Test: `run-detail-tab-navigation.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail page | Default tab loads (Overview) |
| 2 | Verify tab bar with: Overview, Logs, Files, Code, Artifacts | All documented tabs present |
| 3 | Click each tab | Content changes, URL updates |
| 4 | Verify back arrow navigates to project | Navigation works |
| 5 | Verify run name and state badge in header | Correct run info displayed |
| 6 | Verify the run color indicator in the header | Run color shown |

---

## SDK Setup Scripts Required

- `setup_basic_run.py`
- `setup_artifacts.py`

## Total Tests: 10
