"""SDK setup: plots and custom chart scenarios.

Creates a project with runs demonstrating wandb.plot built-in charts,
matplotlib integration, and Plotly integration.
"""

from __future__ import annotations

import math
import os
import sys
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
    unique_name,
)

import wandb
import wandb.plot


def main() -> None:
    cfg = get_wandb_config()
    entity = cfg["entity"]
    project = create_project()
    log_debug(f"Creating plots project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # --- Run 1: wandb-plot-line ---
    log_debug("Run 1: wandb-plot-line")
    run = wandb.init(project=project, entity=entity, name="wandb-plot-line")
    xs = list(range(50))
    ys = [math.sin(x * 0.2) for x in xs]
    line_table = wandb.Table(data=list(zip(xs, ys)), columns=["x", "y"])
    run.log({"line-plot": wandb.plot.line(line_table, "x", "y", title="Sine Wave")})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="wandb-plot-line"))
    run.finish()

    # --- Run 2: wandb-plot-scatter ---
    log_debug("Run 2: wandb-plot-scatter")
    run = wandb.init(project=project, entity=entity, name="wandb-plot-scatter")
    import random
    random.seed(42)
    scatter_x = [random.gauss(0, 1) for _ in range(100)]
    scatter_y = [x + random.gauss(0, 0.5) for x in scatter_x]
    scatter_table = wandb.Table(data=list(zip(scatter_x, scatter_y)), columns=["x", "y"])
    run.log({"scatter-plot": wandb.plot.scatter(scatter_table, "x", "y", title="Scatter Plot")})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="wandb-plot-scatter"))
    run.finish()

    # --- Run 3: wandb-plot-bar ---
    log_debug("Run 3: wandb-plot-bar")
    run = wandb.init(project=project, entity=entity, name="wandb-plot-bar")
    labels = ["cat", "dog", "bird", "fish"]
    values = [35, 50, 20, 15]
    bar_table = wandb.Table(data=list(zip(labels, values)), columns=["label", "value"])
    run.log({"bar-chart": wandb.plot.bar(bar_table, "label", "value", title="Animal Counts")})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="wandb-plot-bar"))
    run.finish()

    # --- Run 4: wandb-plot-histogram ---
    log_debug("Run 4: wandb-plot-histogram")
    run = wandb.init(project=project, entity=entity, name="wandb-plot-histogram")
    random.seed(99)
    hist_values = [random.gauss(5, 2) for _ in range(200)]
    hist_table = wandb.Table(data=[[v] for v in hist_values], columns=["value"])
    run.log({"histogram": wandb.plot.histogram(hist_table, "value", title="Gaussian Distribution")})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="wandb-plot-histogram"))
    run.finish()

    # --- Run 5: wandb-plot-multiline (line_series) ---
    log_debug("Run 5: wandb-plot-multiline")
    run = wandb.init(project=project, entity=entity, name="wandb-plot-multiline")
    xs_series = list(range(50))
    ys_sin = [math.sin(x * 0.2) for x in xs_series]
    ys_cos = [math.cos(x * 0.2) for x in xs_series]
    ys_linear = [x / 50.0 for x in xs_series]
    run.log({
        "multi-line": wandb.plot.line_series(
            xs=xs_series,
            ys=[ys_sin, ys_cos, ys_linear],
            keys=["sin", "cos", "linear"],
            title="Multi-Line Plot",
            xname="step",
        ),
    })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="wandb-plot-multiline"))
    run.finish()

    # --- Run 6: wandb-plot-confusion-matrix ---
    log_debug("Run 6: wandb-plot-confusion-matrix")
    run = wandb.init(project=project, entity=entity, name="wandb-plot-confusion-matrix")
    y_true = [0, 0, 0, 1, 1, 1, 2, 2, 2]
    y_pred = [0, 0, 1, 1, 1, 0, 2, 2, 1]
    class_names = ["cat", "dog", "bird"]
    run.log({
        "confusion-matrix": wandb.plot.confusion_matrix(
            y_true=y_true,
            preds=y_pred,
            class_names=class_names,
        ),
    })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="wandb-plot-confusion-matrix"))
    run.finish()

    # --- Run 7: wandb-plot-pr-curve ---
    log_debug("Run 7: wandb-plot-pr-curve")
    run = wandb.init(project=project, entity=entity, name="wandb-plot-pr-curve")
    random.seed(7)
    y_true_binary = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0] * 10
    y_scores_binary = [
        (0.9 if label == 1 else 0.1) + random.gauss(0, 0.15)
        for label in y_true_binary
    ]
    run.log({
        "pr-curve": wandb.plot.pr_curve(
            y_true=y_true_binary,
            y_probas=[[1 - s, s] for s in y_scores_binary],
            labels=["negative", "positive"],
        ),
    })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="wandb-plot-pr-curve"))
    run.finish()

    # --- Run 8: wandb-plot-roc-curve ---
    log_debug("Run 8: wandb-plot-roc-curve")
    run = wandb.init(project=project, entity=entity, name="wandb-plot-roc-curve")
    run.log({
        "roc-curve": wandb.plot.roc_curve(
            y_true=y_true_binary,
            y_probas=[[1 - s, s] for s in y_scores_binary],
            labels=["negative", "positive"],
        ),
    })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="wandb-plot-roc-curve"))
    run.finish()

    # --- Run 9: matplotlib-plotly ---
    log_debug("Run 9: matplotlib-plotly")
    run = wandb.init(project=project, entity=entity, name="matplotlib-plotly")

    # Matplotlib figure
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots()
    ax.plot([1, 2, 3, 4, 5], [1, 4, 2, 3, 5], marker="o")
    ax.set_title("Matplotlib Line")
    ax.set_xlabel("X")
    ax.set_ylabel("Y")
    run.log({"matplotlib-chart": wandb.Image(fig)})
    plt.close(fig)

    # Plotly figure
    import plotly.graph_objects as go

    plotly_fig = go.Figure(
        data=[go.Scatter(x=[1, 2, 3, 4, 5], y=[5, 3, 4, 2, 1], mode="lines+markers")],
        layout=go.Layout(title="Plotly Line"),
    )
    run.log({"plotly-chart": wandb.Plotly(plotly_fig)})

    runs.append(RunInfo(id=run.id, name=run.name, display_name="matplotlib-plotly"))
    run.finish()

    # --- Run 10: custom-x-axis (define_metric) ---
    log_debug("Run 10: custom-x-axis")
    run = wandb.init(project=project, entity=entity, name="custom-x-axis")
    run.define_metric("validation_loss", step_metric="epoch")
    for epoch in range(20):
        t = epoch / 19
        val_loss = 2.0 * math.exp(-2.5 * t) + 0.07
        run.log({"epoch": epoch, "validation_loss": val_loss})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="custom-x-axis"))
    run.finish()

    # --- Run 11: glob-pattern (define_metric with glob) ---
    log_debug("Run 11: glob-pattern")
    run = wandb.init(project=project, entity=entity, name="glob-pattern")
    run.define_metric("train/*", step_metric="train/step")
    for step in range(40):
        t = step / 39
        run.log({
            "train/step": step,
            "train/loss": 1.8 * math.exp(-3.0 * t) + 0.04,
            "train/accuracy": 0.93 * (1 - math.exp(-2.8 * t)),
            "val/loss": 2.0 * math.exp(-2.2 * t) + 0.09,
        })
    runs.append(RunInfo(id=run.id, name=run.name, display_name="glob-pattern"))
    run.finish()

    # --- Run 12: smoothing (noisy metrics) ---
    log_debug("Run 12: smoothing")
    run = wandb.init(project=project, entity=entity, name="smoothing")
    random.seed(123)
    for step in range(200):
        t = step / 199
        base_loss = 2.0 * math.exp(-3.0 * t) + 0.05
        noisy_loss = base_loss + random.gauss(0, 0.3)
        run.log({"noisy_loss": noisy_loss})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="smoothing"))
    run.finish()

    # --- Run 13: high-volume (many data points for aggregation tests) ---
    log_debug("Run 13: high-volume")
    run = wandb.init(project=project, entity=entity, name="high-volume")
    run.define_metric("loss", step_metric="step")
    random.seed(456)
    for step in range(2000):
        t = step / 1999
        loss = 2.0 * math.exp(-3.0 * t) + 0.05 + random.gauss(0, 0.1)
        run.log({"step": step, "loss": loss})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="high-volume"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Plots setup complete.")


if __name__ == "__main__":
    main()
