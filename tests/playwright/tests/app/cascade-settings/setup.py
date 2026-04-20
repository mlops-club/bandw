"""SDK setup: cascade-settings tests.

Creates a project with 3 training runs logging prefixed metrics
(train/loss, train/accuracy, val/loss, val/accuracy) over 20 steps.
The prefix-based metrics enable section grouping for cascade tests.
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
    project = create_project("cascade")
    log_debug(f"Creating cascade-settings project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(42)

    run_configs = [
        {"name": "run-alpha", "lr": 0.01, "arch": "resnet18", "batch_size": 32},
        {"name": "run-beta", "lr": 0.005, "arch": "resnet50", "batch_size": 64},
        {"name": "run-gamma", "lr": 0.001, "arch": "vgg16", "batch_size": 128},
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
        for step in range(20):
            t = step / 19
            noise = random.gauss(0, 0.02)
            base_loss = 2.0 * math.exp(-3.0 * t * (1 + idx * 0.15))
            run.log({
                "train/loss": base_loss + 0.05 + noise,
                "train/accuracy": min(0.98, 0.55 + 0.40 * (1 - math.exp(-3.0 * t)) + noise),
                "val/loss": base_loss * 1.1 + 0.08 + noise,
                "val/accuracy": min(0.96, 0.50 + 0.40 * (1 - math.exp(-2.5 * t)) + noise),
            })
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Cascade-settings setup complete.")


if __name__ == "__main__":
    main()
