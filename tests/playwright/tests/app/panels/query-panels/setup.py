"""SDK setup: query panel tests.

Creates a project with runs that log wandb.Tables, summary data, config,
and an artifact — providing data for query-panel expression, operations,
config, and artifact-access tests.
"""

from __future__ import annotations

import math
import os
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent.parent / "shared-sdk"))
from helpers import (
    ArtifactInfo,
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
    project = create_project("query")
    log_debug(f"Creating query-panels project: {project}")

    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    artifacts: list[ArtifactInfo] = []
    random.seed(99)

    run_configs = [
        {"name": "query-run-1", "model": "resnet18", "lr": 0.01, "batch_size": 32},
        {"name": "query-run-2", "model": "resnet50", "lr": 0.005, "batch_size": 64},
        {"name": "query-run-3", "model": "vgg16", "lr": 0.001, "batch_size": 128},
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

        # Log step metrics
        for step in range(20):
            t = step / 19
            noise = random.gauss(0, 0.02)
            run.log(
                {
                    "train/loss": 2.0 * math.exp(-3.0 * t * (1 + idx * 0.1)) + noise,
                    "train/acc": min(0.98, 0.55 + 0.40 * (1 - math.exp(-3.0 * t)) + noise),
                }
            )

        # Log a wandb.Table for query-panel expressions
        table_data = [
            [
                e,
                round(2.0 * math.exp(-0.15 * e) + random.gauss(0, 0.01), 4),
                round(min(0.98, 0.5 + 0.04 * e), 4),
                rc.get("model", "unknown"),
            ]
            for e in range(10)
        ]
        if is_bandw:
            run.config.update(
                {
                    "_bandw_tables": {
                        "results_table": {
                            "columns": ["epoch", "loss", "accuracy", "model"],
                            "data": table_data,
                        }
                    }
                }
            )
        else:
            table = wandb.Table(
                columns=["epoch", "loss", "accuracy", "model"],
                data=table_data,
            )
            run.log({"results_table": table})

        # Summary metrics for runs-object tests
        run.summary["best_accuracy"] = min(0.98, 0.55 + 0.40 + idx * 0.02)
        run.summary["final_loss"] = 2.0 * math.exp(-3.0) + 0.05

        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    # ---- Artifact for artifactVersion() query tests ----
    log_debug("Creating query-test artifact")
    run = wandb.init(project=project, entity=entity, name="artifact-creator")
    if not is_bandw:
        artifact = wandb.Artifact("query-test-data", type="dataset")
        artifact_table = wandb.Table(
            columns=["id", "value", "category"],
            data=[
                [1, 0.95, "A"],
                [2, 0.87, "B"],
                [3, 0.92, "A"],
                [4, 0.78, "C"],
                [5, 0.91, "B"],
            ],
        )
        artifact.add(artifact_table, "data_table")
        run.log_artifact(artifact)
    runs.append(RunInfo(id=run.id, name=run.name, display_name="artifact-creator"))
    run.finish()
    if not is_bandw:
        artifacts.append(ArtifactInfo(name="query-test-data", type="dataset", version="v0"))

    manifest = Manifest(project=project, entity=entity, runs=runs, artifacts=artifacts)
    output_manifest(manifest)
    log_debug("Query-panels setup complete.")


if __name__ == "__main__":
    main()
