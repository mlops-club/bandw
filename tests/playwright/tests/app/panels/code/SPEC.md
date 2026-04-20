# Code Panels Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/panels/code
**Priority:** P2

---

## Save library code

### Test: `log-code-files.spec.ts`
**SDK Setup:** `setup.py` (run created with `run.log_code(".")`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Files tab | File browser loads |
| 2 | Locate the saved code files | Logged source files are visible |
| 3 | Open one saved source file | File contents render |

### Test: `code-dir-files.spec.ts`
**SDK Setup:** `setup.py` (run created with `wandb.init(settings=..., code_dir=...)`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Files tab | File browser loads |
| 2 | Verify files from the configured code directory are present | Code directory contents are visible |

### Test: `ui-code-saving-setting.spec.ts`
**SDK Setup:** `setup.py` (project with code-saving enabled from the UI or workspace defaults)

| # | Step | Assertion |
|---|---|---|
| 1 | Open the workspace or project settings surface that exposes code saving | Setting is visible |
| 2 | Verify code saving can be enabled or is already enabled for the test project | Setting state is shown |
| 3 | Navigate to a run created after enabling the setting | Saved code is visible in the run UI |

## Code Comparer

### Test: `code-comparer.spec.ts`
**SDK Setup:** `setup.py` (multiple runs with code saving enabled)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Page loads |
| 2 | Start the "Add panels" flow and choose "Code" by accessible name | Code comparer panel added |
| 3 | Verify side-by-side code diff display | Two columns showing code |
| 4 | Select different runs for comparison | Code content changes |

## Jupyter Session History

### Test: `jupyter-artifact.spec.ts`
**SDK Setup:** Custom script run from Jupyter-like context

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts tab → code artifact | Artifact visible |
| 2 | Click "Files" tab | File list shown |
| 3 | Verify executed notebook cells visible | Cell content displayed |

## Total Tests: 5
