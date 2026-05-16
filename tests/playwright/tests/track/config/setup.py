"""SDK setup: config scenarios.

Creates a project with multiple runs demonstrating various ways to set
and update run configuration in wandb.
"""

from __future__ import annotations

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
    log_debug(f"Creating config project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # --- Run 1: config-at-init ---
    log_debug("Run 1: config-at-init")
    run = wandb.init(
        project=project,
        entity=entity,
        name="config-at-init",
        config={
            "lr": 0.01,
            "epochs": 10,
            "arch": "resnet18",
            "hidden_layers": [128, 64],
        },
    )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="config-at-init"))
    run.finish()

    # --- Run 2: config-mid-run ---
    log_debug("Run 2: config-mid-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="config-mid-run",
        config={"lr": 0.01},
    )
    run.config.update({"batch_size": 32, "lr": 0.001}, allow_val_change=True)
    runs.append(RunInfo(id=run.id, name=run.name, display_name="config-mid-run"))
    run.finish()

    # --- Run 3: config-argparse ---
    log_debug("Run 3: config-argparse")
    simulated_args = {"lr": 0.001, "epochs": 20, "optimizer": "adam"}
    run = wandb.init(
        project=project,
        entity=entity,
        name="config-argparse",
        config=simulated_args,
    )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="config-argparse"))
    run.finish()

    # --- Run 4: config-post-finish ---
    log_debug("Run 4: config-post-finish")
    run = wandb.init(
        project=project,
        entity=entity,
        name="config-post-finish",
        config={"lr": 0.01},
    )
    run_id = run.id
    run_name = run.name
    run.finish()

    api = wandb.Api(overrides={"base_url": cfg["base_url"]})
    api_run = api.run(f"{entity}/{project}/{run_id}")
    api_run.config["batch_size"] = 64
    api_run.config["lr"] = 0.005
    api_run.update()
    runs.append(RunInfo(id=run_id, name=run_name, display_name="config-post-finish"))

    # --- Run 5: config-from-file ---
    log_debug("Run 5: config-from-file")
    file_config = {
        "model": "transformer",
        "d_model": 512,
        "n_heads": 8,
        "dropout": 0.1,
        "vocab_size": 30000,
    }
    run = wandb.init(
        project=project,
        entity=entity,
        name="config-from-file",
        config=file_config,
    )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="config-from-file"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Config setup complete.")


if __name__ == "__main__":
    main()
