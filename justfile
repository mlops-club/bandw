# bandw server justfile

# Default: show available recipes
default:
    @just --list

# Build the server binary
build:
    CGO_ENABLED=1 go build -o bin/server ./cmd/server/

# Run the server (requires DATABASE_URL env var or running MySQL via docker)
run: build
    DATABASE_URL="${DATABASE_URL:-wandb:wandb@tcp(127.0.0.1:3306)/wandb?parseTime=true}" ./bin/server

# Run all tests
test:
    CGO_ENABLED=1 go test ./...

# Run tests with verbose output
test-v:
    CGO_ENABLED=1 go test -v ./...

# Start MySQL via docker compose
db-up:
    docker compose up -d

# Stop MySQL
db-down:
    docker compose down

# Tidy go modules
tidy:
    go mod tidy

# Clean build artifacts
clean:
    rm -rf bin/

# ── Git hooks ──

# Install all git hook shims (pre-commit, pre-push, commit-msg).
# Run this once after cloning, or after adding prek to dev deps.
hooks-install:
    uv run --project tests/wandb-conformance prek install

# Run every hook against all files — useful for CI, or to validate
# the repo after changing prek.toml.
lint:
    uv run --project tests/wandb-conformance prek run --all-files

# Bump all hook revs to their latest tags. Review the diff before committing —
# a broken hook update shouldn't block the whole team.
hooks-update:
    uv run --project tests/wandb-conformance prek autoupdate

# ── CI ──

# Run prek hooks, skipping branch-protection (for CI on PRs to main).
ci-lint:
    SKIP=no-commit-to-branch uv run --project tests/wandb-conformance prek run --all-files

# Run the full SDK conformance test suite.
conformance:
    ./tests/wandb-conformance/run.sh

# Run conformance tests in CI mode (pass if >= baseline, fail on regression).
conformance-ci:
    ./tests/wandb-conformance/run.sh --ci
