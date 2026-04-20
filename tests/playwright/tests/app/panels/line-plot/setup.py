"""SDK setup: line-plot panel tests (main).

Creates a project with 5 training runs (varied configs), plus a NaN-metric run
and a custom-x-axis run.  Used by the majority of line-plot spec files.
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
    project = create_project()  # Generate unique project name to avoid run accumulation
    log_debug(f"Creating line-plot project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(42)

    # ---- Runs 0-4: training runs with varied configs ----
    run_configs = [
        {"name": "train-v1", "lr": 0.01, "arch": "resnet18", "batch_size": 32},
        {"name": "train-v2", "lr": 0.001, "arch": "resnet50", "batch_size": 64},
        {"name": "train-v3", "lr": 0.005, "arch": "resnet18", "batch_size": 32},
        {"name": "train-v4", "lr": 0.01, "arch": "vgg16", "batch_size": 128},
        {"name": "train-v5", "lr": 0.002, "arch": "resnet50", "batch_size": 64},
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
            noise = random.gauss(0, 0.02)
            base_loss = 2.0 * math.exp(-3.0 * t * (1 + idx * 0.1))
            run.log({
                "train/loss": base_loss + 0.05 + noise,
                "train/acc": min(0.98, 0.60 + 0.35 * (1 - math.exp(-3.0 * t)) + noise),
                "val/loss": base_loss * 1.1 + 0.08 + noise,
                "val/acc": min(0.96, 0.55 + 0.35 * (1 - math.exp(-2.5 * t)) + noise),
            })
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    # ---- Run 5: nan-run ----
    log_debug("Run 5: nan-run")
    run = wandb.init(project=project, entity=entity, name="nan-run")
    for step in range(30):
        t = step / 29
        val = 1.5 * math.exp(-2.0 * t) + 0.1
        if step in (5, 12, 20):
            val = float("nan")
        run.log({"nan_metric": val})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="nan-run"))
    run.finish()

    # ---- Run 6: custom-x ----
    log_debug("Run 6: custom-x")
    run = wandb.init(project=project, entity=entity, name="custom-x")
    run.define_metric("validation_loss", step_metric="epoch")
    for epoch in range(20):
        t = epoch / 19
        run.log({"epoch": epoch, "validation_loss": 2.0 * math.exp(-2.5 * t) + 0.07})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-x"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Line-plot setup complete.")


if __name__ == "__main__":
    main()
