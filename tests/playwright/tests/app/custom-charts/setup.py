"""SDK setup: custom charts tests.

Creates a project with runs demonstrating all built-in wandb.plot presets
(line, scatter, bar, histogram, PR curve, ROC curve) plus a custom table
chart logged via wandb.plot_table.
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
import wandb.plot


def main() -> None:
    cfg = get_wandb_config()
    entity = cfg["entity"]
    project = create_project("custom-charts")
    log_debug(f"Creating custom-charts project: {project}")

    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []
    random.seed(42)

    # ---- Run 0: line plot ----
    log_debug("Run 0: custom-line")
    run = wandb.init(project=project, entity=entity, name="custom-line")
    xs = list(range(50))
    ys = [math.sin(x * 0.2) for x in xs]
    if not is_bandw:
        line_table = wandb.Table(data=list(zip(xs, ys, strict=False)), columns=["x", "y"])
        run.log({"line-plot": wandb.plot.line(line_table, "x", "y", title="Custom Line")})
    else:
        for x_val, y_val in zip(xs, ys, strict=False):
            run.log({"x": x_val, "y": y_val})
        run.config.update(
            {
                "_bandw_charts": [
                    {"title": "Custom Line", "type": "line", "xKey": "x", "yKey": "y"},
                ]
            }
        )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-line"))
    run.finish()

    # ---- Run 1: scatter plot ----
    log_debug("Run 1: custom-scatter")
    run = wandb.init(project=project, entity=entity, name="custom-scatter")
    scatter_x = [random.gauss(0, 1) for _ in range(100)]
    scatter_y = [x + random.gauss(0, 0.5) for x in scatter_x]
    if not is_bandw:
        scatter_table = wandb.Table(data=list(zip(scatter_x, scatter_y, strict=False)), columns=["x", "y"])
        run.log({"scatter-plot": wandb.plot.scatter(scatter_table, "x", "y", title="Custom Scatter")})
    else:
        for sx, sy in zip(scatter_x, scatter_y, strict=False):
            run.log({"x": sx, "y": sy})
        run.config.update(
            {
                "_bandw_charts": [
                    {"title": "Custom Scatter", "type": "scatter", "xKey": "x", "yKey": "y"},
                ]
            }
        )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-scatter"))
    run.finish()

    # ---- Run 2: bar chart ----
    log_debug("Run 2: custom-bar")
    run = wandb.init(project=project, entity=entity, name="custom-bar")
    labels = ["cat", "dog", "bird", "fish"]
    values = [35, 50, 20, 15]
    if not is_bandw:
        bar_table = wandb.Table(data=list(zip(labels, values, strict=False)), columns=["label", "value"])
        run.log({"bar-chart": wandb.plot.bar(bar_table, "label", "value", title="Animal Counts")})
    else:
        for lbl, val in zip(labels, values, strict=False):
            run.log({"label": lbl, "value": val})
        run.config.update(
            {
                "_bandw_charts": [
                    {
                        "title": "Animal Counts",
                        "type": "bar",
                        "labelKey": "label",
                        "valueKey": "value",
                        "data": [{"label": lbl, "value": v} for lbl, v in zip(labels, values, strict=False)],
                    },
                ]
            }
        )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-bar"))
    run.finish()

    # ---- Run 3: histogram ----
    log_debug("Run 3: custom-histogram")
    run = wandb.init(project=project, entity=entity, name="custom-histogram")
    hist_values = [random.gauss(5, 2) for _ in range(200)]
    if not is_bandw:
        hist_table = wandb.Table(data=[[v] for v in hist_values], columns=["scores"])
        run.log({"histogram": wandb.plot.histogram(hist_table, "scores", title="Score Distribution")})
    else:
        for hv in hist_values:
            run.log({"scores": hv})
        run.config.update(
            {
                "_bandw_charts": [
                    {
                        "title": "Score Distribution",
                        "type": "histogram",
                        "valueKey": "scores",
                        "data": [{"scores": v} for v in hist_values],
                    },
                ]
            }
        )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-histogram"))
    run.finish()

    # ---- Run 4: PR curve ----
    log_debug("Run 4: custom-pr-curve")
    run = wandb.init(project=project, entity=entity, name="custom-pr-curve")
    y_true = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0] * 10
    y_scores = [(0.9 if label == 1 else 0.1) + random.gauss(0, 0.15) for label in y_true]
    if not is_bandw:
        run.log(
            {
                "pr-curve": wandb.plot.pr_curve(
                    y_true=y_true,
                    y_probas=[[1 - s, s] for s in y_scores],
                    labels=["negative", "positive"],
                ),
            }
        )
    else:
        # Compute a simple PR curve from the data
        sorted_pairs = sorted(zip(y_scores, y_true, strict=False), reverse=True)
        pr_data = []
        tp, fp = 0, 0
        for i, (_score, label) in enumerate(sorted_pairs):
            if label == 1:
                tp += 1
            else:
                fp += 1
            precision = tp / (tp + fp)
            recall = tp / sum(y_true)
            if i % 5 == 0:
                pr_data.append({"recall": round(recall, 4), "precision": round(precision, 4)})
        for pt in pr_data:
            run.log(pt)
        run.config.update(
            {
                "_bandw_charts": [
                    {"title": "pr-curve", "type": "line", "xKey": "recall", "yKey": "precision"},
                ]
            }
        )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-pr-curve"))
    run.finish()

    # ---- Run 5: ROC curve ----
    log_debug("Run 5: custom-roc-curve")
    run = wandb.init(project=project, entity=entity, name="custom-roc-curve")
    if not is_bandw:
        run.log(
            {
                "roc-curve": wandb.plot.roc_curve(
                    y_true=y_true,
                    y_probas=[[1 - s, s] for s in y_scores],
                    labels=["negative", "positive"],
                ),
            }
        )
    else:
        # Compute a simple ROC curve from the data
        sorted_pairs = sorted(zip(y_scores, y_true, strict=False), reverse=True)
        total_pos = sum(y_true)
        total_neg = len(y_true) - total_pos
        roc_data = []
        tp, fp = 0, 0
        for i, (_score, label) in enumerate(sorted_pairs):
            if label == 1:
                tp += 1
            else:
                fp += 1
            fpr = fp / total_neg if total_neg > 0 else 0
            tpr = tp / total_pos if total_pos > 0 else 0
            if i % 5 == 0:
                roc_data.append({"fpr": round(fpr, 4), "tpr": round(tpr, 4)})
        for pt in roc_data:
            run.log(pt)
        run.config.update(
            {
                "_bandw_charts": [
                    {"title": "roc-curve", "type": "line", "xKey": "fpr", "yKey": "tpr"},
                ]
            }
        )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-roc-curve"))
    run.finish()

    # ---- Run 6: custom table chart via plot_table ----
    log_debug("Run 6: custom-table-chart")
    run = wandb.init(project=project, entity=entity, name="custom-table-chart")
    table_data = [(1, 2.1), (2, 1.5), (3, 1.0), (4, 0.7), (5, 0.5)]
    if not is_bandw:
        custom_table = wandb.Table(
            columns=["epoch", "train_loss", "val_loss"],
            data=[
                [1, 2.1, 2.3],
                [2, 1.5, 1.8],
                [3, 1.0, 1.3],
                [4, 0.7, 1.0],
                [5, 0.5, 0.8],
            ],
        )
        run.log(
            {
                "custom-table-viz": wandb.plot_table(
                    vega_spec_name="wandb/line/v0",
                    data_table=custom_table,
                    fields={"x": "epoch", "y": "train_loss"},
                    string_fields={"title": "Training Progress"},
                ),
            }
        )
    else:
        for epoch, train_loss in table_data:
            run.log({"epoch": epoch, "train_loss": train_loss})
        run.config.update(
            {
                "_bandw_charts": [
                    {"title": "Training Progress", "type": "line", "xKey": "epoch", "yKey": "train_loss"},
                ]
            }
        )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-table-chart"))
    run.finish()

    # ---- Run 7: edit-target (basic run for UI editing tests) ----
    log_debug("Run 7: edit-target")
    run = wandb.init(project=project, entity=entity, name="edit-target")
    edit_data = [[i, math.cos(i * 0.3)] for i in range(30)]
    if not is_bandw:
        edit_table = wandb.Table(
            columns=["x", "y"],
            data=edit_data,
        )
        run.log(
            {
                "editable-chart": wandb.plot.line(edit_table, "x", "y", title="Editable Chart"),
            }
        )
    else:
        for x_val, y_val in edit_data:
            run.log({"x": x_val, "y": y_val})
        run.config.update(
            {
                "_bandw_charts": [
                    {"title": "Editable Chart", "type": "line", "xKey": "x", "yKey": "y"},
                ]
            }
        )
    runs.append(RunInfo(id=run.id, name=run.name, display_name="edit-target"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Custom-charts setup complete.")


if __name__ == "__main__":
    main()
