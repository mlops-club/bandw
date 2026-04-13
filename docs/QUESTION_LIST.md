# QUESTION_LIST: W&B-Compatible Backend in Go

**Goal:** Build a Go backend that the official `wandb` Python SDK can use as a drop-in replacement for `api.wandb.ai`, verified one behavior at a time using wandb tutorial code snippets.

---

## Current State Questions

### Q1: What does the SDK actually send on `wandb.init()`?
- **RESOLVED.** See OBJECTIVE_CONTEXT.md F3-F7.
- Order: Viewer → ServerFeaturesQuery (lazy) → UpsertBucket → start file_stream.
- Viewer requires `entity` to be non-null.
- ServerInfo can be empty `{}`.
- UpsertBucket input/output shapes fully documented.

### Q2: What does the `file_stream` request look like in practice?
- **RESOLVED.** See OBJECTIVE_CONTEXT.md F8.
- Go struct types documented from SDK source.
- Heartbeats are `{}` (empty). Completion is `{complete: true, exitcode: N}`.
- Transmit interval 15s, heartbeat 30s, 3-min timeout, ~10MB max.
- Does NOT retry 400/403/404/409.

### Q3: What are the exact GraphQL schema types the SDK expects?
- **RESOLVED.** See OBJECTIVE_CONTEXT.md F4-F7, F9.
- JSONString scalar, Relay pagination, model=project, bucket=run.

### Q4: What does `ServerFeaturesQuery` return and which flags matter?
- **RESOLVED.** See OBJECTIVE_CONTEXT.md F6.
- Return empty `features: []` for MVP. All flags default to false/disabled.
- 18 known feature flags; none required for Tier 0.

### Q5: What does `clientIDMapping` resolve?
- **DEFERRED.** Only needed for artifact flow (Slice 10+). Not in Tier 0 scope.

---

## Decisions (Resolved)

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| D1 | Database | **MySQL 8.0** | Proven, matches spec. Refactor later if needed. |
| D2 | Architecture | **Single Go binary** | Simpler. All handlers in one process. |
| D3 | Test strategy | **Real wandb SDK scripts** | SDK is source of truth. No mocks. |
| D4 | Frontend timing | **Cross-sectional** | Each slice goes backend → DB → UI. One feature end-to-end before next. |
| D5 | Phase 1 scope | **Tier 0: init + log + finish** | Artifacts deferred to Slice 10. |

## Assumptions (Resolved)

| # | Assumption | Status |
|---|-----------|--------|
| A1 | MySQL from start | **Confirmed** by user decision. |
| A2 | Single binary | **Confirmed** by user decision. |
| A3 | No Redis for MVP | **Confirmed** by research. SDK does not require Redis-dependent features for Tier 0. |
| A4 | MinIO compat | **Deferred.** Not needed until Slice 9 (file uploads). |
| A5 | gqlgen for GraphQL | **Confirmed.** Type-safe, code-gen, good fit for Go. |
