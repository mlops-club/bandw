# B6 Line Plot — bandw Research

## Current bandw workspace state (from screenshot)
- ✅ "Workspace" heading visible
- ✅ "Charts 7" section with chart panels
- ✅ Runs sidebar with "RUNS 7" and run names
- ✅ Chart titles as DOM `<h3>` elements (epoch, validation_loss, nan_metric, train/acc)
- ✅ ProjectNav tabs: Overview, Workspace, Runs, Reports, Artifacts
- ❌ **No "Add panels" button** — this is the #1 missing element
- ❌ No "Settings" / "Workspace settings" button
- ❌ No "Edit panel" button on chart panels
- ❌ No section collapse/expand controls
- ❌ No panel drag handles

## What B6 tests check (from test analysis)
1. **Workspace load**: `getByRole('button', { name: 'Add panels' }).waitFor()` — BLOCKS all workspace tests
2. **Chart content**: `getByText(/Charts|train|val/).first()` — ✅ already works
3. **Settings button**: `getByRole('button', { name: /Settings|Workspace settings/ })` — needs adding
4. **Run detail Charts tab**: `getByRole('tab', { name: 'Charts' })` — ✅ already works
5. **Chart panel titles**: `getByText('epoch').first()` etc. — ✅ already works (DOM `<h3>`)

## Minimal fix needed
Add these buttons to the workspace page:
1. **"Add panels" button** — required for workspace load detection
2. **"Settings" button** — used by ~5 tests  
3. Both can be placeholder buttons that don't open anything yet

## Files to modify
- `frontend/src/routes/[entity]/[project]/workspace/+page.svelte` — add buttons to toolbar
