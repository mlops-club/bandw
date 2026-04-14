"""Smoke test: wandb.init() against the bandw server.

Usage:
    1. Start the server:  go run ./cmd/server/
    2. Run this script:   uv run python tests/smoke/test_init.py

Expected:
    - wandb.init() succeeds (creates a run via UpsertBucket)
    - run.finish() will log file_stream errors (Slice 6 not yet implemented) — that's OK
"""

import os
import sys

os.environ["WANDB_BASE_URL"] = os.environ.get("WANDB_BASE_URL", "http://localhost:8081")
os.environ["WANDB_API_KEY"] = os.environ.get(
    "WANDB_API_KEY", "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5"
)
# Disable console output and telemetry for cleaner test output.
os.environ["WANDB_CONSOLE"] = "off"
os.environ["WANDB_SILENT"] = "true"

import wandb  # noqa: E402

print("Starting wandb.init()...")
try:
    run = wandb.init(project="smoke-test", config={"lr": 0.001, "epochs": 10})
except Exception as e:
    print(f"FAIL: wandb.init() raised: {e}", file=sys.stderr)
    sys.exit(1)

print(f"OK: Run created — id={run.id}, project={run.project}")

# finish() will fail on file_stream (not implemented yet) — we expect errors.
try:
    run.finish()
except Exception:
    pass  # Expected — file_stream handler not yet implemented (Slice 6)

print("PASS: smoke test completed")
