"""SDK setup: workspace test scenarios.

Creates a project with 3 runs logging loss/accuracy (and prefixed
train_*/val_* metrics) over 20 steps, each with different configs.
This provides data for workspace UI tests: sidebar, panels, sections,
filters, grouping, sorting, undo/redo, saved views, and templates.
"""

from __future__ import annotations

import math
import os
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
    project = create_project()
    log_debug(f"Creating workspaces project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # --- Run 0: fast-learner ---
    log_debug("Run 0: fast-learner")
    run = wandb.init(
        project=project,
        entity=entity,
        name="fast-learner",
        config={"lr": 0.01, "arch": "resnet50", "batch_size": 64, "optimizer": "adam"},
    )
    for step in range(20):
        t = step / 19
        loss = 2.0 * math.exp(-4.0 * t) + 0.05
        accuracy = 0.95 * (1 - math.exp(-4.0 * t))
        run.log({
            "loss": loss,
            "accuracy": accuracy,
            "train/loss": loss,
            "train/accuracy": accuracy,
            "val/loss": loss + 0.1,
            "val/accuracy": max(0, accuracy - 0.05),
        })
    run.summary["best_accuracy"] = 0.95
    runs.append(RunInfo(id=run.id, name=run.name, display_name="fast-learner"))
    run.finish()

    # --- Run 1: slow-learner ---
    log_debug("Run 1: slow-learner")
    run = wandb.init(
        project=project,
        entity=entity,
        name="slow-learner",
        config={"lr": 0.001, "arch": "resnet18", "batch_size": 32, "optimizer": "sgd"},
    )
    for step in range(20):
        t = step / 19
        loss = 2.5 * math.exp(-2.0 * t) + 0.15
        accuracy = 0.80 * (1 - math.exp(-2.0 * t))
        run.log({
            "loss": loss,
            "accuracy": accuracy,
            "train/loss": loss,
            "train/accuracy": accuracy,
            "val/loss": loss + 0.2,
            "val/accuracy": max(0, accuracy - 0.08),
        })
    run.summary["best_accuracy"] = 0.80
    runs.append(RunInfo(id=run.id, name=run.name, display_name="slow-learner"))
    run.finish()

    # --- Run 2: mid-learner ---
    log_debug("Run 2: mid-learner")
    run = wandb.init(
        project=project,
        entity=entity,
        name="mid-learner",
        config={"lr": 0.005, "arch": "resnet50", "batch_size": 32, "optimizer": "adam"},
    )
    for step in range(20):
        t = step / 19
        loss = 1.8 * math.exp(-3.0 * t) + 0.10
        accuracy = 0.88 * (1 - math.exp(-3.0 * t))
        run.log({
            "loss": loss,
            "accuracy": accuracy,
            "train/loss": loss,
            "train/accuracy": accuracy,
            "val/loss": loss + 0.15,
            "val/accuracy": max(0, accuracy - 0.06),
        })
    run.summary["best_accuracy"] = 0.88
    runs.append(RunInfo(id=run.id, name=run.name, display_name="mid-learner"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Workspaces setup complete.")


if __name__ == "__main__":
    main()
