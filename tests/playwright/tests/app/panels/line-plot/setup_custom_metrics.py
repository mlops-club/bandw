"""SDK setup: custom metrics for line-plot edge-case tests.

Creates runs with NaN values, custom x-axes, and prefixed/layered metrics.
"""

from __future__ import annotations

import math
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent.parent / "shared-sdk"))
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
    project = create_project("lp-custom")
    log_debug(f"Creating custom-metrics project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # ---- Run: nan-values ----
    log_debug("Run: nan-values")
    run = wandb.init(project=project, entity=entity, name="nan-values")
    for step in range(30):
        t = step / 29
        val = 1.5 * math.exp(-2.0 * t) + 0.1
        if step in (5, 12, 20):
            val = float("nan")
        run.log({"nan_metric": val, "clean_metric": 1.0 * math.exp(-2.0 * t)})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="nan-values"))
    run.finish()

    # ---- Run: custom-x-axis ----
    log_debug("Run: custom-x-axis")
    run = wandb.init(project=project, entity=entity, name="custom-x-axis")
    run.define_metric("validation_loss", step_metric="epoch")
    for epoch in range(20):
        t = epoch / 19
        run.log({"epoch": epoch, "validation_loss": 2.0 * math.exp(-2.5 * t) + 0.07})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-x-axis"))
    run.finish()

    # ---- Run: prefixed-metrics ----
    log_debug("Run: prefixed-metrics")
    run = wandb.init(project=project, entity=entity, name="prefixed-metrics")
    run.define_metric("train/*", step_metric="train/step")
    for step in range(40):
        t = step / 39
        run.log({
            "train/step": step,
            "train/loss": 1.8 * math.exp(-3.0 * t) + 0.04,
            "train/accuracy": 0.93 * (1 - math.exp(-2.8 * t)),
            "val/loss": 2.0 * math.exp(-2.2 * t) + 0.09,
        })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="prefixed-metrics"))
    run.finish()

    # ---- Run: layered-metrics ----
    log_debug("Run: layered-metrics")
    run = wandb.init(project=project, entity=entity, name="layered-metrics")
    for step in range(30):
        t = step / 29
        run.log({
            "layer_0_loss": 1.5 * math.exp(-2.5 * t) + 0.06,
            "layer_1_loss": 1.8 * math.exp(-2.8 * t) + 0.08,
            "layer_10_loss": 2.0 * math.exp(-3.0 * t) + 0.10,
        })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="layered-metrics"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Custom-metrics setup complete.")


if __name__ == "__main__":
    main()
