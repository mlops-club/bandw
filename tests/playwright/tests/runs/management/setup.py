"""SDK setup: run management scenarios (tags, grouping, states, move).

Creates a project with 9 runs across 3 groups, varied tags, states, and job types:
- Group A: 3 training runs (tags: baseline, v1)
- Group B: 3 training runs (tags: v2)
- Group C: 3 evaluation runs (tags: eval)
- 2 runs are crashed, the rest are finished
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
    log_debug(f"Creating management project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # --- Group A: 3 training runs ---
    for i in range(3):
        name = f"train-a-{i}"
        log_debug(f"Run: {name}")
        run = wandb.init(
            project=project,
            entity=entity,
            name=name,
            config={"lr": 0.01, "arch": "resnet18", "batch_size": 32},
            group="group-A",
            job_type="training",
            tags=["baseline", "v1"],
        )
        for step in range(20):
            t = step / 19
            loss = 2.0 * math.exp(-3.0 * t) + 0.05
            accuracy = 0.90 * (1 - math.exp(-3.0 * t))
            run.log({"loss": loss, "accuracy": accuracy})
        run.summary["best_accuracy"] = 0.90
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    # --- Group B: 3 training runs (one crashed) ---
    for i in range(3):
        name = f"train-b-{i}"
        log_debug(f"Run: {name}")
        run = wandb.init(
            project=project,
            entity=entity,
            name=name,
            config={"lr": 0.001, "arch": "resnet50", "batch_size": 64},
            group="group-B",
            job_type="training",
            tags=["v2"],
        )
        for step in range(15):
            t = step / 14
            loss = 1.5 * math.exp(-3.5 * t) + 0.08
            accuracy = 0.88 * (1 - math.exp(-3.5 * t))
            run.log({"loss": loss, "accuracy": accuracy})
        run.summary["best_accuracy"] = 0.88
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        if i == 2:
            # Simulate crash by finishing with non-zero exit code
            run.finish(exit_code=1)
        else:
            run.finish()

    # --- Group C: 3 evaluation runs (one crashed) ---
    for i in range(3):
        name = f"eval-c-{i}"
        log_debug(f"Run: {name}")
        run = wandb.init(
            project=project,
            entity=entity,
            name=name,
            config={"lr": 0.01, "arch": "resnet18"},
            group="group-C",
            job_type="evaluation",
            tags=["eval"],
        )
        for step in range(10):
            t = step / 9
            loss = 0.8 * math.exp(-2.0 * t) + 0.15
            accuracy = 0.82 * (1 - math.exp(-2.0 * t))
            run.log({"loss": loss, "accuracy": accuracy})
        run.summary["best_accuracy"] = 0.82
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        if i == 2:
            run.finish(exit_code=1)
        else:
            run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Management setup complete.")


if __name__ == "__main__":
    main()
