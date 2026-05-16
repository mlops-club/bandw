# Frontend Architecture Overhaul — Research

## Key Findings

### Workspace Monolith (Q1-Q6)
- **60 `$state` variables** in workspace/+page.svelte. ~15 should move to components (panel menu state, section rename, panel picker category). Core editing state (undo/redo, deleted panels/sections) stays at page level.
- **Undo/redo** is a simple `{ type, data }` stack. Keep at page level; extracted components call a shared `pushUndo()` function via props.
- **View persistence**: `UPSERT_VIEW_MUTATION` already accepts `spec: JSONString` — can store full workspace layout as JSON. Currently only localStorage is used (line 180-191).
- **7 natural component boundaries**: RunsSidebar, PanelPicker, ChartSection, PanelCard, PanelEditModal, WorkspaceSettings, FullScreenPanel. Dependencies are manageable via props.
- **`duplicatedPanels`** stays at page level; ChartSection filters by section.

### Strict Mode Collisions (Q7-Q11)
- **10+ `.or()` collision patterns** across failing tests. Categories:
  - Table h3 title + `<table>` element (5 tests)
  - Label text + input element (3 tests — ParameterImportance, CustomChartPanel)
  - Multiple data cells (2 tests — "cat"/"dog")
  - Run name containing chart title substring (fixed with `::after` trick)
- **Panel button opacity**: `0.15` at workspace line 1204. Playwright requires `opacity > 0` for visibility. `opacity: 1` is better UX.
- **`[class*="panel"]` locator**: First match is `.panel-search` (line 438), not chart panels.

### Component Semantics (Q12-Q15)
- **ParameterImportance**: Uses `role="listbox"` but test expects `role="combobox"`. Dual `aria-label="metric"` on both label (line 99) and listbox div (line 102) causes strict mode. Fix: remove label's aria-label, wrap listbox in combobox.
- **CustomChartPanel**: Native `<select>` doesn't expose `role="option"`. Replace with custom combobox+listbox+option buttons for test compatibility.
- Labels already removed from query-editor and chart-type-select (previous session).

### Artifact Detail (Q16-Q20)
- **Backend mutations exist**: `deleteArtifact(artifactID: ID!, deleteAliases: Boolean)`, `updateArtifact`, `deleteArtifactSequence` — all wired in schema.go and artifact_mutations.go.
- **ArtifactCollection `__typename` issue**: SDK expects "ArtifactSequence" or "ArtifactPortfolio" but backend returns "ArtifactCollection". Needs interface refactor or type rename.
- **Files connection**: Query includes `files(first:100)` with `directUrl` and `url` — backend resolver should populate these.
- **Missing UI**: Delete button + confirmation dialog, directory browsing in Files tab, alias display in overview.
- **Version navigation**: Already stays on versions tab (earlier fix removed tab switch on click).

### GraphQL Wiring (Q21-Q25)
- **`spec` field**: `JSONString` scalar, no size limits. Can store full workspace layout JSON.
- **View ID**: Returned after creation via `upsertView { view { id } }`.
- **`DeleteArtifactInput`**: Only `artifactID` required. `deleteAliases` optional (defaults true).
- **Panel state**: Should persist as view spec JSON, not separate mutations.

### UI Quality (Q26-Q30)
- **Hardcoded colors**: 50+ inline occurrences of `#16213e`, `#1e2d4a`, etc. No CSS custom properties. `StateBadge.svelte` is the only component using `var()`.
- **Loading states**: Plain text "Loading..." everywhere. No skeleton/spinner components.
- **Config formatting**: `fmtVal()` doesn't handle nested objects. Arrays render inline without nesting.
- **Responsive**: 400px grid minimum works for tablets but sidebar needs auto-collapse. No mobile media queries. No mobile tests.

### Test Infrastructure (Q31-Q35)
- **Timeout**: 15s for bandw tests. Some artifact tests at 15.3s — very tight. Consider increasing to 20s.
- **`role="presentation"` hack**: Hides table from screen readers. Better: use `data-testid` for scoping.
- **`::after` trick**: Run detail h1 is empty with CSS-generated content. Fragile but works. Reverting would regress PR/ROC/edit tests unless combined with other strict-mode fixes.
- **`is_bandw` guards**: Still present in `tests/artifacts/advanced/setup.py` for 5 artifact creation blocks. Need removal + verification.
