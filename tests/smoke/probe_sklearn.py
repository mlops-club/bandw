"""Scikit-learn probe: trains multiple models and logs metrics to bandw.

Creates a project "sklearn-probe" with several runs comparing classifiers
on the Iris dataset. Each run logs per-epoch training metrics.

Usage:
    BANDW_URL=http://localhost:8080 uv run python tests/smoke/probe_sklearn.py
"""

import os
import numpy as np

os.environ["WANDB_BASE_URL"] = os.environ.get("BANDW_URL", "http://localhost:8080")
os.environ["WANDB_API_KEY"] = "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5"
os.environ["WANDB_CONSOLE"] = "wrap"
os.environ["WANDB_SILENT"] = "true"

import wandb
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, f1_score, log_loss

PROJECT = "sklearn-probe"
ENTITY = "admin"

# Load dataset
X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

models = {
    "logistic-regression": LogisticRegression(max_iter=200, random_state=42),
    "random-forest": RandomForestClassifier(n_estimators=50, random_state=42),
    "gradient-boosting": GradientBoostingClassifier(n_estimators=50, random_state=42),
    "svm-rbf": SVC(probability=True, random_state=42),
    "knn-5": KNeighborsClassifier(n_neighbors=5),
}

for model_name, model in models.items():
    print(f"Training {model_name}...")

    run = wandb.init(
        project=PROJECT,
        name=model_name,
        config={
            "model": model_name,
            "dataset": "iris",
            "test_size": 0.3,
            "n_features": X.shape[1],
            "n_classes": len(set(y)),
        },
        tags=["sklearn", "classification", "iris"],
    )

    # Simulate training epochs by fitting on increasing fractions of data
    n_train = len(X_train)
    for epoch in range(20):
        frac = min(0.1 + epoch * 0.045, 1.0)
        n_samples = max(10, int(n_train * frac))
        X_sub = X_train[:n_samples]
        y_sub = y_train[:n_samples]

        model.fit(X_sub, y_sub)

        train_pred = model.predict(X_sub)
        train_prob = model.predict_proba(X_sub)
        test_pred = model.predict(X_test)
        test_prob = model.predict_proba(X_test)

        wandb.log({
            "epoch": epoch,
            "train_samples": n_samples,
            "train_accuracy": accuracy_score(y_sub, train_pred),
            "train_f1": f1_score(y_sub, train_pred, average="weighted"),
            "train_loss": log_loss(y_sub, train_prob),
            "test_accuracy": accuracy_score(y_test, test_pred),
            "test_f1": f1_score(y_test, test_pred, average="weighted"),
            "test_loss": log_loss(y_test, test_prob),
        })

    run.finish()
    print(f"  Done: test_accuracy={accuracy_score(y_test, model.predict(X_test)):.3f}")

print(f"\nAll {len(models)} sklearn runs completed in project '{PROJECT}'")
