"""SDK setup: tables advanced tests.

Creates a project with runs demonstrating immutable, mutable, and incremental
table logging modes, plus a basic table for download tests.
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
    project = create_project("tables-adv")
    log_debug(f"Creating tables-advanced project: {project}")

    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(77)

    # ---- Run 0: immutable table ----
    log_debug("Run 0: immutable-table")
    imm_columns = ["image_id", "pred", "label", "confidence"]
    imm_data = [
        ["img_001", "cat", "cat", 0.95],
        ["img_002", "dog", "dog", 0.88],
        ["img_003", "bird", "cat", 0.41],
        ["img_004", "dog", "dog", 0.92],
        ["img_005", "cat", "bird", 0.35],
    ]
    if is_bandw:
        bandw_tables_imm: dict[str, Any] = {
            "immutable_predictions": {"columns": imm_columns, "data": imm_data},
        }
        run = wandb.init(
            project=project, entity=entity, name="immutable-table", config={"_bandw_tables": bandw_tables_imm}
        )
    else:
        run = wandb.init(project=project, entity=entity, name="immutable-table")
        table = wandb.Table(columns=imm_columns, data=imm_data)
        run.log({"immutable_predictions": table})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="immutable-table"))
    run.finish()

    # ---- Run 1: mutable table (columns added mid-run) ----
    log_debug("Run 1: mutable-table")
    mut_columns_final = ["id", "pred", "score", "latency_ms"]
    mut_data_final = [
        [1, "cat", 0.91, 12.3],
        [2, "dog", 0.86, 15.1],
        [3, "bird", 0.78, 9.8],
    ]
    if is_bandw:
        bandw_tables_mut: dict[str, Any] = {
            "mutable_results": {"columns": mut_columns_final, "data": mut_data_final},
        }
        run = wandb.init(
            project=project, entity=entity, name="mutable-table", config={"_bandw_tables": bandw_tables_mut}
        )
    else:
        run = wandb.init(project=project, entity=entity, name="mutable-table")
        table_v1 = wandb.Table(
            columns=["id", "pred", "score"],
            data=[
                [1, "cat", 0.90],
                [2, "dog", 0.85],
            ],
        )
        run.log({"mutable_results": table_v1})
        table_v2 = wandb.Table(columns=mut_columns_final, data=mut_data_final)
        run.log({"mutable_results": table_v2})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="mutable-table"))
    run.finish()

    # ---- Run 2: incremental table (logged across multiple steps) ----
    log_debug("Run 2: incremental-table")
    all_inc_steps: list[dict[str, Any]] = []
    for step in range(10):
        rows = [
            [f"sample_{step}_{i}", random.choice(["cat", "dog", "bird"]), round(random.uniform(0.3, 0.99), 2)]  # noqa: S311
            for i in range(5)
        ]
        all_inc_steps.append({"columns": ["sample_id", "pred", "score"], "data": rows, "step": step})
    if is_bandw:
        bandw_tables_inc: dict[str, Any] = {
            "incremental_results": {
                "columns": ["sample_id", "pred", "score"],
                "data": all_inc_steps[-1]["data"],
                "steps": all_inc_steps,
            },
        }
        run = wandb.init(
            project=project, entity=entity, name="incremental-table", config={"_bandw_tables": bandw_tables_inc}
        )
        for _step in range(10):
            run.log({"score": round(random.uniform(0.3, 0.99), 2)})  # noqa: S311
    else:
        run = wandb.init(project=project, entity=entity, name="incremental-table")
        for step in range(10):
            t = wandb.Table(columns=["sample_id", "pred", "score"], data=all_inc_steps[step]["data"])
            run.log({"incremental_results": t})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="incremental-table"))
    run.finish()

    # ---- Run 3: download table ----
    log_debug("Run 3: download-table")
    dl_columns = ["name", "category", "value"]
    dl_data = [
        ["alpha", "A", 10],
        ["beta", "B", 20],
        ["gamma", "A", 30],
        ["delta", "C", 40],
    ]
    if is_bandw:
        bandw_tables_dl: dict[str, Any] = {
            "download_data": {"columns": dl_columns, "data": dl_data},
        }
        bandw_artifacts_dl: list[dict[str, Any]] = [
            {
                "name": "download-table-artifact",
                "type": "dataset",
                "table_name": "data_table",
                "columns": dl_columns,
                "data": dl_data,
            },
        ]
        run = wandb.init(
            project=project,
            entity=entity,
            name="download-table",
            config={"_bandw_tables": bandw_tables_dl, "_bandw_artifacts": bandw_artifacts_dl},
        )
    else:
        run = wandb.init(project=project, entity=entity, name="download-table")
        table = wandb.Table(columns=dl_columns, data=dl_data)
        run.log({"download_data": table})
        art = wandb.Artifact("download-table-artifact", type="dataset")
        art.add(table, "data_table")
        run.log_artifact(art)
    runs.append(RunInfo(id=run.id, name=run.name, display_name="download-table"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Tables-advanced setup complete.")


if __name__ == "__main__":
    main()
