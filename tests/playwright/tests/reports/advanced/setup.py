"""SDK setup: reports advanced tests.

Creates projects with runs for testing report sharing, collaboration,
cross-project reports, cloning, exporting, and embedding.
Includes a second project for cross-project report tests.
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
    project = create_project("rpt-adv")
    log_debug(f"Creating reports-advanced project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(99)

    # --- Run 0: basic-run (for simple report tests) ---
    log_debug("Run 0: basic-run")
    run = wandb.init(
        project=project,
        entity=entity,
        name="basic-run",
        config={"lr": 0.01, "arch": "resnet18", "batch_size": 32},
        tags=["baseline"],
    )
    for step in range(20):
        t = step / 19
        loss = 2.0 * math.exp(-3.0 * t) + 0.05
        accuracy = 0.95 * (1 - math.exp(-3.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})
    run.summary["best_accuracy"] = 0.95
    runs.append(RunInfo(id=run.id, name=run.name, display_name="basic-run"))
    run.finish()

    # --- Runs 1-3: multi-run group (for panel send, workspace tests) ---
    configs = [
        {"name": "train-alpha", "lr": 0.01, "arch": "resnet18", "batch_size": 32},
        {"name": "train-beta", "lr": 0.001, "arch": "resnet50", "batch_size": 64},
        {"name": "train-gamma", "lr": 0.005, "arch": "vgg16", "batch_size": 128},
    ]

    for idx, rc in enumerate(configs):
        name = rc.pop("name")
        log_debug(f"Run {idx + 1}: {name}")
        run = wandb.init(
            project=project,
            entity=entity,
            name=name,
            config=rc,
            tags=["experiment"],
        )
        for step in range(25):
            t = step / 24
            noise = random.gauss(0, 0.02)
            base_loss = 1.8 * math.exp(-2.5 * t * (1 + idx * 0.15))
            run.log(
                {
                    "train/loss": base_loss + 0.05 + noise,
                    "train/acc": min(0.98, 0.60 + 0.35 * (1 - math.exp(-3.0 * t)) + noise),
                    "val/loss": base_loss * 1.1 + 0.08 + noise,
                    "val/acc": min(0.96, 0.55 + 0.35 * (1 - math.exp(-2.5 * t)) + noise),
                }
            )
        run.summary["best_val_acc"] = 0.88 + idx * 0.03
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    # --- Second project for cross-project report tests ---
    project2 = create_project("rpt-adv-xproj")
    log_debug(f"Creating cross-project: {project2}")

    run = wandb.init(
        project=project2,
        entity=entity,
        name="cross-project-run",
        config={"lr": 0.02, "arch": "efficientnet", "batch_size": 256},
        tags=["cross-project"],
    )
    for step in range(20):
        t = step / 19
        loss = 1.5 * math.exp(-2.0 * t) + 0.10
        run.log({"loss": loss, "accuracy": 0.90 * (1 - math.exp(-2.5 * t))})
    run.summary["best_accuracy"] = 0.90
    runs.append(RunInfo(id=run.id, name=run.name, display_name="cross-project-run"))
    run.finish()

    # --- Create a report via GraphQL so advanced tests can find it ---
    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")
    if is_bandw:
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
                        "displayName": "Test Report",
                        "type": "runs",
                        "spec": json_mod.dumps({"content": "Report content for testing", "blocks": []}),
                    }
                },
            }
        ).encode()
        req = urllib.request.Request(  # noqa: S310
            api_url,
            data=mutation,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {'api:' + cfg['api_key']}",
            },
        )
        # Use basic auth format expected by bandw
        import base64

        auth_str = base64.b64encode(f"api:{cfg['api_key']}".encode()).decode()
        req.headers["Authorization"] = f"Basic {auth_str}"
        try:
            resp = urllib.request.urlopen(req)  # noqa: S310
            result = json_mod.loads(resp.read())
            log_debug(f"Created report: {result}")
        except Exception as e:
            log_debug(f"Warning: could not create report via API: {e}")

    manifest = Manifest(
        project=project,
        entity=entity,
        runs=runs,
        extra={"project2": project2},
    )
    output_manifest(manifest)
    log_debug("Reports-advanced setup complete.")


if __name__ == "__main__":
    main()
