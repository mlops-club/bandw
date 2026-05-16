"""SDK setup: tables core tests.

Creates a project with runs that log wandb.Table artifacts at multiple steps,
two model variants, and overlapping columns for merged/side-by-side comparison.
"""

from __future__ import annotations

import os
import random
import sys
from pathlib import Path
from typing import Any

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
    project = create_project("tables-core")
    log_debug(f"Creating tables-core project: {project}")

    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(42)

    # ---- Run 0: basic table logging ----
    log_debug("Run 0: basic-table")
    columns = ["pred", "label", "score"]
    data = [
        ["cat", "cat", 0.95],
        ["dog", "dog", 0.87],
        ["bird", "cat", 0.42],
        ["dog", "dog", 0.91],
        ["cat", "bird", 0.33],
    ]
    if is_bandw:
        bandw_tables: dict[str, Any] = {
            "predictions": {"columns": columns, "data": data},
        }
        run = wandb.init(project=project, entity=entity, name="basic-table", config={"_bandw_tables": bandw_tables})
    else:
        run = wandb.init(project=project, entity=entity, name="basic-table")
        table = wandb.Table(columns=columns, data=data)
        run.log({"predictions": table})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="basic-table"))
    run.finish()

    # ---- Run 1: model-v1 with tables at multiple steps ----
    log_debug("Run 1: model-v1")
    all_step_data_v1: list[dict[str, Any]] = []
    for step in range(5):
        step_data = [
            ["cat", "cat", round(0.80 + step * 0.03 + random.gauss(0, 0.01), 3)],
            ["dog", "dog", round(0.75 + step * 0.04 + random.gauss(0, 0.01), 3)],
            ["bird", "bird", round(0.60 + step * 0.05 + random.gauss(0, 0.01), 3)],
            ["cat", "dog", round(0.30 - step * 0.04 + random.gauss(0, 0.01), 3)],
        ]
        all_step_data_v1.append({"columns": ["pred", "label", "score"], "data": step_data, "step": step})
    if is_bandw:
        bandw_tables_v1: dict[str, Any] = {
            "eval_predictions": {
                "columns": ["pred", "label", "score"],
                "data": all_step_data_v1[-1]["data"],
                "steps": all_step_data_v1,
            },
        }
        run = wandb.init(
            project=project,
            entity=entity,
            name="model-v1",
            config={"arch": "resnet18", "lr": 0.01, "_bandw_tables": bandw_tables_v1},
        )
        for step in range(5):
            run.log({"score": round(0.80 + step * 0.03, 3)})
    else:
        run = wandb.init(project=project, entity=entity, name="model-v1", config={"arch": "resnet18", "lr": 0.01})
        for step in range(5):
            t = wandb.Table(columns=["pred", "label", "score"], data=all_step_data_v1[step]["data"])
            run.log({"eval_predictions": t})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="model-v1"))
    run.finish()

    # ---- Run 2: model-v2 with tables at multiple steps (different variant) ----
    log_debug("Run 2: model-v2")
    all_step_data_v2: list[dict[str, Any]] = []
    for step in range(5):
        step_data = [
            ["cat", "cat", round(0.85 + step * 0.02 + random.gauss(0, 0.01), 3)],
            ["dog", "dog", round(0.82 + step * 0.03 + random.gauss(0, 0.01), 3)],
            ["bird", "bird", round(0.70 + step * 0.04 + random.gauss(0, 0.01), 3)],
            ["cat", "dog", round(0.20 - step * 0.03 + random.gauss(0, 0.01), 3)],
        ]
        all_step_data_v2.append({"columns": ["pred", "label", "score"], "data": step_data, "step": step})
    if is_bandw:
        bandw_tables_v2: dict[str, Any] = {
            "eval_predictions": {
                "columns": ["pred", "label", "score"],
                "data": all_step_data_v2[-1]["data"],
                "steps": all_step_data_v2,
            },
        }
        run = wandb.init(
            project=project,
            entity=entity,
            name="model-v2",
            config={"arch": "resnet50", "lr": 0.001, "_bandw_tables": bandw_tables_v2},
        )
        for step in range(5):
            run.log({"score": round(0.85 + step * 0.02, 3)})
    else:
        run = wandb.init(project=project, entity=entity, name="model-v2", config={"arch": "resnet50", "lr": 0.001})
        for step in range(5):
            t = wandb.Table(columns=["pred", "label", "score"], data=all_step_data_v2[step]["data"])
            run.log({"eval_predictions": t})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="model-v2"))
    run.finish()

    # ---- Run 3: overlapping-columns (for merged/side-by-side views) ----
    log_debug("Run 3: overlapping-columns")
    table_a_data = {
        "columns": ["id", "pred", "score_a"],
        "data": [[1, "cat", 0.90], [2, "dog", 0.85], [3, "bird", 0.70]],
    }
    table_b_data = {
        "columns": ["id", "pred", "score_b"],
        "data": [[1, "cat", 0.92], [2, "dog", 0.80], [3, "bird", 0.78]],
    }
    if is_bandw:
        bandw_tables_ov: dict[str, Any] = {
            "eval_predictions": {"columns": ["id", "pred", "score_a"], "data": table_a_data["data"]},
        }
        bandw_artifacts: list[dict[str, Any]] = [
            {"name": "table-version-a", "type": "dataset", "table_name": "eval_table", **table_a_data},
            {"name": "table-version-b", "type": "dataset", "table_name": "eval_table", **table_b_data},
        ]
        run = wandb.init(
            project=project,
            entity=entity,
            name="overlapping-columns",
            config={"_bandw_tables": bandw_tables_ov, "_bandw_artifacts": bandw_artifacts},
        )
    else:
        run = wandb.init(project=project, entity=entity, name="overlapping-columns")
        table_a = wandb.Table(
            columns=["id", "pred", "score_a"],
            data=[
                [1, "cat", 0.90],
                [2, "dog", 0.85],
                [3, "bird", 0.70],
            ],
        )
        art_a = wandb.Artifact("table-version-a", type="dataset")
        art_a.add(table_a, "eval_table")
        run.log_artifact(art_a)

        table_b = wandb.Table(
            columns=["id", "pred", "score_b"],
            data=[
                [1, "cat", 0.92],
                [2, "dog", 0.80],
                [3, "bird", 0.78],
            ],
        )
        art_b = wandb.Artifact("table-version-b", type="dataset")
        art_b.add(table_b, "eval_table")
        run.log_artifact(art_b)
    runs.append(RunInfo(id=run.id, name=run.name, display_name="overlapping-columns"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Tables-core setup complete.")


if __name__ == "__main__":
    main()
