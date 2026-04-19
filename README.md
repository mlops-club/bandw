# bandw

A self-hosted, W&B-compatible experiment tracking backend and collaboration UI.
Point the official `wandb` Python SDK at it instead of `api.wandb.ai`.

## Contributing

### Prerequisites

- **Go 1.26+** (backend)
- **uv** (Python tooling) — [install uv](https://docs.astral.sh/uv/getting-started/installation/)
- **prek** (git hooks) — installed via uv, see below
- **gosec** (Go security scanner) — `go install github.com/securego/gosec/v2/cmd/gosec@latest`

### First-time setup

```bash
# 1. Install prek globally so it's available across all your repos.
#    You only need to do this once per machine.
uv tool install prek

# 2. Install Python dev dependencies (including a project-local prek).
uv sync

# 3. Install the git hook shims. This wires prek into git's pre-commit,
#    pre-push, and commit-msg hooks so checks run automatically.
uv run prek install

# 4. Install gosec (Go security scanner). It's a Go binary, not a
#    pre-commit repo, so it needs a separate install.
go install github.com/securego/gosec/v2/cmd/gosec@latest
```

After step 3, prek runs automatically on every commit and push. You
don't need to remember to lint — it happens for you.

### Running hooks manually

```bash
# Run all hooks against all files (not just staged changes).
# Useful after pulling, or to verify the repo is clean.
uv run prek run --all-files

# Run against only staged files (what happens on git commit).
uv run prek run

# Run a single hook by name — handy when fixing a specific failure.
uv run prek run ruff
uv run prek run go-fmt
uv run prek run gitleaks

# If you installed prek globally (step 1), you can skip the `uv run` prefix.
prek run --all-files
```

### What the hooks enforce

Hooks are configured in `prek.toml` at the repo root.

**On every commit (pre-commit):**

| Check | What it catches |
|---|---|
| trailing-whitespace, end-of-file-fixer | Noisy diffs from whitespace inconsistency |
| check-yaml, check-json, check-toml | Syntax errors in config files |
| detect-private-key, gitleaks | Secrets, API keys, PEM/SSH keys before they enter git history |
| check-added-large-files (500KB) | Accidentally committed data dumps, model weights, SQLite files |
| block-data-files | Data/model files by extension (csv, parquet, pt, onnx, etc.) even if small |
| no-commit-to-branch | Direct commits to `main` (use a PR instead) |
| go-fmt, go-vet, go-mod-tidy | Go formatting, bug detection, dependency hygiene |
| gosec | Go security vulnerabilities (SQL injection, weak crypto, etc.) |
| ruff, ruff-format | Python linting (including security rules) and formatting |
| prettier, eslint | Frontend formatting and linting (when `frontend/` exists) |
| svelte-check | Svelte/TypeScript type checking (when `frontend/` exists) |

**On every push (pre-push):**

| Check | What it catches |
|---|---|
| go test | Test regressions before code leaves your machine |
| python smoke check | Syntax errors in Python test files |

**On every commit message (commit-msg):**

| Check | What it catches |
|---|---|
| conventional-pre-commit | Non-conventional commit messages (must start with `feat:`, `fix:`, etc.) |

### Updating hooks

```bash
# Bump all hook repos to their latest tags.
# Review the changes in prek.toml before committing.
uv run prek autoupdate
```

### Skipping hooks (escape hatch)

If you need to bypass hooks for a legitimate reason (e.g. WIP commit,
cherry-pick that will be cleaned up):

```bash
# Skip all hooks for one commit
git commit --no-verify -m "wip: checkpoint"

# Skip a specific hook
SKIP=gosec git commit -m "feat: allow int32 cast for now"
```

Use sparingly — CI should enforce the same checks.
