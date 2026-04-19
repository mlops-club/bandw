# CLAUDE.md — bandw

**bandw** is a self-hosted, W&B-compatible experiment tracking backend and collaboration UI.
The official `wandb` Python SDK points at it instead of `api.wandb.ai`.

## Project Structure

- `docs/` — specs, plans, GraphQL schema (read these first for context)
- `cmd/server/` — Go server entrypoint
- `internal/` — Go backend packages (authctx, config, filestream, graphql, server, store, testutil)
- `tests/wandb-conformance/` — SDK conformance test runner and config
- `wandb-sdk/` — upstream W&B SDK submodule (used for conformance testing)
- `frontend/` — Svelte 5 SPA (future)

## Key Docs

- `docs/EXECUTION_PLAN.md` — detailed implementation plan (31 slices, 7 phases)
- `docs/STRUCTURE_OUTLINE.md` — architecture and directory layout
- `docs/graphql-schema.graphql` — full GraphQL SDL reverse-engineered from wandb SDK
- `docs/OBJECTIVE_CONTEXT.md` — grounded facts about the wandb SDK protocol
- `docs/system-spec.md` — backend service specification
- `docs/frontend-spec.md` — UI specification
- `docs/custom-spec.md` — bandw-specific extensions (e.g. SQLite backend)

## Rules

### Python Tooling (CRITICAL)

**NEVER** use bare `python`, `python3`, `pip`, `pip install`, or `uv pip install`.

Always use:
- `uv add <package>` — to add a dependency
- `pixi add <package>` — to add a conda dependency
- `uv run <command>` — to run Python scripts/commands
- `pixi run <command>` — to run commands in the pixi environment

This applies to ALL Python usage: functional tests, SDK smoke tests, scripts, one-off commands.

```bash
# WRONG:
python test_script.py
pip install wandb
python3 -m pytest

# RIGHT:
uv run python test_script.py
uv add wandb
uv run pytest
```

### Go Tooling

- Standard `go` commands: `go build`, `go test`, `go run`, `go mod tidy`
- `gqlgen generate` for GraphQL code generation

### Testing

- Go integration tests use in-memory SQLite via GORM (no Docker needed)
- SDK conformance tests run upstream W&B SDK system tests against our backend
- UI tests use Playwright (future)

### Merge Gate (CRITICAL)

**Do not merge code that causes regressions in the SDK conformance test suite.**

Run `./tests/wandb-conformance/run.sh` before merging any backend change.
At minimum, run `./tests/wandb-conformance/run.sh --quick` for a fast
smoke test. If any previously-passing test starts failing, the regression must
be fixed before merging.

### What This Project Is

A monitoring backend and collaboration tool:
- Experiment tracking (runs, metrics, logs, system metrics)
- Artifacts and model registry
- Reports and collaboration
- Authentication / SSO

### What This Project Is NOT

- No cloud compute orchestration (no sweeps, no jobs, no launch, no run queues)
- No Weave / LLM tracing
- No hyperparameter tuning infrastructure
