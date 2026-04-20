"""SDK setup: summary metric scenarios.

Creates a project with multiple runs demonstrating explicit summary values,
multi-run comparison, and custom metric aggregation.
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
    log_debug(f"Creating summary project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # --- Run 1: summary-explicit ---
    log_debug("Run 1: summary-explicit")
    run = wandb.init(project=project, entity=entity, name="summary-explicit")
    for step in range(50):
        t = step / 49
        loss = 2.0 * math.exp(-3.0 * t) + 0.05
        accuracy = 0.93 * (1 - math.exp(-3.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.95
    run.summary["best_loss"] = 0.04
    run.summary["total_steps"] = 50
    runs.append(RunInfo(id=run.id, name=run.name, display_name="summary-explicit"))
    run.finish()

    # --- Run 2: summary-run-2 ---
    log_debug("Run 2: summary-run-2")
    run = wandb.init(project=project, entity=entity, name="summary-run-2")
    for step in range(50):
        t = step / 49
        loss = 1.8 * math.exp(-2.5 * t) + 0.08
        accuracy = 0.91 * (1 - math.exp(-2.8 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.92
    run.summary["best_loss"] = 0.07
    run.summary["total_steps"] = 50
    runs.append(RunInfo(id=run.id, name=run.name, display_name="summary-run-2"))
    run.finish()

    # --- Run 3: summary-run-3 ---
    log_debug("Run 3: summary-run-3")
    run = wandb.init(project=project, entity=entity, name="summary-run-3")
    for step in range(50):
        t = step / 49
        loss = 2.5 * math.exp(-2.0 * t) + 0.12
        accuracy = 0.88 * (1 - math.exp(-2.2 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.89
    run.summary["best_loss"] = 0.11
    run.summary["total_steps"] = 50
    runs.append(RunInfo(id=run.id, name=run.name, display_name="summary-run-3"))
    run.finish()

    # --- Run 4: custom-aggregation ---
    log_debug("Run 4: custom-aggregation")
    run = wandb.init(project=project, entity=entity, name="custom-aggregation")
    run.define_metric("loss", summary="min")
    run.define_metric("accuracy", summary="max")
    for step in range(50):
        t = step / 49
        # Loss that bounces around but trends down
        loss = 1.5 * math.exp(-2.0 * t) + 0.06 + 0.1 * math.sin(step * 0.5)
        # Accuracy that bounces around but trends up
        accuracy = 0.90 * (1 - math.exp(-2.5 * t)) + 0.03 * math.sin(step * 0.7)
        run.log({"loss": loss, "accuracy": accuracy})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-aggregation"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Summary setup complete.")


if __name__ == "__main__":
    main()
