"""SDK setup: single basic run for simple line-plot tests.

Creates one run with 50 steps of loss/accuracy/val_loss.
"""

from __future__ import annotations

import math
import os
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
    project = create_project("lp-basic")
    log_debug(f"Creating basic line-plot project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    log_debug("Run: basic-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="basic-run",
        config={"lr": 0.01, "arch": "resnet18", "batch_size": 32},
    )
    for step in range(50):
        t = step / 49
        run.log({
            "loss": 2.0 * math.exp(-3.0 * t) + 0.05,
            "accuracy": 0.95 * (1 - math.exp(-3.0 * t)),
            "val_loss": 2.2 * math.exp(-2.5 * t) + 0.10,
        })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="basic-run"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Basic line-plot setup complete.")


if __name__ == "__main__":
    main()
