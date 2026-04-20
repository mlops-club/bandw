# C1 Cascade Settings — bandw Research Questions

## Context
C1 cascade-settings has 35 tests that pass wandb.ai but 23 fail against bandw. All failures are because our workspace lacks settings panels (workspace-level, section-level, panel-level).

## Questions
1. What does wandb.ai's "Workspace settings" panel look like? What elements does it expose?
2. What does "Section settings" look like?
3. What does the "Edit panel" modal look like? What tabs does it have?
4. What's the minimum viable settings UI needed to pass the tests?
5. Can we add stub settings panels that show the right ARIA elements without full functionality?
