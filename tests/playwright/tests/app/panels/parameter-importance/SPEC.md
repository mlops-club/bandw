# Parameter Importance Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/app/features/panels/parameter-importance
**Test Directory:** `tests/playwright/tests/parameter-importance/`
**Priority:** P2

---

## Tests by Docs Heading

### H2: Creating a hyperparameter importance panel

#### Test: `create-param-importance.spec.ts`
**SDK Setup:** `setup_multi_run.py` (5+ runs with varied hyperparams: lr, batch_size, dropout, epochs → accuracy, loss)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to workspace | Page loads |
| 2 | Click "Add panels" | Panel picker opens |
| 3 | Expand "Evaluation" and select "Parameter importance" | Panel added |
| 4 | Verify panel displays parameters from config | Config keys listed |
| 5 | Verify importance bars render for each parameter | Bar visualization visible |
| 6 | Verify correlation values shown | Correlation numbers displayed |

**Note:** Requires ungrouped runs to display properly.

---

### H2: Interpreting a hyperparameter importance panel

#### Test: `param-importance-interpretation.spec.ts`
**SDK Setup:** `setup_multi_run.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Locate parameter importance panel | Panel visible |
| 2 | Verify importance column shows bar chart per parameter | Feature importance bars present |
| 3 | Verify correlation column shows values between -1 and 1 | Values in valid range |
| 4 | Verify positive and negative correlations are visually distinguishable | Correlation interpretation matches the docs |
| 5 | Change selected output metric | Importance/correlation values update |
| 6 | Verify parameters can be toggled visible/hidden | Parameter visibility controls work |

---

## SDK Setup Scripts Required

- `setup_multi_run.py`

## Total Tests: 2
