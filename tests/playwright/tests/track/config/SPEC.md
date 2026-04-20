# Config Test Plan

**W&B Docs Page:** https://docs.wandb.ai/models/track/config
**Priority:** P0

---

## H3: Set the configuration at initialization

### Test: `config-at-init.spec.ts`
**SDK Setup:** `setup.py` (config: `{"lr": 0.01, "epochs": 10, "arch": "resnet18", "hidden_layers": [128, 64]}`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Verify Config section shows "lr" = 0.01 | Key-value correct |
| 3 | Verify "epochs" = 10 | Key-value correct |
| 4 | Verify "arch" = "resnet18" | Key-value correct |
| 5 | Verify nested value "hidden_layers" shows list | Nested value rendered |

## H3: Set the configuration throughout your script

### Test: `config-updated-mid-run.spec.ts`
**SDK Setup:** `setup.py` (sets config at init, then updates mid-run with `run.config.update()`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Verify initially set config keys present | Init config visible |
| 3 | Verify mid-run updated keys present | Updated keys visible |
| 4 | Verify updated values reflect final state | Latest values shown |

## H3: Set the configuration with argparse

### Test: `config-from-argparse.spec.ts`
**SDK Setup:** `setup.py` (initializes the run with argparse-provided values)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Verify argparse-provided config values appear in the Config section | Values match the CLI arguments |

## H3: Set the configuration after your Run has finished

### Test: `config-updated-after-finish.spec.ts`
**SDK Setup:** `setup.py` (updates config through the Public API after the run finishes)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Verify config keys added after run completion are visible | Post-finish values appear in the UI |

## H2: File-Based Configs

### Test: `config-from-file.spec.ts`
**SDK Setup:** `setup.py` (loads config from `config-defaults.yaml` or another config file)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to run detail → Overview tab | Tab loads |
| 2 | Verify file-based config values appear in the Config section | File-derived values match setup input |

## Total Tests: 5
