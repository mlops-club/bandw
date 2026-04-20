"""SDK setup: run filtering scenarios (state, metric, tags).

Creates a project with 6 runs with varied states, metrics, and tags:
- 3 finished runs with low loss (tagged "baseline")
- 1 finished run with high loss
- 2 crashed runs (one tagged "baseline")
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
    log_debug(f"Creating filter project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # --- Run 0: finished, low loss, tagged baseline ---
    log_debug("Run 0: low-loss-baseline")
    run = wandb.init(
        project=project,
        entity=entity,
        name="low-loss-baseline",
        config={"lr": 0.01, "arch": "resnet18", "batch_size": 32},
        tags=["baseline"],
    )
    for step in range(20):
        t = step / 19
        loss = 0.3 * math.exp(-2.0 * t) + 0.05
        accuracy = 0.95 * (1 - math.exp(-3.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["loss"] = 0.08
    run.summary["best_accuracy"] = 0.95
    runs.append(RunInfo(id=run.id, name=run.name, display_name="low-loss-baseline"))
    run.finish()

    # --- Run 1: finished, low loss, tagged baseline ---
    log_debug("Run 1: low-loss-v2")
    run = wandb.init(
        project=project,
        entity=entity,
        name="low-loss-v2",
        config={"lr": 0.005, "arch": "resnet50", "batch_size": 64},
        tags=["baseline", "v2"],
    )
    for step in range(20):
        t = step / 19
        loss = 0.25 * math.exp(-2.5 * t) + 0.04
        accuracy = 0.96 * (1 - math.exp(-3.5 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["loss"] = 0.06
    run.summary["best_accuracy"] = 0.96
    runs.append(RunInfo(id=run.id, name=run.name, display_name="low-loss-v2"))
    run.finish()

    # --- Run 2: finished, low loss ---
    log_debug("Run 2: low-loss-plain")
    run = wandb.init(
        project=project,
        entity=entity,
        name="low-loss-plain",
        config={"lr": 0.008, "arch": "resnet18", "batch_size": 32},
    )
    for step in range(20):
        t = step / 19
        loss = 0.35 * math.exp(-2.0 * t) + 0.10
        accuracy = 0.90 * (1 - math.exp(-2.5 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["loss"] = 0.14
    run.summary["best_accuracy"] = 0.90
    runs.append(RunInfo(id=run.id, name=run.name, display_name="low-loss-plain"))
    run.finish()

    # --- Run 3: finished, high loss ---
    log_debug("Run 3: high-loss-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="high-loss-run",
        config={"lr": 0.1, "arch": "vgg16", "batch_size": 128},
    )
    for step in range(20):
        t = step / 19
        loss = 3.0 * math.exp(-0.5 * t) + 0.80
        accuracy = 0.50 * (1 - math.exp(-0.5 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["loss"] = 1.62
    run.summary["best_accuracy"] = 0.50
    runs.append(RunInfo(id=run.id, name=run.name, display_name="high-loss-run"))
    run.finish()

    # --- Run 4: crashed, tagged baseline ---
    log_debug("Run 4: crashed-baseline")
    run = wandb.init(
        project=project,
        entity=entity,
        name="crashed-baseline",
        config={"lr": 0.01, "arch": "resnet18", "batch_size": 32},
        tags=["baseline"],
    )
    for step in range(5):
        t = step / 4
        loss = 2.0 * math.exp(-1.0 * t) + 0.50
        accuracy = 0.40 * (1 - math.exp(-1.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["loss"] = 0.92
    run.summary["best_accuracy"] = 0.40
    runs.append(RunInfo(id=run.id, name=run.name, display_name="crashed-baseline"))
    run.finish(exit_code=1)

    # --- Run 5: crashed, no tags ---
    log_debug("Run 5: crashed-notag")
    run = wandb.init(
        project=project,
        entity=entity,
        name="crashed-notag",
        config={"lr": 0.05, "arch": "vgg16", "batch_size": 64},
    )
    for step in range(3):
        t = step / 2
        loss = 4.0 * math.exp(-0.3 * t) + 1.0
        accuracy = 0.20 * (1 - math.exp(-0.3 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["loss"] = 3.30
    run.summary["best_accuracy"] = 0.20
    runs.append(RunInfo(id=run.id, name=run.name, display_name="crashed-notag"))
    run.finish(exit_code=1)

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Filter setup complete.")


if __name__ == "__main__":
    main()
