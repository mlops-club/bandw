# bandw

A self-hosted, W&B-compatible experiment tracking backend. The official
[`wandb` Python SDK](https://github.com/wandb/wandb) points at it instead of
`api.wandb.ai`.

## Quick Start

```bash
# Build and run the server (SQLite, no Docker needed)
just build
./bin/server

# Or with MySQL
docker compose up -d
just run
```

Then point the SDK at it:

```python
import wandb

wandb.login(key="1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5", host="http://localhost:8080")
run = wandb.init(project="my-project", config={"lr": 0.001})
wandb.log({"loss": 0.5, "accuracy": 0.9})
run.finish()
```

## SDK Conformance Report Card

We run the upstream W&B SDK system tests directly against our backend to
validate protocol compatibility. The `wandb-sdk` repo is vendored as a Git
submodule and tests are executed via a spy proxy that intercepts SDK-to-backend
traffic.

```bash
# Run the full conformance suite
./tests/wandb-conformance/run.sh

# Quick smoke test (~8 tests, ~10 seconds)
./tests/wandb-conformance/run.sh --quick
```

### Current Results (Phase 1 -- Init/Log/Finish)

| Category            | Passing | Source File |
|---------------------|--------:|-------------|
| Metrics             | 37 / 37 | [`test_metric_full.py`](wandb-sdk/tests/system_tests/test_core/test_metric_full.py) |
| Run Logging         | 17 / 41 | [`test_wandb_run.py`](wandb-sdk/tests/system_tests/test_core/test_wandb_run.py) |
| Labels              | 16 / 16 | [`test_label_full.py`](wandb-sdk/tests/system_tests/test_core/test_label_full.py) |
| Settings            | 10 / 10 | [`test_wandb_settings.py`](wandb-sdk/tests/system_tests/test_core/test_wandb_settings.py) |
| Disabled Mode       |  9 / 9  | [`test_mode_disabled_full.py`](wandb-sdk/tests/system_tests/test_core/test_mode_disabled_full.py) |
| File Stream         |  9 / 10 | [`test_file_stream.py`](wandb-sdk/tests/system_tests/test_core/test_file_stream.py) |
| Init (UpsertBucket) |  7 / 12 | [`test_wandb_init.py`](wandb-sdk/tests/system_tests/test_core/test_wandb_init.py) |
| Init Reinit         |  6 / 6  | [`test_wandb_init_reinit.py`](wandb-sdk/tests/system_tests/test_core/test_wandb_init_reinit.py) |
| Setup               |  5 / 5  | [`test_wandb_setup.py`](wandb-sdk/tests/system_tests/test_core/test_wandb_setup.py) |
| Resume (auto)       |  5 / 5  | [`test_resume_auto.py`](wandb-sdk/tests/system_tests/test_core/test_resume_auto.py) |
| Telemetry           |  4 / 4  | [`test_telemetry_full.py`](wandb-sdk/tests/system_tests/test_core/test_telemetry_full.py) |
| Login               |  1 / 5  | [`test_wandb_login.py`](wandb-sdk/tests/system_tests/test_core/test_wandb_login.py) |
| Time Resolution     |  1 / 1  | [`test_time_resolution.py`](wandb-sdk/tests/system_tests/test_core/test_time_resolution.py) |
| **Total**           | **129 / 161** | **~20 seconds with `-n auto`** |

> **Merge gate:** Do not merge code that causes regressions in this suite.
> Run `./tests/wandb-conformance/run.sh` before merging.

## Testing

```bash
# Go unit/integration tests (in-memory SQLite, no external deps)
just test

# SDK conformance tests -- full suite (requires uv + Go)
./tests/wandb-conformance/run.sh

# SDK conformance tests -- quick smoke test
./tests/wandb-conformance/run.sh --quick
```

## Project Structure

```
cmd/server/        Go server entrypoint
internal/          Go backend packages
  authctx/         Auth context helpers
  config/          Environment + CLI flag config
  filestream/      REST file_stream handler
  graphql/         GraphQL resolvers
  server/          HTTP router + middleware
  store/           GORM models + DB operations
  testutil/        In-process test harness
tests/
  wandb-conformance/  SDK conformance test runner + config
docs/              Specs, plans, GraphQL schema
wandb-sdk/         W&B SDK submodule (test suite source)
```

## Docs

- [Execution Plan](docs/EXECUTION_PLAN.md) -- 31 slices across 7 phases
- [Architecture](docs/STRUCTURE_OUTLINE.md) -- directory layout and design
- [GraphQL Schema](docs/graphql-schema.graphql) -- full SDL from the SDK
- [System Spec](docs/system-spec.md) -- backend service specification
