"""SDK setup: bar-plot panel tests.

Creates a project with 5 training runs (varied configs and summary metrics)
plus 3 groups x 3 runs each for grouped/box/violin plot tests.
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
    project = create_project("bar-plot")
    log_debug(f"Creating bar-plot project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(77)

    # ---- Runs 0-4: training runs with varied configs and summary metrics ----
    run_configs = [
        {"name": "bar-v1", "lr": 0.01, "arch": "resnet18", "batch_size": 32},
        {"name": "bar-v2", "lr": 0.001, "arch": "resnet50", "batch_size": 64},
        {"name": "bar-v3", "lr": 0.005, "arch": "resnet18", "batch_size": 32},
        {"name": "bar-v4", "lr": 0.01, "arch": "vgg16", "batch_size": 128},
        {"name": "bar-v5", "lr": 0.002, "arch": "resnet50", "batch_size": 64},
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
            base_loss = 2.0 * math.exp(-3.0 * t * (1 + idx * 0.1))
            run.log({
                "train/loss": base_loss + 0.05 + noise,
                "train/acc": min(0.98, 0.60 + 0.35 * (1 - math.exp(-3.0 * t)) + noise),
                "val/loss": base_loss * 1.1 + 0.08 + noise,
                "val/acc": min(0.96, 0.55 + 0.35 * (1 - math.exp(-2.5 * t)) + noise),
            })
        best_acc = min(0.98, 0.60 + 0.35 * (1 - math.exp(-3.0)) + idx * 0.02)
        run.summary["best_accuracy"] = best_acc
        run.summary["final_loss"] = base_loss + 0.05
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    # ---- Runs 5-13: 3 groups x 3 runs for grouping/box/violin tests ----
    groups = ["group-alpha", "group-beta", "group-gamma"]
    for g_idx, group in enumerate(groups):
        for r_idx in range(3):
            run_idx = 5 + g_idx * 3 + r_idx
            name = f"{group}-r{r_idx}"
            log_debug(f"Run {run_idx}: {name}")
            run = wandb.init(
                project=project,
                entity=entity,
                name=name,
                group=group,
                config={
                    "lr": 0.01 * (g_idx + 1),
                    "arch": ["resnet18", "resnet50", "vgg16"][g_idx],
                    "batch_size": [32, 64, 128][g_idx],
                },
            )
            for step in range(25):
                t = step / 24
                noise = random.gauss(0, 0.03)
                base_loss = 2.0 * math.exp(-2.5 * t * (1 + g_idx * 0.15))
                run.log({
                    "train/loss": base_loss + 0.05 + noise,
                    "train/acc": min(0.98, 0.55 + 0.38 * (1 - math.exp(-2.8 * t)) + noise),
                })
            run.summary["best_accuracy"] = min(0.97, 0.55 + 0.38 + random.gauss(0, 0.01))
            run.summary["final_loss"] = base_loss + 0.05
            runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
            run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Bar-plot setup complete.")


if __name__ == "__main__":
    main()
