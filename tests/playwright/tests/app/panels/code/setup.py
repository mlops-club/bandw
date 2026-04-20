"""SDK setup: code panel tests.

Creates a project with multiple runs that have code saving enabled.
Run 0 uses run.log_code(".") to save library code.
Run 1 uses the code_dir setting.
Run 2 is a second run for code-comparer diffing.
"""

from __future__ import annotations

import os
import sys
import tempfile
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
    project = create_project("code")
    log_debug(f"Creating code project: {project}")

    os.environ["WANDB_BASE_URL"] = cfg["base_url"]
    os.environ["WANDB_API_KEY"] = cfg["api_key"]

    runs: list[RunInfo] = []

    # Create a temporary directory with sample source files for code logging
    code_dir = tempfile.mkdtemp(prefix="bandw-code-")
    sample_files = {
        "train.py": (
            "import torch\n"
            "\n"
            "def train(model, data):\n"
            "    for batch in data:\n"
            "        loss = model(batch)\n"
            "        loss.backward()\n"
            "    return model\n"
        ),
        "model.py": (
            "import torch.nn as nn\n"
            "\n"
            "class SimpleNet(nn.Module):\n"
            "    def __init__(self):\n"
            "        super().__init__()\n"
            "        self.fc = nn.Linear(10, 1)\n"
            "\n"
            "    def forward(self, x):\n"
            "        return self.fc(x)\n"
        ),
        "utils.py": (
            "def compute_accuracy(preds, labels):\n"
            "    return (preds == labels).mean()\n"
        ),
    }
    for fname, content in sample_files.items():
        (Path(code_dir) / fname).write_text(content)

    # ---- Run 0: log_code with explicit path ----
    log_debug("Run 0: code-log-explicit")
    run = wandb.init(
        project=project,
        entity=entity,
        name="code-log-explicit",
        config={"lr": 0.01, "epochs": 10},
    )
    run.log_code(code_dir)
    for step in range(10):
        run.log({"train/loss": 2.0 / (step + 1)})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="code-log-explicit"))
    run.finish()

    # ---- Run 1: code_dir setting ----
    log_debug("Run 1: code-dir-setting")
    run = wandb.init(
        project=project,
        entity=entity,
        name="code-dir-setting",
        settings=wandb.Settings(code_dir=code_dir),
        config={"lr": 0.005, "epochs": 20},
    )
    for step in range(10):
        run.log({"train/loss": 1.8 / (step + 1)})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="code-dir-setting"))
    run.finish()

    # ---- Run 2: modified code for comparer diff ----
    log_debug("Run 2: code-modified")
    # Modify a file so the code comparer has something to diff
    (Path(code_dir) / "train.py").write_text(
        "import torch\n"
        "\n"
        "def train(model, data, lr=0.001):\n"
        "    optimizer = torch.optim.Adam(model.parameters(), lr=lr)\n"
        "    for batch in data:\n"
        "        loss = model(batch)\n"
        "        loss.backward()\n"
        "        optimizer.step()\n"
        "    return model\n"
    )
    run = wandb.init(
        project=project,
        entity=entity,
        name="code-modified",
        config={"lr": 0.001, "epochs": 30},
    )
    run.log_code(code_dir)
    for step in range(10):
        run.log({"train/loss": 1.5 / (step + 1)})
    runs.append(RunInfo(id=run.id, name=run.name, display_name="code-modified"))
    run.finish()

    manifest = Manifest(project=project, entity=entity, runs=runs)
    output_manifest(manifest)
    log_debug("Code panel setup complete.")


if __name__ == "__main__":
    main()
