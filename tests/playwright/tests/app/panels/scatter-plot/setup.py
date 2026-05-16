"""SDK setup: scatter-plot panel tests.

Creates a project with 5 training runs with varied configs (lr, arch,
batch_size) and summary metrics (best_accuracy, final_loss) over 25 steps.
"""

from __future__ import annotations

import math
import os
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent.parent / "shared-sdk"))
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
    project = create_project("scatter-plot")
    log_debug(f"Creating scatter-plot project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(55)

    run_configs = [
        {"name": "scatter-v1", "lr": 0.01, "arch": "resnet18", "batch_size": 32},
        {"name": "scatter-v2", "lr": 0.001, "arch": "resnet50", "batch_size": 64},
        {"name": "scatter-v3", "lr": 0.005, "arch": "resnet18", "batch_size": 128},
        {"name": "scatter-v4", "lr": 0.02, "arch": "vgg16", "batch_size": 32},
        {"name": "scatter-v5", "lr": 0.002, "arch": "resnet50", "batch_size": 64},
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
        for step in range(25):
            t = step / 24
            noise = random.gauss(0, 0.02)
            base_loss = 2.0 * math.exp(-3.0 * t * (1 + idx * 0.12))
            accuracy = min(0.98, 0.55 + 0.40 * (1 - math.exp(-3.0 * t)) + noise)
            run.log({
                "train/loss": base_loss + 0.05 + noise,
                "train/acc": accuracy,
                "val/loss": base_loss * 1.1 + 0.08 + noise,
                "val/acc": min(0.96, accuracy - 0.03 + noise),
            })
        best_acc = min(0.98, 0.55 + 0.40 * (1 - math.exp(-3.0)) + idx * 0.015)
        run.summary["best_accuracy"] = best_acc
        run.summary["final_loss"] = base_loss + 0.05
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Scatter-plot setup complete.")


if __name__ == "__main__":
    main()
