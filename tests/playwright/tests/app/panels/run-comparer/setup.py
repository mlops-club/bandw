"""SDK setup: run-comparer panel tests.

Creates a project with 5 training runs that have varied configs and metrics,
including some identical config values and some differing ones, so the
"Diff only" toggle can be tested meaningfully.
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
    project = create_project("run-comparer")
    log_debug(f"Creating run-comparer project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(77)

    # 5 runs with varied configs.  Some keys intentionally share values
    # (optimizer, seed) so "Diff only" can hide identical rows.
    run_configs = [
        {"name": "compare-a", "lr": 0.01,  "arch": "resnet18", "batch_size": 32,  "optimizer": "adam", "seed": 42},
        {"name": "compare-b", "lr": 0.001, "arch": "resnet50", "batch_size": 64,  "optimizer": "adam", "seed": 42},
        {"name": "compare-c", "lr": 0.005, "arch": "resnet18", "batch_size": 128, "optimizer": "adam", "seed": 42},
        {"name": "compare-d", "lr": 0.01,  "arch": "vgg16",    "batch_size": 32,  "optimizer": "sgd",  "seed": 42},
        {"name": "compare-e", "lr": 0.002, "arch": "resnet50", "batch_size": 64,  "optimizer": "adam", "seed": 42},
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
            acc = min(0.98, 0.55 + 0.40 * (1 - math.exp(-3.0 * t)) + noise)
            run.log({
                "train/loss": base_loss + 0.04 + noise,
                "train/acc": acc,
                "val/loss": base_loss * 1.15 + 0.06 + noise,
                "val/acc": min(0.96, acc - 0.03),
            })
        run.summary["best_val_acc"] = round(0.90 + idx * 0.015, 4)
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Run-comparer setup complete.")


if __name__ == "__main__":
    main()
