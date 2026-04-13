"""SDK smoke test: wandb.init() + wandb.log() + wandb.finish()

Usage (from project root):

    # 1. Start the dev server:
    go run ./cmd/server

    # 2. Run this script:
    cd tests/sdk && WANDB_BASE_URL=http://localhost:8080 \
        WANDB_API_KEY=1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5 \
        uv run python smoke_test.py

Expected behavior:
    - Slice 5: wandb.init() succeeds, wandb.log()/finish() produce file_stream errors (expected)
    - Slice 7: full script completes without errors
"""

import wandb


def main():
    run = wandb.init(project="smoke-test", config={"lr": 0.001, "epochs": 10})
    print(f"Run ID: {run.id}")
    print(f"Run name: {run.name}")

    for i in range(5):
        wandb.log({"loss": 1.0 / (i + 1), "accuracy": i * 0.1, "step": i})

    run.finish()
    print("Smoke test complete.")


if __name__ == "__main__":
    main()
