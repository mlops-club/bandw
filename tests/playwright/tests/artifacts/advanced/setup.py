"""SDK setup: artifacts advanced tests.

Creates a project with artifacts covering files/directories, custom aliases,
multiple auto-incremented versions, derived versions, metadata, and a
deletable artifact.
"""

from __future__ import annotations

import json
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
    project = create_project("art-adv")
    log_debug(f"Creating artifacts-advanced project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    artifacts: list[ArtifactInfo] = []

    # --- Run 0: file-structure (files, dirs, custom names) ---
    log_debug("Run 0: file-structure")
    run = wandb.init(
        project=project, entity=entity, name="file-structure",
        config={"task": "construct-artifact"},
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        art = wandb.Artifact("structured-dataset", type="dataset")

        # Single file
        single = Path(tmpdir) / "single_file.txt"
        single.write_text("hello world")
        art.add_file(str(single), name="renamed_file.txt")

        # Directory with multiple files
        subdir = Path(tmpdir) / "images"
        subdir.mkdir()
        for i in range(3):
            (subdir / f"img_{i}.png").write_bytes(b"\x89PNG" + b"\x00" * 32)
        art.add_dir(str(subdir), name="images")

        run.log_artifact(art)
        artifacts.append(ArtifactInfo(
            name="structured-dataset", type="dataset", version="v0",
        ))

    runs.append(RunInfo(id=run.id, name=run.name, display_name="file-structure"))
    run.finish()

    # --- Run 1: alias-producer (custom aliases) ---
    log_debug("Run 1: alias-producer")
    run = wandb.init(
        project=project, entity=entity, name="alias-producer",
        config={"task": "alias-test"},
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        weights = Path(tmpdir) / "model.pt"
        weights.write_bytes(b"\x00" * 128)
        art = wandb.Artifact("aliased-model", type="model")
        art.add_file(str(weights), name="model.pt")
        run.log_artifact(art, aliases=["latest", "best-model", "production"])
        artifacts.append(ArtifactInfo(
            name="aliased-model", type="model", version="v0",
        ))

    runs.append(RunInfo(id=run.id, name=run.name, display_name="alias-producer"))
    run.finish()

    # --- Runs 2-4: version-producer (3 versions of same artifact, different content) ---
    for v_idx in range(3):
        log_debug(f"Run {v_idx + 2}: version-producer-v{v_idx}")
        run = wandb.init(
            project=project, entity=entity, name=f"version-producer-v{v_idx}",
            config={"version": v_idx},
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            data = Path(tmpdir) / "data.json"
            data.write_text(json.dumps({"version": v_idx, "rows": 100 * (v_idx + 1)}))
            art = wandb.Artifact("versioned-data", type="dataset", metadata={
                "row_count": 100 * (v_idx + 1),
                "version_note": f"auto-increment v{v_idx}",
            })
            art.add_file(str(data), name="data.json")
            run.log_artifact(art)
            artifacts.append(ArtifactInfo(
                name="versioned-data", type="dataset", version=f"v{v_idx}",
            ))

        runs.append(RunInfo(
            id=run.id, name=run.name,
            display_name=f"version-producer-v{v_idx}",
        ))
        run.finish()

    # --- Run 5: metadata-producer (artifact with metadata and description) ---
    log_debug("Run 5: metadata-producer")
    run = wandb.init(
        project=project, entity=entity, name="metadata-producer",
        config={"task": "metadata-test"},
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        f = Path(tmpdir) / "config.yaml"
        f.write_text("key: value\n")
        art = wandb.Artifact(
            "metadata-artifact", type="dataset",
            description="An artifact with rich metadata for testing.",
            metadata={
                "framework": "pytorch",
                "dataset_size": 50000,
                "split": "train",
            },
        )
        art.add_file(str(f), name="config.yaml")
        run.log_artifact(art)
        artifacts.append(ArtifactInfo(
            name="metadata-artifact", type="dataset", version="v0",
        ))

    runs.append(RunInfo(id=run.id, name=run.name, display_name="metadata-producer"))
    run.finish()

    # --- Run 6: deletable-producer (artifact to delete in test) ---
    log_debug("Run 6: deletable-producer")
    run = wandb.init(
        project=project, entity=entity, name="deletable-producer",
        config={"task": "delete-test"},
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        for v_idx in range(2):
            f = Path(tmpdir) / f"file_v{v_idx}.txt"
            f.write_text(f"delete me v{v_idx}")
            art = wandb.Artifact("deletable-data", type="dataset")
            art.add_file(str(f), name=f"file_v{v_idx}.txt")
            run.log_artifact(art)
            artifacts.append(ArtifactInfo(
                name="deletable-data", type="dataset", version=f"v{v_idx}",
            ))

    runs.append(RunInfo(
        id=run.id, name=run.name, display_name="deletable-producer",
    ))
    run.finish()

    manifest = Manifest(
        project=project, entity=entity, runs=runs, artifacts=artifacts,
    )
    output_manifest(manifest)
    log_debug("Artifacts-advanced setup complete.")


if __name__ == "__main__":
    main()
