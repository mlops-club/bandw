"""SDK setup: pin & compare runs tests.

Creates a project with 5 training runs simulating hyperparameter tuning
with different learning rates, architectures, and batch sizes.  Metrics
diverge enough for meaningful delta comparisons.
"""

from __future__ import annotations

import math
import os
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent / "shared-sdk"))
from helpers import (
    Manifest,
    RunInfo,
    create_project,
    get_wandb_config,
    log_debug,
    output_manifest,
)

import wandb


def main() -> None:
    cfg = get_wandb_config()
    entity = cfg["entity"]
    project = create_project("compare-runs")
    log_debug(f"Creating compare-runs project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(55)

    # 5 runs with varied hyperparameters; accuracy and loss deliberately
    # spread so baseline delta comparisons are visually meaningful.
    run_configs = [
        {"name": "baseline-lr0.01",  "lr": 0.01,  "arch": "resnet18", "batch_size": 32},
        {"name": "experiment-lr0.001", "lr": 0.001, "arch": "resnet50", "batch_size": 64},
        {"name": "experiment-lr0.005", "lr": 0.005, "arch": "resnet18", "batch_size": 128},
        {"name": "experiment-lr0.02",  "lr": 0.02,  "arch": "vgg16",    "batch_size": 32},
        {"name": "experiment-lr0.003", "lr": 0.003, "arch": "resnet50", "batch_size": 64},
    ]

    for idx, rc in enumerate(run_configs):
        name = rc.pop("name")
        log_debug(f"Run {idx}: {name}")
        run = wandb.init(
            project=project,
            entity=entity,
            name=name,
            config=rc,
        )
        for step in range(30):
            t = step / 29
            noise = random.gauss(0, 0.015)
            base_loss = 2.0 * math.exp(-3.0 * t * (1 + idx * 0.1))
            accuracy = min(0.98, 0.50 + 0.45 * (1 - math.exp(-2.5 * t * (1 + idx * 0.08))) + noise)
            run.log({
                "loss": base_loss + 0.05 + noise,
                "accuracy": accuracy,
                "val_loss": base_loss * 1.1 + 0.08 + noise,
                "val_accuracy": min(0.96, accuracy - 0.02),
            })
        # Spread final accuracy values for visible deltas
        run.summary["best_accuracy"] = round(0.85 + idx * 0.025, 4)
        run.summary["final_loss"] = round(0.20 - idx * 0.03, 4)
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Compare-runs setup complete.")


if __name__ == "__main__":
    main()
