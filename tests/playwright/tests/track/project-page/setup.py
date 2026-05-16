"""SDK setup: project page scenarios.

Creates a project with 5 runs demonstrating different configs, metrics,
summaries, tags, groups, and one artifact.
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
    log_debug(f"Creating project-page project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    artifacts: list[ArtifactInfo] = []

    # --- Run 0: train-v1 ---
    log_debug("Run 0: train-v1")
    run = wandb.init(
        project=project,
        entity=entity,
        name="train-v1",
        config={"lr": 0.01, "arch": "resnet18", "batch_size": 32},
    )
    for step in range(30):
        t = step / 29
        loss = 2.0 * math.exp(-3.0 * t) + 0.10
        accuracy = 0.85 * (1 - math.exp(-3.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.85

    # Log an artifact from run 0
    art = wandb.Artifact("dataset-v1", type="dataset")
    art.add_dir = None  # skip dir; add a dummy file entry
    # Use new_file to create a small artifact
    with art.new_file("readme.txt") as f:
        f.write("sample dataset artifact for project-page tests")
    run.log_artifact(art)

    runs.append(RunInfo(id=run.id, name=run.name, display_name="train-v1"))
    artifacts.append(ArtifactInfo(name="dataset-v1", type="dataset", version="v0"))
    run.finish()

    # --- Run 1: train-v2 ---
    log_debug("Run 1: train-v2")
    run = wandb.init(
        project=project,
        entity=entity,
        name="train-v2",
        config={"lr": 0.001, "arch": "resnet50", "batch_size": 64},
    )
    for step in range(30):
        t = step / 29
        loss = 1.5 * math.exp(-3.5 * t) + 0.05
        accuracy = 0.92 * (1 - math.exp(-3.5 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.92
    runs.append(RunInfo(id=run.id, name=run.name, display_name="train-v2"))
    run.finish()

    # --- Run 2: train-v3 ---
    log_debug("Run 2: train-v3")
    run = wandb.init(
        project=project,
        entity=entity,
        name="train-v3",
        config={"lr": 0.005, "arch": "resnet18", "batch_size": 32},
    )
    for step in range(15):
        t = step / 14
        loss = 2.5 * math.exp(-2.0 * t) + 0.15
        accuracy = 0.78 * (1 - math.exp(-2.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.78
    runs.append(RunInfo(id=run.id, name=run.name, display_name="train-v3"))
    run.finish()

    # --- Run 3: eval-run ---
    log_debug("Run 3: eval-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="eval-run",
        config={"lr": 0.01, "arch": "resnet18"},
        tags=["eval"],
    )
    for step in range(5):
        t = step / 4
        loss = 0.5 * math.exp(-1.0 * t) + 0.20
        accuracy = 0.80 * (1 - math.exp(-1.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.80
    runs.append(RunInfo(id=run.id, name=run.name, display_name="eval-run"))
    run.finish()

    # --- Run 4: grouped-run ---
    log_debug("Run 4: grouped-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="grouped-run",
        config={"lr": 0.01, "arch": "vgg16"},
        group="experiment-1",
    )
    for step in range(10):
        t = step / 9
        loss = 1.8 * math.exp(-2.5 * t) + 0.12
        accuracy = 0.82 * (1 - math.exp(-2.5 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.82
    runs.append(RunInfo(id=run.id, name=run.name, display_name="grouped-run"))
    run.finish()

    manifest = Manifest(
        project=project, entity=entity, runs=runs, artifacts=artifacts
    )
    output_manifest(manifest)
    log_debug("Project-page setup complete.")


if __name__ == "__main__":
    main()
