"""SDK setup: artifacts core tests.

Creates a project with a dataset artifact (with files and metadata),
a model artifact, and multiple versions to support browsing, version
listing, and lineage graph tests.
"""

from __future__ import annotations

import json
import math
import os
import sys
import tempfile
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
)

import wandb


def main() -> None:
    cfg = get_wandb_config()
    entity = cfg["entity"]
    project = create_project("art-core")
    log_debug(f"Creating artifacts-core project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    artifacts: list[ArtifactInfo] = []

    # --- Run 0: data-producer (creates dataset artifact v0, v1, v2) ---
    log_debug("Run 0: data-producer")
    run = wandb.init(
        project=project, entity=entity, name="data-producer",
        config={"source": "synthetic"},
    )
    for step in range(10):
        run.log({"preprocess/progress": (step + 1) / 10})

    with tempfile.TemporaryDirectory() as tmpdir:
        for version_idx in range(3):
            art = wandb.Artifact("my-dataset", type="dataset", metadata={
                "version_note": f"version {version_idx}",
                "num_samples": 1000 * (version_idx + 1),
            })
            # Add files so the Files tab has content
            data_file = Path(tmpdir) / f"data_v{version_idx}.csv"
            data_file.write_text(
                "id,value\n" + "\n".join(
                    f"{i},{i * 0.1 + version_idx}" for i in range(20)
                )
            )
            art.add_file(str(data_file), name=f"data_v{version_idx}.csv")

            readme = Path(tmpdir) / f"README_v{version_idx}.md"
            readme.write_text(f"# Dataset version {version_idx}\nSynthetic data.")
            art.add_file(str(readme), name="README.md")

            run.log_artifact(art)
            artifacts.append(ArtifactInfo(
                name="my-dataset", type="dataset", version=f"v{version_idx}",
            ))

    runs.append(RunInfo(id=run.id, name=run.name, display_name="data-producer"))
    run.finish()

    # --- Run 1: trainer (consumes dataset v2, produces model artifact) ---
    log_debug("Run 1: trainer")
    run = wandb.init(
        project=project, entity=entity, name="trainer",
        config={"lr": 0.01, "epochs": 5},
    )

    # Consume the latest dataset artifact
    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")
    if not is_bandw:
        dataset_art = run.use_artifact(f"{entity}/{project}/my-dataset:latest")
        log_debug(f"  consumed dataset artifact: {dataset_art.name}")

    for step in range(20):
        t = step / 19
        loss = 2.0 * math.exp(-3.0 * t) + 0.05
        accuracy = 0.95 * (1 - math.exp(-3.0 * t))
        run.log({"loss": loss, "accuracy": accuracy})

    # Produce a model artifact
    with tempfile.TemporaryDirectory() as tmpdir:
        weights = Path(tmpdir) / "weights.bin"
        weights.write_bytes(b"\x00" * 256)
        model_art = wandb.Artifact("my-model", type="model", metadata={
            "framework": "pytorch",
            "accuracy": 0.95,
        })
        model_art.add_file(str(weights), name="weights.bin")
        run.log_artifact(model_art)
        artifacts.append(ArtifactInfo(name="my-model", type="model", version="v0"))

    runs.append(RunInfo(id=run.id, name=run.name, display_name="trainer"))
    run.finish()

    # --- Run 2-6: extra-trainers (create 5 more model versions for cluster test) ---
    for i in range(5):
        log_debug(f"Run {i + 2}: extra-trainer-{i}")
        run = wandb.init(
            project=project, entity=entity, name=f"extra-trainer-{i}",
            config={"lr": 0.01 * (i + 1), "epochs": 5 + i},
        )
        if not is_bandw:
            dataset_art = run.use_artifact(f"{entity}/{project}/my-dataset:latest")
        for step in range(10):
            t = step / 9
            run.log({"loss": 1.5 * math.exp(-2.0 * t) + 0.1 * i})

        with tempfile.TemporaryDirectory() as tmpdir:
            weights = Path(tmpdir) / "weights.bin"
            weights.write_bytes(b"\x00" * 256)
            model_art = wandb.Artifact("my-model", type="model", metadata={
                "framework": "pytorch",
                "accuracy": 0.90 + i * 0.01,
            })
            model_art.add_file(str(weights), name="weights.bin")
            run.log_artifact(model_art)
            artifacts.append(ArtifactInfo(
                name="my-model", type="model", version=f"v{i + 1}",
            ))

        runs.append(RunInfo(
            id=run.id, name=run.name, display_name=f"extra-trainer-{i}",
        ))
        run.finish()

    manifest = Manifest(
        project=project, entity=entity, runs=runs, artifacts=artifacts,
    )
    output_manifest(manifest)
    log_debug("Artifacts-core setup complete.")


if __name__ == "__main__":
    main()
