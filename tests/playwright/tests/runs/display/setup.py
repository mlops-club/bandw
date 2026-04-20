"""SDK setup: run display, search, colors, delete, stop, fork, resume scenarios.

Creates a project with 7 runs for testing table display features:
- 5 finished runs with varied configs, metrics, and tags
- 1 run with forked-from metadata (simulated)
- 1 resumed run
Runs have distinct names to support search testing and varied configs
for column/sort/color testing.
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
    log_debug(f"Creating display project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # --- Run 0: alpha-run (high lr, low accuracy) ---
    log_debug("Run 0: alpha-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="alpha-run",
        config={"lr": 0.1, "arch": "resnet18", "batch_size": 32, "optimizer": "sgd"},
        tags=["experiment", "v1"],
    )
    for step in range(25):
        t = step / 24
        loss = 3.0 * math.exp(-1.5 * t) + 0.40
        accuracy = 0.65 * (1 - math.exp(-1.5 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.65
    runs.append(RunInfo(id=run.id, name=run.name, display_name="alpha-run"))
    run.finish()

    # --- Run 1: beta-run (medium lr, medium accuracy) ---
    log_debug("Run 1: beta-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="beta-run",
        config={"lr": 0.01, "arch": "resnet50", "batch_size": 64, "optimizer": "adam"},
        tags=["experiment", "v2"],
    )
    for step in range(25):
        t = step / 24
        loss = 2.0 * math.exp(-2.5 * t) + 0.15
        accuracy = 0.85 * (1 - math.exp(-2.5 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.85
    runs.append(RunInfo(id=run.id, name=run.name, display_name="beta-run"))
    run.finish()

    # --- Run 2: gamma-run (low lr, high accuracy) ---
    log_debug("Run 2: gamma-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="gamma-run",
        config={"lr": 0.001, "arch": "resnet50", "batch_size": 128, "optimizer": "adam"},
        tags=["experiment", "v3"],
    )
    for step in range(25):
        t = step / 24
        loss = 1.2 * math.exp(-3.5 * t) + 0.03
        accuracy = 0.97 * (1 - math.exp(-3.5 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.97
    runs.append(RunInfo(id=run.id, name=run.name, display_name="gamma-run"))
    run.finish()

    # --- Run 3: delta-eval (evaluation run) ---
    log_debug("Run 3: delta-eval")
    run = wandb.init(
        project=project,
        entity=entity,
        name="delta-eval",
        config={"lr": 0.01, "arch": "resnet18", "batch_size": 32, "optimizer": "sgd"},
        tags=["eval"],
    )
    for step in range(10):
        t = step / 9
        loss = 0.5 * math.exp(-1.0 * t) + 0.20
        accuracy = 0.80 * (1 - math.exp(-1.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.80
    runs.append(RunInfo(id=run.id, name=run.name, display_name="delta-eval"))
    run.finish()

    # --- Run 4: epsilon-crashed ---
    log_debug("Run 4: epsilon-crashed")
    run = wandb.init(
        project=project,
        entity=entity,
        name="epsilon-crashed",
        config={"lr": 0.05, "arch": "vgg16", "batch_size": 256, "optimizer": "sgd"},
        tags=["debug"],
    )
    for step in range(5):
        t = step / 4
        loss = 5.0 * math.exp(-0.3 * t) + 2.0
        accuracy = 0.15 * (1 - math.exp(-0.3 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.15
    runs.append(RunInfo(id=run.id, name=run.name, display_name="epsilon-crashed"))
    run.finish(exit_code=1)

    # --- Run 5: zeta-source (source run for fork testing) ---
    log_debug("Run 5: zeta-source")
    source_run = wandb.init(
        project=project,
        entity=entity,
        name="zeta-source",
        config={"lr": 0.01, "arch": "resnet18", "batch_size": 32, "optimizer": "adam"},
        tags=["source"],
    )
    for step in range(30):
        t = step / 29
        loss = 2.0 * math.exp(-3.0 * t) + 0.10
        accuracy = 0.88 * (1 - math.exp(-3.0 * t))
        source_run.log({"loss": loss, "accuracy": accuracy})
    source_run.summary["best_accuracy"] = 0.88
    runs.append(RunInfo(id=source_run.id, name=source_run.name, display_name="zeta-source"))
    source_run.finish()

    # --- Run 6: eta-forked (forked from zeta-source) ---
    log_debug("Run 6: eta-forked")
    run = wandb.init(
        project=project,
        entity=entity,
        name="eta-forked",
        config={"lr": 0.005, "arch": "resnet18", "batch_size": 32, "optimizer": "adam"},
        tags=["forked"],
        fork_from=f"{entity}/{project}/{source_run.id}?_step=15",
    )
    for step in range(15):
        t = step / 14
        loss = 0.8 * math.exp(-3.0 * t) + 0.03
        accuracy = 0.94 * (1 - math.exp(-3.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.94
    runs.append(RunInfo(id=run.id, name=run.name, display_name="eta-forked"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Display setup complete.")


if __name__ == "__main__":
    main()
