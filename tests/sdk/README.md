# SDK Smoke Tests

Python scripts that exercise the real `wandb` SDK against the local dev server.
These are acceptance tests, not unit tests — they verify the server handles actual SDK traffic.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) installed
- Go dev server running (`go run ./cmd/server` from the project root)

## Running

```bash
# From the project root:

# 1. Start the dev server (uses in-memory SQLite by default)
go run ./cmd/server

# 2. In another terminal, run the smoke test
cd tests/sdk
WANDB_BASE_URL=http://localhost:8080 \
  WANDB_API_KEY=1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5 \
  uv run python smoke_test.py
```

## What to expect

| Phase 1 Slice | `wandb.init()` | `wandb.log()` | `wandb.finish()` |
|---------------|----------------|---------------|-------------------|
| Slice 5       | Works          | file_stream errors (expected) | file_stream errors (expected) |
| Slice 6       | Works          | Works         | Works             |
| Slice 7       | Works          | Works         | Summary update works cleanly |

The default API key (`1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5`) is seeded automatically
when the server starts without `DATABASE_URL` (in-memory SQLite mode).
