"""SDK setup: media panel tests.

Creates a project with a single run that logs all supported media types:
images (with captions), images with segmentation masks, images with bounding
boxes, a wandb.Table containing images with overlays, histograms, audio,
video, 3D point clouds, HTML, text, and a molecule visualization.
Two additional runs provide data for compare-mode and sync tests.
"""

from __future__ import annotations

import math
import os
import random
import sys
from pathlib import Path

import numpy as np

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


def _log_media(run: wandb.sdk.wandb_run.Run) -> None:
    """Log every media type needed by the media-panel spec tests."""

    for step in range(5):
        # ---- Images with captions ----
        img_array = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
        run.log({
            "images": wandb.Image(img_array, caption=f"step-{step}-caption"),
        }, step=step)

        # ---- Images with segmentation masks ----
        mask_data = np.random.randint(0, 3, (64, 64), dtype=np.uint8)
        run.log({
            "images_with_masks": wandb.Image(
                img_array,
                masks={
                    "predictions": {
                        "mask_data": mask_data,
                        "class_labels": {0: "background", 1: "cat", 2: "dog"},
                    }
                },
            ),
        }, step=step)

        # ---- Images with bounding boxes ----
        run.log({
            "images_with_boxes": wandb.Image(
                img_array,
                boxes={
                    "predictions": {
                        "box_data": [
                            {
                                "position": {
                                    "minX": 0.1,
                                    "maxX": 0.5,
                                    "minY": 0.2,
                                    "maxY": 0.7,
                                },
                                "class_id": 1,
                                "scores": {"confidence": 0.9},
                                "box_caption": "cat",
                            },
                            {
                                "position": {
                                    "minX": 0.5,
                                    "maxX": 0.9,
                                    "minY": 0.1,
                                    "maxY": 0.6,
                                },
                                "class_id": 2,
                                "scores": {"confidence": 0.7},
                                "box_caption": "dog",
                            },
                        ],
                        "class_labels": {1: "cat", 2: "dog"},
                    }
                },
            ),
        }, step=step)

        # ---- Histograms ----
        run.log({
            "histograms": wandb.Histogram(np.random.randn(100)),
        }, step=step)

        # ---- Audio ----
        sample_rate = 44100
        duration = 0.5
        t_arr = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        audio_data = np.sin(2 * math.pi * 440 * t_arr).astype(np.float32)
        run.log({
            "audio": wandb.Audio(audio_data, sample_rate=sample_rate, caption=f"tone-{step}"),
        }, step=step)

        # ---- Video ----
        video_frames = np.random.randint(0, 255, (4, 32, 32, 3), dtype=np.uint8)
        run.log({
            "video": wandb.Video(video_frames, fps=2),
        }, step=step)

        # ---- 3D Point Clouds ----
        points = np.random.rand(50, 3).astype(np.float32)
        run.log({
            "point_cloud": wandb.Object3D(points),
        }, step=step)

        # ---- HTML ----
        run.log({
            "html_content": wandb.Html(f"<h1>Step {step}</h1><p>Hello from step {step}</p>"),
        }, step=step)

        # ---- Text ----
        run.log({
            "text_content": wandb.Table(
                columns=["text"],
                data=[[f"Logged text at step {step}"]],
            ),
        }, step=step)

    # ---- Table with image overlays ----
    table = wandb.Table(columns=["image", "label"])
    for i in range(3):
        img = np.random.randint(0, 255, (32, 32, 3), dtype=np.uint8)
        mask = np.random.randint(0, 2, (32, 32), dtype=np.uint8)
        table.add_data(
            wandb.Image(
                img,
                masks={
                    "ground_truth": {
                        "mask_data": mask,
                        "class_labels": {0: "bg", 1: "fg"},
                    }
                },
                boxes={
                    "predictions": {
                        "box_data": [
                            {
                                "position": {"minX": 0.1, "maxX": 0.5, "minY": 0.1, "maxY": 0.5},
                                "class_id": 1,
                                "box_caption": "obj",
                            }
                        ],
                        "class_labels": {1: "obj"},
                    }
                },
            ),
            f"label-{i}",
        )
    run.log({"overlay_table": table})

    # ---- Molecule (PDB string) ----
    pdb_str = (
        "ATOM      1  N   ALA A   1       1.000   2.000   3.000  1.00  0.00           N\n"
        "ATOM      2  CA  ALA A   1       2.000   3.000   4.000  1.00  0.00           C\n"
        "END\n"
    )
    run.log({"molecule": wandb.Molecule.from_rdkit(pdb_str)}) if hasattr(wandb.Molecule, "from_rdkit") else None


def main() -> None:
    cfg = get_wandb_config()
    entity = cfg["entity"]
    project = create_project("media")
    log_debug(f"Creating media project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(42)
    np.random.seed(42)

    # ---- Run 0: primary media run ----
    log_debug("Run 0: media-primary")
    run = wandb.init(project=project, entity=entity, name="media-primary")
    _log_media(run)
    runs.append(RunInfo(id=run.id, name=run.name, display_name="media-primary"))
    run.finish()

    # ---- Runs 1-2: extra runs for compare-mode / sync tests ----
    for idx in range(1, 3):
        name = f"media-run-{idx}"
        log_debug(f"Run {idx}: {name}")
        run = wandb.init(project=project, entity=entity, name=name)
        for step in range(5):
            img = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
            mask = np.random.randint(0, 3, (64, 64), dtype=np.uint8)
            run.log({
                "images": wandb.Image(img, caption=f"{name}-step-{step}"),
                "images_with_masks": wandb.Image(
                    img,
                    masks={
                        "predictions": {
                            "mask_data": mask,
                            "class_labels": {0: "background", 1: "cat", 2: "dog"},
                        }
                    },
                ),
            }, step=step)
        runs.append(RunInfo(id=run.id, name=run.name, display_name=name))
        run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Media setup complete.")


if __name__ == "__main__":
    main()
