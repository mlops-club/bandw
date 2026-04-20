"""Shared helpers for SDK setup scripts.

Every setup.py imports from here. The contract is:
  1. Create wandb data (runs, artifacts, etc.)
  2. Print a JSON manifest to stdout
  3. Exit cleanly

All debug/progress output goes to stderr so Playwright can parse stdout.
"""

from __future__ import annotations

import json
import os
import sys
import uuid
from dataclasses import dataclass, field, asdict
from typing import Any


def unique_name(prefix: str = "pw") -> str:
    """Generate a unique project/run name with a UUID suffix."""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def get_wandb_config() -> dict[str, str]:
    """Return env-based wandb config for the active target."""
    return {
        "base_url": os.environ.get("WANDB_BASE_URL", "http://localhost:8081"),
        "api_key": os.environ.get("WANDB_API_KEY", "local-dev-key"),
        "entity": os.environ.get("WANDB_ENTITY", "admin"),
    }


def log_debug(msg: str) -> None:
    """Print to stderr so it doesn't interfere with JSON stdout."""
    print(msg, file=sys.stderr)


@dataclass
class RunInfo:
    id: str
    name: str
    display_name: str = ""


@dataclass
class ArtifactInfo:
    name: str
    type: str
    version: str


@dataclass
class Manifest:
    """The JSON contract between setup.py and Playwright fixtures."""

    project: str
    entity: str
    runs: list[RunInfo] = field(default_factory=list)
    artifacts: list[ArtifactInfo] = field(default_factory=list)
    extra: dict[str, Any] = field(default_factory=dict)


def output_manifest(manifest: Manifest) -> None:
    """Print the manifest as JSON to stdout and exit."""
    data = asdict(manifest)
    # Convert snake_case keys to camelCase for TypeScript consumption.
    for run in data["runs"]:
        run["displayName"] = run.pop("display_name", "")
    print(json.dumps(data))


def create_project(project_name: str | None = None) -> str:
    """Return a unique project name (does not create it — wandb.init does that)."""
    return unique_name(project_name or "pw")
