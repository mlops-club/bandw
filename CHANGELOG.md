# Changelog

All notable changes to this project are documented in this file.

## [Unreleased] — 2026-04-19

### feat: pre-commit hooks via prek

- **Why:** Needed automated code quality gates to catch secrets, lint errors, and formatting issues before they enter git history.
- Added prek (Rust-native pre-commit tool) with tiered concurrency: fast checks at priority 0, language linters at priority 10, type checking at priority 20.
- Hooks: gitleaks, gosec, go-vet, ruff, prettier, eslint, svelte-check, conventional-commit enforcement.
- Configured via `prek.toml`; install with `just hooks-install`.

### feat: SDK conformance test suite

- **Why:** Need a regression gate that validates protocol compatibility with the upstream W&B SDK — catches breakage before it ships.
- Runs upstream `wandb-sdk` system tests against the bandw backend via a spy proxy and custom conftest.
- Baseline: 128+ of 161 tests passing across 13 categories; stored in `tests/wandb-conformance/baseline.txt`.
- CI mode (`--ci` flag) compares pass count against baseline; fails on regression.

### feat: artifact storage backend

- **Why:** `wandb.log_artifact()` requires createArtifact/commitArtifact GraphQL mutations and file upload/download endpoints that didn't exist yet.
- Added GraphQL mutations and queries for artifact CRUD, backed by local filesystem storage with path-traversal protection.
- Implements artifact versioning, manifest tracking, and file upload/download.
- Includes Go integration tests for the full artifact lifecycle.

### feat: Runs UI

- **Why:** Needed a way to visually browse experiment data during development without depending on the upstream W&B frontend.
- Svelte 5 SPA: project listing, runs table (search/filter/sort), run detail with metric charts and terminal-style log viewer.
- Backend extended with history sampling, log line queries, and project listing resolvers.
- Served as an embedded SPA from the Go server; CORS enabled for dev-mode hot reload.
