"""SDK setup: reports core tests.

Creates projects with basic and multi-run configurations to support
report creation, editing, content blocks, and run set operations.
"""

from __future__ import annotations

import math
import os
import random
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
    project = create_project("rpt-core")
    log_debug(f"Creating reports-core project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(42)

    # --- Run 0: basic-run (for simple report tests) ---
    log_debug("Run 0: basic-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="basic-run",
        config={"lr": 0.01, "arch": "resnet18", "batch_size": 32},
        tags=["baseline"],
    )
    for step in range(30):
        t = step / 29
        loss = 2.0 * math.exp(-3.0 * t) + 0.05
        accuracy = 0.95 * (1 - math.exp(-3.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.95
    runs.append(RunInfo(id=run.id, name=run.name, display_name="basic-run"))
    run.finish()

    # --- Runs 1-4: multi-run group (for workspace, run sets, panel grids) ---
    configs = [
        {"name": "experiment-A", "lr": 0.01, "arch": "resnet18", "batch_size": 32},
        {"name": "experiment-B", "lr": 0.001, "arch": "resnet50", "batch_size": 64},
        {"name": "experiment-C", "lr": 0.005, "arch": "vgg16", "batch_size": 128},
        {"name": "experiment-D", "lr": 0.002, "arch": "resnet18", "batch_size": 64},
    ]

    for idx, rc in enumerate(configs):
        name = rc.pop("name")
        log_debug(f"Run {idx + 1}: {name}")
        run = wandb.init(
            project=project,
            entity=entity,
            name=name,
            config=rc,
            tags=["experiment", f"group-{idx % 2}"],
        )
        for step in range(30):
            t = step / 29
            noise = random.gauss(0, 0.02)
            base_loss = 2.0 * math.exp(-3.0 * t * (1 + idx * 0.1))
            run.log(
                {
                    "train/loss": base_loss + 0.05 + noise,
                    "train/acc": min(0.98, 0.60 + 0.35 * (1 - math.exp(-3.0 * t)) + noise),
                    "val/loss": base_loss * 1.1 + 0.08 + noise,
                    "val/acc": min(0.96, 0.55 + 0.35 * (1 - math.exp(-2.5 * t)) + noise),
                }
            )
        run.summary["best_val_acc"] = 0.90 + idx * 0.02
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    # --- Create a report via GraphQL API for create-from-api test ---
    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")
    if is_bandw:
        import base64
        import json as json_mod
        import urllib.request

        api_url = cfg["base_url"].rstrip("/") + "/graphql"
        mutation = json_mod.dumps(
            {
                "query": """
                mutation($input: UpsertViewInput!) {
                    upsertView(input: $input) {
                        view { id name displayName }
                    }
                }
            """,
                "variables": {
                    "input": {
                        "entityName": entity,
                        "projectName": project,
                        "displayName": "API Report",
                        "type": "runs",
                        "spec": json_mod.dumps({"content": "Report created via API", "blocks": []}),
                    }
                },
            }
        ).encode()
        auth_str = base64.b64encode(f"api:{cfg['api_key']}".encode()).decode()
        req = urllib.request.Request(  # noqa: S310
            api_url,
            data=mutation,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {auth_str}",
            },
        )
        try:
            resp = urllib.request.urlopen(req)  # noqa: S310
            result = json_mod.loads(resp.read())
            log_debug(f"Created API report: {result}")
        except Exception as e:
            log_debug(f"Warning: could not create report via API: {e}")

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Reports-core setup complete.")


if __name__ == "__main__":
    main()
