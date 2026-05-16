"""SDK setup: run detail / view scenarios.

Creates a project with two runs for testing the run detail page:
- Run 0 "basic-run": config, metrics, summary, tags, notes
- Run 1 "artifacts-run": same + a logged artifact
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
    log_debug(f"Creating run-detail project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    artifacts: list[ArtifactInfo] = []

    # --- Run 0: basic-run ---
    log_debug("Run 0: basic-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="basic-run",
        config={"lr": 0.01, "epochs": 10, "arch": "resnet18"},
        tags=["test-tag-1", "test-tag-2"],
        notes="Test run for UI verification",
    )
    for step in range(20):
        t = step / 19  # 0..1
        loss = 2.0 * math.exp(-3.0 * t) + 0.05
        accuracy = 0.95 * (1 - math.exp(-3.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.95
    runs.append(RunInfo(id=run.id, name=run.name, display_name="basic-run"))
    run.finish()

    # --- Run 1: artifacts-run ---
    log_debug("Run 1: artifacts-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="artifacts-run",
        config={"lr": 0.01, "epochs": 10, "arch": "resnet18"},
        tags=["test-tag-1", "test-tag-2"],
        notes="Test run with artifact output",
    )
    for step in range(20):
        t = step / 19
        loss = 2.0 * math.exp(-3.0 * t) + 0.05
        accuracy = 0.95 * (1 - math.exp(-3.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.95

    artifact = wandb.Artifact("test-model", type="model")
    run.log_artifact(artifact)
    artifacts.append(ArtifactInfo(name="test-model", type="model", version="v0"))

    runs.append(RunInfo(id=run.id, name=run.name, display_name="artifacts-run"))
    run.finish()

    manifest = Manifest(
        project=project, entity=entity, runs=runs, artifacts=artifacts
    )
    output_manifest(manifest)
    log_debug("Run-detail setup complete.")


if __name__ == "__main__":
    main()
