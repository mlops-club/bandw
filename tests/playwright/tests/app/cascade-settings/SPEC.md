# Cascade Settings Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/cascade-settings
**Test Directory:** `tests/playwright/tests/cascade-settings/`
**Priority:** P1

---

## Tests by Docs Heading

### H2: Workspace settings

#### Test: `workspace-level-settings.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Workspace loads |
| 2 | Open the workspace settings control labeled for workspace settings | Settings panel opens |
| 3 | Verify "Workspace layout" option | Layout settings accessible |
| 4 | Verify "Line plots" option | Line plot defaults accessible |
| 5 | Change a workspace-level setting (e.g., smoothing) | Setting applied globally |
| 6 | Verify all line plots reflect the change | Panels update |

### H3: Workspace layout options

#### Test: `workspace-layout-options.spec.ts`
**SDK Setup:** `setup_multi_run.py` (prefixed metrics for sections)

| # | Step | Assertion |
|---|---|---|
| 1 | Open workspace settings → Workspace layout | Settings visible |
| 2 | Verify automated/manual mode indicator | Mode displayed |
| 3 | Toggle "Hide empty sections during search" | Behavior changes on search |
| 4 | Toggle "Sort panels alphabetically" | Panel order changes |
| 5 | Change section organization (first prefix → last prefix) | Sections reorganize |

### H3: Line plots options

#### Test: `workspace-line-plot-defaults.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open workspace settings → Line plots | Two tabs: "Data", "Display preferences" |
| 2 | Change x-axis default (Step → Relative Time) | All charts switch x-axis |
| 3 | Change smoothing default | All charts apply smoothing |
| 4 | Toggle outlier rescaling | Charts rescale |
| 5 | Change point aggregation method | Aggregation changes |
| 6 | Adjust max runs/groups | Chart run count changes |
| 7 | Switch to "Display preferences" tab | Toggle legend, tooltip options |
| 8 | Toggle "Colored run names in tooltips" | Tooltip style changes |
| 9 | Toggle "Full run names on primary tooltips" | Run name display changes |

---

### H2: Section settings

#### Test: `section-level-settings.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open the section settings menu for a named section | Menu opens |
| 2 | Open section settings → "Display preferences" | Section display settings visible |
| 3 | Toggle "Colored run names in tooltips" for section | Section-level override applied |
| 4 | Verify section panels differ from workspace default | Section override visible |
| 5 | Verify other sections still use workspace defaults | No cross-section effect |

---

### H2: Panel settings

#### Test: `panel-level-settings.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Open panel settings for a named panel | Edit modal opens |
| 2 | Change data settings (Y range, smoothing) | Panel-specific settings |
| 3 | Apply | Only that panel changes |
| 4 | Verify other panels in same section unchanged | No spillover |
| 5 | Verify setting hierarchy: panel > section > workspace | Panel override wins |

---

### Settings cascade verification

#### Test: `settings-cascade-hierarchy.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Set workspace smoothing to 0.5 | All panels smooth at 0.5 |
| 2 | Override section smoothing to 0.8 | Section panels smooth at 0.8, others at 0.5 |
| 3 | Override individual panel smoothing to 0.2 | That panel at 0.2, section at 0.8, workspace at 0.5 |
| 4 | Remove panel override | Panel falls back to section (0.8) |
| 5 | Remove section override | All panels fall back to workspace (0.5) |

---

## SDK Setup Scripts Required

- `setup_multi_run.py`

## Total Tests: 6
