# C1 Cascade Settings — Plan

## Slice 1: Workspace Settings Panel
Add a settings panel that opens when "Workspace settings" is clicked.

**Requirements from tests:**
- Button label: "Workspace settings" (not just "Settings")
- Panel shows: "Workspace layout" and "Line plots" sections
- Under "Line plots": smoothing slider (`role="slider"`, `aria-label="smoothing"`)

**Verification:**
```bash
npx playwright test --project=bandw tests/app/cascade-settings/workspace-level-settings.spec.ts
```

- [ ] Rename "Settings" button to "Workspace settings"
- [ ] Add settings panel toggled by the button
- [ ] Add "Workspace layout" section in panel
- [ ] Add "Line plots" section in panel
- [ ] Add smoothing slider control
- [ ] Verify workspace-level-settings passes bandw
- [ ] Verify workspace-level-settings still passes wandb.ai

## Slice 2: Section Settings Panel
- [x] Add section settings panel with "Display preferences"
- [x] Add "Colored run names" checkbox
- [x] Verify section-level-settings: 4/5 pass (1 needs multi-section)

## Slice 3: Edit Panel Modal
- [x] Add edit panel modal with Data/Grouping/Chart/Legend/Expressions tabs
- [x] Add Y-axis range + smoothing controls in Data tab
- [x] Verify panel-level-settings: 5/5 pass

## Result: 31/35 cascade-settings pass bandw
4 remaining failures need multi-section workspace (group by prefix)
