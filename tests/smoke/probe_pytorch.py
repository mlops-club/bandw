"""PyTorch probe: trains a simple neural network and logs metrics to bandw.

Creates a project "pytorch-probe" with runs training on synthetic data
with different hyperparameters.

Usage:
    BANDW_URL=http://localhost:8080 uv run python tests/smoke/probe_pytorch.py
"""

import math
import os

os.environ["WANDB_BASE_URL"] = os.environ.get("BANDW_URL", "http://localhost:8080")
os.environ["WANDB_API_KEY"] = "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5"
os.environ["WANDB_CONSOLE"] = "wrap"
os.environ["WANDB_SILENT"] = "true"

import torch
import torch.nn as nn
import torch.optim as optim

import wandb

PROJECT = "pytorch-probe"
ENTITY = "admin"

# Synthetic classification dataset
torch.manual_seed(42)
n_samples = 500
n_features = 10
n_classes = 3

X = torch.randn(n_samples, n_features)
W_true = torch.randn(n_features, n_classes)
y = torch.argmax(X @ W_true + 0.3 * torch.randn(n_samples, n_classes), dim=1)

split = int(0.7 * n_samples)
X_train, X_test = X[:split], X[split:]
y_train, y_test = y[:split], y[split:]


class SimpleNet(nn.Module):
    def __init__(self, hidden_size, dropout=0.0):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_features, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, n_classes),
        )

    def forward(self, x):
        return self.net(x)


configs = [
    {"name": "small-net-lr1e-2", "hidden_size": 32, "lr": 0.01, "dropout": 0.0, "epochs": 100},
    {"name": "medium-net-lr1e-3", "hidden_size": 64, "lr": 0.001, "dropout": 0.1, "epochs": 100},
    {"name": "large-net-lr1e-3", "hidden_size": 128, "lr": 0.001, "dropout": 0.2, "epochs": 100},
    {"name": "large-net-lr5e-4", "hidden_size": 128, "lr": 0.0005, "dropout": 0.2, "epochs": 100},
]

for cfg in configs:
    print(f"Training {cfg['name']}...")

    run = wandb.init(
        project=PROJECT,
        name=cfg["name"],
        config={
            "hidden_size": cfg["hidden_size"],
            "learning_rate": cfg["lr"],
            "dropout": cfg["dropout"],
            "epochs": cfg["epochs"],
            "optimizer": "Adam",
            "n_features": n_features,
            "n_classes": n_classes,
        },
        tags=["pytorch", "classification", "synthetic"],
    )

    model = SimpleNet(cfg["hidden_size"], cfg["dropout"])
    optimizer = optim.Adam(model.parameters(), lr=cfg["lr"])
    criterion = nn.CrossEntropyLoss()

    for epoch in range(cfg["epochs"]):
        model.train()
        optimizer.zero_grad()
        logits = model(X_train)
        loss = criterion(logits, y_train)
        loss.backward()
        optimizer.step()

        # Compute metrics
        model.eval()
        with torch.no_grad():
            train_logits = model(X_train)
            train_loss = criterion(train_logits, y_train).item()
            train_acc = (train_logits.argmax(dim=1) == y_train).float().mean().item()

            test_logits = model(X_test)
            test_loss = criterion(test_logits, y_test).item()
            test_acc = (test_logits.argmax(dim=1) == y_test).float().mean().item()

            # Gradient norm
            total_norm = 0.0
            for p in model.parameters():
                if p.grad is not None:
                    total_norm += p.grad.data.norm(2).item() ** 2
            grad_norm = math.sqrt(total_norm)

        wandb.log(
            {
                "epoch": epoch,
                "train_loss": train_loss,
                "train_accuracy": train_acc,
                "test_loss": test_loss,
                "test_accuracy": test_acc,
                "learning_rate": cfg["lr"],
                "grad_norm": grad_norm,
            }
        )

    run.finish()
    print(f"  Done: test_accuracy={test_acc:.3f}, final_loss={test_loss:.4f}")

print(f"\nAll {len(configs)} pytorch runs completed in project '{PROJECT}'")
