"""SDK setup: keyboard-shortcuts tests.

Creates a project with 2 runs logging basic metrics and images.
Run 0 provides a standard workspace for undo/redo, navigation, and panel
navigation tests. Run 1 logs images for media-shortcut tests.
"""

from __future__ import annotations

import math
import os
import random
import sys
from pathlib import Path

import numpy as np

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
    project = create_project("kbd")
    log_debug(f"Creating keyboard-shortcuts project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(55)
    np.random.seed(55)

    # ---- Run 0: basic metrics run ----
    log_debug("Run 0: kbd-basic")
    run = wandb.init(
        project=project,
        entity=entity,
        name="kbd-basic",
        config={"lr": 0.01, "arch": "resnet18"},
    )
    for step in range(20):
        t = step / 19
        noise = random.gauss(0, 0.02)
        run.log({
            "train/loss": 2.0 * math.exp(-3.0 * t) + noise,
            "train/acc": min(0.98, 0.55 + 0.40 * (1 - math.exp(-3.0 * t)) + noise),
            "val/loss": 2.0 * math.exp(-2.5 * t) * 1.1 + noise,
            "val/acc": min(0.96, 0.50 + 0.40 * (1 - math.exp(-2.5 * t)) + noise),
        })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="kbd-basic"))
    run.finish()

    # ---- Run 1: media run for image-shortcut tests ----
    log_debug("Run 1: kbd-media")
    run = wandb.init(
        project=project,
        entity=entity,
        name="kbd-media",
        config={"lr": 0.005, "arch": "resnet50"},
    )
    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")
    for step in range(10):
        log_data: dict = {
            "train/loss": 1.8 * math.exp(-2.0 * step / 9),
        }
        if not is_bandw:
            img = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
            log_data["images"] = wandb.Image(img, caption=f"kbd-img-{step}")
        run.log(log_data, step=step)
    runs.append(RunInfo(id=run.id, name=run.name, display_name="kbd-media"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Keyboard-shortcuts setup complete.")


if __name__ == "__main__":
    main()
