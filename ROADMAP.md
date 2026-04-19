# Roadmap

What's next for bandw — roughly in priority order.

## Finish the artifacts API surface

The current implementation covers `createArtifact`, `commitArtifact`, and basic
queries. Still needed: artifact download via the public API, artifact aliases,
artifact lineage (input/output edges across runs), and the `useArtifact` flow
that the SDK exercises during training.

## Real-time log streaming (stdout and metrics)

Today, logs and metrics are only visible after `run.finish()`. Add streaming
support so stdout lines and metric values appear in the UI as the training
script emits them. This likely means a WebSocket or SSE endpoint that the
frontend subscribes to, with the file_stream handler publishing events as
they arrive.

## Opt-in SSO with 12-factor config

Add authentication beyond the hardcoded API key. Support OIDC/SAML SSO
providers, configured entirely through CLI flags, environment variables, and
a YAML config file (no UI-based setup required). Follow 12-factor config
conventions so the server works identically in dev, Docker, and managed
deployments.

## User and API key management

Add CRUD for users and API keys: create/revoke keys, per-user permissions,
team membership. The seeded `admin` user works for local dev, but multi-user
deployments need real identity management.

## Database migration framework

Replace GORM `AutoMigrate` with a proper migration tool (e.g. golang-migrate
or Atlas) so schema changes are versioned, reversible, and safe to apply
against production databases without data loss.

## Reference IaC deployment scripts

Provide ready-to-use infrastructure-as-code for common deployment targets:

- **AWS Lambda** — serverless, scales to zero, minimal ops overhead
- **AWS ECS** — container-based, better for sustained workloads

Goal: people should be able to trust the deployment to just work — copy the
template, set a few variables, deploy.

## MLflow import

The `wandb` SDK already has MLflow import capabilities. Investigate and verify
that the import path works against bandw so teams migrating from MLflow can
bring their history with them.

## UI rework

The current UI is a functional prototype. A deliberate rework should address:

- **Color scheme** — cohesive light and dark themes
- **Responsiveness** — usable on tablets and narrow viewports
- **Accessibility** — keyboard navigation, screen reader support, ARIA labels
- **Panel resizing** — draggable panels for charts, logs, and metadata
- **Experiment diffing** — side-by-side run comparison with metric overlays
  and config diffs

## Multi-SDK support

Add compatibility with other experiment tracking SDKs beyond W&B:

- Comet ML
- MLflow
- Others as demand warrants

This is easier now that we have a v1 data model — each SDK adapter maps to
the same internal schema. Run the OSS test suite for each SDK against our API
for verification, similar to how we use the W&B conformance suite today.

## Add an MIT license

Ship a `LICENSE` file so the project's terms are explicit and adoption is
frictionless.
