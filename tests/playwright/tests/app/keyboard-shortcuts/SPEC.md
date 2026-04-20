# Keyboard Shortcuts Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/keyboard-shortcuts
**Test Directory:** `tests/playwright/tests/keyboard-shortcuts/`
**Priority:** P2

---

## Tests by Shortcut Category

### Workspace Management

#### Test: `keyboard-undo-redo.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Workspace loads |
| 2 | Delete a panel | Panel removed |
| 3 | Press Cmd+Z / Ctrl+Z | Panel restored (undo) |
| 4 | Press Cmd+Shift+Z / Ctrl+Y | Panel removed again (redo) |

### Navigation

#### Test: `keyboard-navigation.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Press Cmd+J / Ctrl+J | Switches between Workspaces/Runs tabs |
| 2 | Press Cmd+. / Ctrl+. | Minimizes runs selector |
| 3 | Press again | Restores runs selector |
| 4 | Open full-screen panel | Panel fills screen |
| 5 | Press Esc | Exits full-screen |

### Panel Navigation

#### Test: `keyboard-panel-navigation.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open panel in full-screen | Full-screen active |
| 2 | Press Right Arrow | Next panel in section |
| 3 | Press Left Arrow | Previous panel |
| 4 | Press Esc | Exits full-screen |

### Media Panel Shortcuts

#### Test: `keyboard-media-shortcuts.spec.ts`
**SDK Setup:** `setup_media_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open image panel in full-screen | Image visible |
| 2 | Press Cmd/Ctrl + "+" | Zooms in |
| 3 | Press Cmd/Ctrl + "-" | Zooms out |
| 4 | Press Cmd/Ctrl + 0 | Resets to 100% |
| 5 | Press Shift+L | Zooms to fit |
| 6 | Press Cmd/Ctrl + Left/Right Arrow | Moves step slider |

### Reports

#### Test: `keyboard-reports-shortcuts.spec.ts`
**SDK Setup:** `setup_basic_run.py` + create a report

| # | Step | Assertion |
|---|---|---|
| 1 | Open a report in edit mode | Editable report loads |
| 2 | Use the documented report keyboard shortcut to open the block insertion or slash-command flow | Report command UI opens |
| 3 | Use the documented report navigation shortcut | Focus or selection moves as documented |

### Notes

#### Test: `keyboard-notes-shortcuts.spec.ts`
**SDK Setup:** `setup_basic_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open a notes-capable surface such as a run overview or project notes field | Notes field has focus |
| 2 | Use the documented notes shortcut for formatting or navigation | Visible notes behavior matches the docs |

---

## SDK Setup Scripts Required

- `setup_basic_run.py`
- `setup_media_run.py`

## Total Tests: 6
