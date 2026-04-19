#!/usr/bin/env bash
#
# Run W&B SDK system tests against the bandw backend.
#
# Usage:
#   ./tests/wandb-conformance/run.sh          # full suite
#   ./tests/wandb-conformance/run.sh --quick  # smoke test (~8 tests)
#   ./tests/wandb-conformance/run.sh --ci     # full suite, pass if >= baseline
#
# Prerequisites: Go toolchain, uv, git

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CONFORMANCE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

BANDW_PORT="${BANDW_PORT:-0}"
BANDW_API_KEY="1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5"
SQLITE_PATH="$(mktemp -d)/bandw-test.sqlite"
SERVER_PID=""
PYTEST_OUTPUT=""

cleanup() {
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
    if [ -f wandb-sdk/tests/system_tests/conftest.py.orig ]; then
        mv wandb-sdk/tests/system_tests/conftest.py.orig \
           wandb-sdk/tests/system_tests/conftest.py
    fi
    rm -f "$SQLITE_PATH" 2>/dev/null || true
    [ -n "$PYTEST_OUTPUT" ] && rm -f "$PYTEST_OUTPUT" 2>/dev/null || true
}
trap cleanup EXIT

# ── Parse flags ───────────────────────────────────────────────────────
MODE="full"
CI_MODE=false
for arg in "$@"; do
    case "$arg" in
        --quick) MODE="quick" ;;
        --ci)    CI_MODE=true ;;
    esac
done

# ── Submodule ──────────────────────────────────────────────────────────
echo "==> Initializing wandb-sdk submodule..."
if [ ! -f wandb-sdk/pyproject.toml ]; then
    git submodule update --init wandb-sdk
fi

# ── Python deps ────────────────────────────────────────────────────────
echo "==> Syncing Python dependencies..."
uv sync --project "$CONFORMANCE_DIR" --quiet 2>/dev/null || uv sync --project "$CONFORMANCE_DIR"

# ── wandb-core binary ─────────────────────────────────────────────────
# The submodule's wandb package doesn't include the pre-built wandb-core
# binary. Symlink it from the pip-installed wandb so tests can start the
# internal service process.
INSTALLED_CORE="$(uv run --project "$CONFORMANCE_DIR" python -c "import wandb, pathlib; print(pathlib.Path(wandb.__file__).parent / 'bin' / 'wandb-core')")"
if [ -f "$INSTALLED_CORE" ] && [ ! -f wandb-sdk/wandb/bin/wandb-core ]; then
    mkdir -p wandb-sdk/wandb/bin
    ln -sf "$INSTALLED_CORE" wandb-sdk/wandb/bin/wandb-core
    echo "==> Symlinked wandb-core from installed package."
fi

# ── Build & start server ──────────────────────────────────────────────
echo "==> Building bandw server..."
CGO_ENABLED=1 go build -o bin/server ./cmd/server/

if [ "$BANDW_PORT" = "0" ]; then
    BANDW_PORT=$(python3 -c "import socket; s=socket.socket(); s.bind(('',0)); print(s.getsockname()[1]); s.close()")
fi

echo "==> Starting bandw server on port $BANDW_PORT..."
PORT="$BANDW_PORT" BANDW_SQLITE_PATH="$SQLITE_PATH" ./bin/server &
SERVER_PID=$!

for i in $(seq 1 30); do
    if curl -sf "http://localhost:$BANDW_PORT/healthz" >/dev/null 2>&1; then
        echo "==> Server is healthy."
        break
    fi
    if [ "$i" = "30" ]; then
        echo "ERROR: Server did not become healthy within 30 seconds."
        exit 1
    fi
    sleep 1
done

# ── Swap conftest ─────────────────────────────────────────────────────
echo "==> Installing bandw conftest override..."
cp wandb-sdk/tests/system_tests/conftest.py \
   wandb-sdk/tests/system_tests/conftest.py.orig
cp "$CONFORMANCE_DIR/conftest_bandw.py" \
   wandb-sdk/tests/system_tests/conftest.py

# ── Run tests ─────────────────────────────────────────────────────────
echo "==> Running SDK conformance tests..."

export BANDW_BASE_URL="http://localhost:$BANDW_PORT"
export BANDW_API_KEY
export BANDW_ENTITY="admin"
export BANDW_USERNAME="admin"
export PYTHONPATH="wandb-sdk:${PYTHONPATH:-}"

# Build pytest --ignore flags from the ignore file.
# Strip comments, blank lines, and leading/trailing whitespace.
clean_lines() { sed 's/#.*//; s/^[[:space:]]*//; s/[[:space:]]*$//' "$1" | grep -v '^$'; }

PYTEST_EXTRA_FLAGS=()
while IFS= read -r path; do
    PYTEST_EXTRA_FLAGS+=("--ignore=$path")
done < <(clean_lines "$CONFORMANCE_DIR/ignore-files.txt")

PYTEST_OUTPUT="$(mktemp)"

# Temporarily disable set -e so pytest failures don't abort before baseline check.
set +e

if [ "$MODE" = "quick" ]; then
    echo "==> Quick mode: running smoke-test subset only."
    QUICK_TESTS=()
    while IFS= read -r line; do
        line="${line%%#*}"
        line="${line## }"
        line="${line%% }"
        [ -z "$line" ] && continue
        QUICK_TESTS+=("$line")
    done < "$CONFORMANCE_DIR/quick-tests.txt"

    uv run --project "$CONFORMANCE_DIR" pytest \
        "${QUICK_TESTS[@]}" \
        -v --timeout=5 --no-header -n auto \
        -o "addopts=" \
        2>&1 | tee "$PYTEST_OUTPUT"
    EXIT_CODE=${PIPESTATUS[0]}
else
    uv run --project "$CONFORMANCE_DIR" pytest \
        wandb-sdk/tests/system_tests/test_core/ \
        "${PYTEST_EXTRA_FLAGS[@]}" \
        -v --timeout=5 --no-header -n auto \
        -o "addopts=" \
        2>&1 | tee "$PYTEST_OUTPUT"
    EXIT_CODE=${PIPESTATUS[0]}
fi

set -e

# ── Baseline check (CI mode) ─────────────────────────────────────────
if $CI_MODE; then
    BASELINE_FILE="$CONFORMANCE_DIR/baseline.txt"
    if [ -f "$BASELINE_FILE" ]; then
        BASELINE=$(tr -d '[:space:]' < "$BASELINE_FILE")
        # Extract "N passed" from pytest summary line (portable, no grep -P)
        PASSED=$(grep -oE '[0-9]+ passed' "$PYTEST_OUTPUT" | grep -oE '[0-9]+' | tail -1)
        PASSED="${PASSED:-0}"
        echo ""
        echo "==> Baseline: $BASELINE passed | Actual: $PASSED passed"
        if [ "$PASSED" -ge "$BASELINE" ]; then
            echo "==> Conformance baseline met ($PASSED >= $BASELINE). CI pass."
            exit 0
        else
            echo "==> REGRESSION: $PASSED < $BASELINE. CI fail."
            exit 1
        fi
    fi
fi

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "==> All SDK conformance tests passed."
else
    echo "==> Some SDK conformance tests failed (exit code $EXIT_CODE)."
fi

exit $EXIT_CODE
