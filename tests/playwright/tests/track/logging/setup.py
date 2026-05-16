"""SDK setup: logging scenarios.

Creates a project with multiple runs demonstrating various metric logging
patterns in wandb.
"""

from __future__ import annotations

import math
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent / "shared-sdk"))
from helpers import (
    ArtifactInfo,
    Manifest,
    RunInfo,
    create_project,
    get_wandb_config,
    log_debug,
    output_manifest,
    unique_name,
)

import wandb


def main() -> None:
    cfg = get_wandb_config()
    entity = cfg["entity"]
    project = create_project()
    log_debug(f"Creating logging project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # --- Run 1: basic-logging ---
    log_debug("Run 1: basic-logging")
    run = wandb.init(project=project, entity=entity, name="basic-logging")
    for step in range(50):
        t = step / 49  # 0..1
        loss = 2.0 * math.exp(-3.0 * t) + 0.05
        accuracy = 0.95 * (1 - math.exp(-3.0 * t))
        val_loss = 2.2 * math.exp(-2.5 * t) + 0.10
        run.log({"loss": loss, "accuracy": accuracy, "val_loss": val_loss})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="basic-logging"))
    run.finish()

    # --- Run 2: multiple-metrics ---
    log_debug("Run 2: multiple-metrics")
    run = wandb.init(project=project, entity=entity, name="multiple-metrics")
    lr = 0.01
    for step in range(50):
        t = step / 49
        loss = 1.5 * math.exp(-2.5 * t) + 0.08
        accuracy = 0.92 * (1 - math.exp(-2.8 * t))
        # Step-decay learning rate every 15 steps
        if step > 0 and step % 15 == 0:
            lr *= 0.5
        run.log({"loss": loss, "accuracy": accuracy, "learning_rate": lr})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="multiple-metrics"))
    run.finish()

    # --- Run 3: metric-naming ---
    log_debug("Run 3: metric-naming")
    run = wandb.init(project=project, entity=entity, name="metric-naming")
    for step in range(30):
        t = step / 29
        run.log({
            "accuracy": 0.90 * (1 - math.exp(-3.0 * t)),
            "val_loss": 1.8 * math.exp(-2.0 * t) + 0.12,
            "modelAccuracy": 0.88 * (1 - math.exp(-2.5 * t)),
        })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="metric-naming"))
    run.finish()

    # --- Run 4: custom-x-axis ---
    log_debug("Run 4: custom-x-axis")
    run = wandb.init(project=project, entity=entity, name="custom-x-axis")
    run.define_metric("validation_loss", step_metric="epoch")
    for epoch in range(20):
        t = epoch / 19
        val_loss = 2.0 * math.exp(-2.5 * t) + 0.07
        run.log({"epoch": epoch, "validation_loss": val_loss})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-x-axis"))
    run.finish()

    # --- Run 5: glob-pattern ---
    log_debug("Run 5: glob-pattern")
    run = wandb.init(project=project, entity=entity, name="glob-pattern")
    run.define_metric("train/*", step_metric="train/step")
    for step in range(40):
        t = step / 39
        run.log({
            "train/step": step,
            "train/loss": 1.8 * math.exp(-3.0 * t) + 0.04,
            "train/accuracy": 0.93 * (1 - math.exp(-2.8 * t)),
            "val/loss": 2.0 * math.exp(-2.2 * t) + 0.09,
        })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="glob-pattern"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Logging setup complete.")


if __name__ == "__main__":
    main()
