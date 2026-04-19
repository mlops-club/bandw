# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### feat: pre-commit hooks via prek (thoughtful-sarahsaurus)

Added Git hook infrastructure using prek, a Rust-native pre-commit tool.
Hooks run in tiered concurrency: fast checks (whitespace, secrets, merge
conflicts) at priority 0, language linters (Go vet/gosec, ruff, prettier)
at priority 10, and type checking (svelte-check) at priority 20. Includes
gitleaks for secrets scanning and conventional-commit enforcement.

### feat: SDK conformance test suite (concrete-climb)

Introduced a conformance test runner that executes upstream W&B SDK system
tests directly against the bandw backend. A spy proxy intercepts SDK-to-
backend traffic, and a custom conftest replaces W&B's fixture service with
hardcoded local credentials. Baseline: 129 of 161 tests passing across
13 test categories. Merge gate: no regressions allowed.

### feat: artifact storage backend (rose-mass)

Added artifact CRUD via GraphQL mutations (createArtifact, commitArtifact)
and queries, backed by local filesystem storage with path-traversal
protection. Implements artifact versioning, manifest tracking, and the
file upload/download endpoints needed for `wandb.log_artifact()`. Includes
comprehensive Go integration tests.

### feat: Runs UI (glossy-emoji)

Added a Svelte 5 web frontend for browsing experiment data: project listing,
runs table with search/filter/sort, run detail views with metric charts and
terminal-style log viewer. Backend extended with history sampling, log line
queries, and project listing resolvers. Serves as an embedded SPA from the
Go server with CORS support for dev-mode hot reload.
