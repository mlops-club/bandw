# System Spec: Self-Hosted W&B-Compatible Backend

A backend that the official `wandb` Python SDK can point to instead of `api.wandb.ai`.

```
wandb.init(settings=wandb.Settings(base_url="https://your-server.example.com"))
# or
export WANDB_BASE_URL=https://your-server.example.com
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        wandb Python SDK                              │
│  wandb.init() / wandb.log() / wandb.finish()                        │
│                                                                      │
│  ┌──────────────┐    protobuf/socket    ┌──────────────────┐        │
│  │ User Process  │ ──────────────────►  │ wandb-core (Go)   │        │
│  └──────────────┘                       │ (bundled w/ SDK)  │        │
│                                          └───────┬──────────┘        │
└──────────────────────────────────────────────────┼───────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────┐
                    │                              │              │
              GraphQL POST              REST POST           PUT (pre-signed)
              /graphql                  /files/.../          S3/MinIO
                    │                  file_stream            │
                    ▼                      ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     YOUR SELF-HOSTED BACKEND                        │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     API Gateway / Ingress                      │  │
│  │              (nginx/traefik - TLS termination)                 │  │
│  └──────┬────────────────┬────────────────┬──────────────────────┘  │
│         │                │                │                         │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐                │
│  │  GraphQL    │  │ File Stream │  │ Auth / SSO  │                │
│  │  Service    │  │  Service    │  │  Service    │                │
│  │  (port 8080)│  │  (port 8080)│  │ (OIDC IdP)  │                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                │                         │
│  ┌──────▼────────────────▼────────────────▼──────┐                 │
│  │              Shared Data Layer                  │                 │
│  │                                                 │                 │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │                 │
│  │  │  MySQL   │  │  Redis   │  │ Object Store │ │                 │
│  │  │ 8.0.32+  │  │  7.x     │  │ (MinIO/S3)   │ │                 │
│  │  └──────────┘  └──────────┘  └──────────────┘ │                 │
│  └────────────────────────────────────────────────┘                 │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Frontend (SPA)                             │  │
│  │                  Svelte 5 app on port 80/443                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backend Service Specification

### 1. GraphQL Service

The single most important service. Handles all structured metadata.

**Endpoint:** `POST /graphql`

**Required Mutations (minimum viable):**

| Mutation | Purpose | Priority |
|---|---|---|
| `upsertBucket` | Create/update runs | P0 |
| `createRunFiles` | Get upload URLs for run files | P1 |
| `createArtifact` | Register artifact versions | P1 |
| `createArtifactManifest` | Describe artifact contents | P1 |
| `createArtifactFiles` | Get upload URLs for artifact files | P1 |
| `updateArtifactManifest` | Finalize manifest digest and fetch upload URL | P1 |
| `completeMultipartUploadArtifact` | Complete multipart artifact uploads | P1 |
| `commitArtifact` | Finalize artifact upload | P1 |
| `useArtifact` | Record artifact consumption (lineage) | P1 |
| `updateArtifact` | Update artifact metadata | P1 |
| `createArtifactType` | Ensure artifact type exists | P1 |
| `linkArtifact` | Link artifact to registry | P1 |
| `unlinkArtifact` | Remove from registry | P1 |
| `addAliases` / `deleteAliases` | Version tagging | P1 |
| `addArtifactCollectionTags` / `deleteArtifactCollectionTags` | Collection tagging | P1 |
| `notifyScriptableRunAlert` | Run alerts | P2 |
| `createProject` | Create projects | P2 |
| `createTeam` | Create teams | P2 |
| `createInvite` / `deleteInvite` | Team membership | P2 |
| `createServiceAccount` | Non-human credentials | P2 |
| `generateApiKey` / `deleteApiKey` | API key management | P2 |
| `createUserFromAdmin` | Admin bootstrap | P2 |
| `upsertRegistry` / `deleteRegistry` | Registry CRUD | P1 |
| `createRegistryMembers` / `deleteRegistryMembers` | Registry access | P2 |

**Required Queries (minimum viable):**

| Query | Purpose | Priority |
|---|---|---|
| `viewer` | Current user identity | P0 |
| `serverInfo` | Server version | P0 |
| `serverFeaturesQuery` | Feature flags used for gated compatibility paths | P1 |
| `runResumeStatus` | Resume crashed runs | P1 |
| `runStoppedStatus` | Poll stop requests from UI | P1 |
| `historyPage` | Read run metrics | P1 |
| `sampledHistoryPage` | Downsampled history queries | P1 |
| `model` / `project` | Get project details | P1 |
| `models` | List projects | P1 |
| `clientIDMapping` | Resolve client IDs during artifact save | P1 |
| `artifactByID` / `artifactByName` | Fetch artifact | P1 |
| `artifactMembershipByName` | Fetch linked registry membership | P1 |
| `fetchArtifactManifest` | Get artifact manifest | P1 |
| `getArtifactFiles` / `getArtifactFileUrls` | List/download artifact files | P1 |
| `artifactFileURLsByManifestEntries` | Download by manifest subset | P1 |
| `runInputArtifacts` / `runOutputArtifacts` | Lineage | P1 |
| `projectArtifactCollections` / `projectArtifactCollection` | Browse artifact collections | P1 |
| `projectArtifactTypes` / `projectArtifactType` | Browse artifact types | P1 |
| `artifactCollectionAliases` / `artifactCreatedBy` / `artifactUsedBy` | Alias and lineage metadata | P1 |
| `fetchRegistries` / `fetchRegistry` | Browse registries | P1 |
| `registryCollections` / `registryVersions` | Registry contents | P1 |
| `fetchLinkedArtifacts` | Registry links for artifact versions | P1 |
| `fetchOrgEntityFromEntity` / `fetchOrgEntityFromOrganization` / `fetchOrgInfoFromEntity` | Org resolution | P2 |
| `getDefaultEntity` / `getTeamEntity` / `searchUsers` | User/team admin flows | P2 |
| `runInfo` / `runState` | Run detail screens | P2 |
| `runParquetHistory` | Parquet export | P3 |

**GraphQL Schema Notes:**
- The wandb API uses "model" and "bucket" as legacy names for "project" and "run"
- `JSONString` is a scalar that holds JSON-encoded strings
- `Int64` is used for step numbers (can exceed 32-bit int range)
- `Duration` is a string like "1h30m"
- Pagination uses Relay-style cursor connections (`edges` / `node` / `pageInfo`)
- The SDK often fetches `viewer` and `serverInfo` in a single GraphQL request during `wandb.init()`
- Final run completion is primarily signaled by `file_stream`, not by a dedicated GraphQL finish mutation

#### Database Schema (MySQL)

```sql
-- Core tables
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    password_hash VARCHAR(255),  -- for local auth
    account_type ENUM('user', 'service', 'admin-created') DEFAULT 'user',
    admin BOOLEAN DEFAULT FALSE,
    default_entity_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE entities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    type ENUM('user', 'team', 'org') NOT NULL,
    organization_id VARCHAR(36) NULL,
    photo_url VARCHAR(2048),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    org_entity_id VARCHAR(36) REFERENCES entities(id),
    coreweave_organization_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_organizations (
    user_id VARCHAR(36) REFERENCES users(id),
    organization_id VARCHAR(36) REFERENCES organizations(id),
    PRIMARY KEY (user_id, organization_id)
);

CREATE TABLE teams (
    id VARCHAR(36) PRIMARY KEY,
    entity_id VARCHAR(36) REFERENCES entities(id),
    name VARCHAR(255) NOT NULL,
    default_access VARCHAR(64),
    read_only BOOLEAN DEFAULT FALSE,
    code_saving_enabled BOOLEAN DEFAULT TRUE,
    is_paid BOOLEAN DEFAULT FALSE
);

CREATE TABLE team_members (
    team_id VARCHAR(36) REFERENCES teams(id),
    user_id VARCHAR(36) REFERENCES users(id),
    role ENUM('admin', 'member', 'viewer') DEFAULT 'member',
    pending BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE invites (
    id VARCHAR(36) PRIMARY KEY,
    entity_id VARCHAR(36) REFERENCES entities(id),
    email VARCHAR(255),
    username VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    name VARCHAR(255),
    key_hash VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiment tracking
CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_id VARCHAR(36) REFERENCES entities(id),
    description TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entity_id, name)
);

CREATE TABLE runs (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,          -- short ID like "abc123de"
    display_name VARCHAR(255),
    project_id VARCHAR(36) REFERENCES projects(id),
    user_id VARCHAR(36) REFERENCES users(id),
    state ENUM('running', 'finished', 'crashed', 'failed') DEFAULT 'running',
    config JSON,                          -- hyperparameters
    summary_metrics JSON,                 -- final metric values
    wandb_config JSON,                    -- internal wandb config queried on resume
    run_info JSON,                        -- program / env details returned by runInfo
    description TEXT,
    notes TEXT,
    tags JSON,                            -- array of strings
    group_name VARCHAR(255),
    job_type VARCHAR(255),
    host VARCHAR(255),
    program VARCHAR(1024),
    git_commit VARCHAR(40),
    git_repo VARCHAR(1024),
    sweep_name VARCHAR(255),
    history_line_count INT DEFAULT 0,
    log_line_count INT DEFAULT 0,
    events_line_count INT DEFAULT 0,
    stopped BOOLEAN DEFAULT FALSE,        -- queried by RunStoppedStatus
    exit_code INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    heartbeat_at TIMESTAMP,               -- last file_stream heartbeat
    UNIQUE (project_id, name)
);

CREATE TABLE run_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(36) REFERENCES runs(id),
    step BIGINT NOT NULL,
    data JSON NOT NULL,                   -- {"loss": 0.5, "acc": 0.8, ...}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_run_step (run_id, step)
);

CREATE TABLE run_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(36) REFERENCES runs(id),
    data JSON NOT NULL,                   -- system metrics
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_run_events (run_id)
);

CREATE TABLE run_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(36) REFERENCES runs(id),
    line_num INT NOT NULL,
    content TEXT NOT NULL,
    stream ENUM('stdout', 'stderr') DEFAULT 'stdout',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_run_logs (run_id, line_num)
);

CREATE TABLE run_files (
    id VARCHAR(36) PRIMARY KEY,
    run_id VARCHAR(36) REFERENCES runs(id),
    name VARCHAR(1024) NOT NULL,
    storage_path VARCHAR(2048),           -- path in object storage
    size BIGINT,
    md5 VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (run_id, name)
);

-- Artifacts
CREATE TABLE artifact_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,           -- "model", "dataset", etc.
    project_id VARCHAR(36) REFERENCES projects(id),
    UNIQUE (project_id, name)
);

CREATE TABLE artifact_collections (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('sequence', 'portfolio') DEFAULT 'sequence',
    artifact_type_id VARCHAR(36) REFERENCES artifact_types(id),
    project_id VARCHAR(36) REFERENCES projects(id),
    state ENUM('active', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (project_id, name)
);

CREATE TABLE artifacts (
    id VARCHAR(36) PRIMARY KEY,
    collection_id VARCHAR(36) REFERENCES artifact_collections(id),
    digest VARCHAR(255) NOT NULL,
    state ENUM('PENDING', 'COMMITTED', 'DELETED') DEFAULT 'PENDING',
    description TEXT,
    metadata JSON,
    version_index INT,                    -- v0, v1, v2, ...
    size BIGINT,
    file_count INT,
    commit_hash VARCHAR(255),
    ttl_duration_seconds BIGINT,
    ttl_is_inherited BOOLEAN DEFAULT FALSE,
    history_step BIGINT,
    created_by_run_id VARCHAR(36) REFERENCES runs(id),
    client_id VARCHAR(36),
    sequence_client_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    committed_at TIMESTAMP NULL
);

CREATE TABLE artifact_aliases (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    collection_id VARCHAR(36) REFERENCES artifact_collections(id),
    alias VARCHAR(255) NOT NULL,          -- "latest", "v0", "production"
    UNIQUE (collection_id, alias)
);

CREATE TABLE artifact_manifests (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    type ENUM('FULL', 'INCREMENTAL', 'PATCH') DEFAULT 'FULL',
    digest VARCHAR(255) NOT NULL,
    file_id VARCHAR(36) REFERENCES artifact_files_stored(id),
    base_artifact_id VARCHAR(36) REFERENCES artifacts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artifact_manifest_entries (
    id VARCHAR(36) PRIMARY KEY,
    manifest_id VARCHAR(36) REFERENCES artifact_manifests(id),
    path VARCHAR(2048) NOT NULL,          -- logical path within artifact
    digest VARCHAR(255) NOT NULL,         -- content hash
    ref VARCHAR(2048),                    -- external reference URL
    size BIGINT,
    mimetype VARCHAR(255),
    birth_artifact_id VARCHAR(36),
    extra JSON,                           -- additional metadata
    INDEX idx_manifest_entries (manifest_id)
);

CREATE TABLE tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE artifact_collection_tags (
    collection_id VARCHAR(36) REFERENCES artifact_collections(id),
    tag_id VARCHAR(36) REFERENCES tags(id),
    PRIMARY KEY (collection_id, tag_id)
);

CREATE TABLE artifact_files_stored (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    name VARCHAR(2048) NOT NULL,
    storage_path VARCHAR(2048) NOT NULL,  -- path in object storage
    md5 VARCHAR(32),
    size BIGINT,
    upload_url VARCHAR(4096),             -- pre-signed URL (temporary)
    upload_headers JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artifact_usage (
    id VARCHAR(36) PRIMARY KEY,
    run_id VARCHAR(36) REFERENCES runs(id),
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    type ENUM('input', 'output') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (run_id, artifact_id, type)
);

-- Model Registry
CREATE TABLE registries (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_id VARCHAR(36) REFERENCES entities(id),
    organization_id VARCHAR(36),
    description TEXT,
    visibility ENUM('public', 'private', 'team') DEFAULT 'private',
    allow_all_artifact_types BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entity_id, name)
);

CREATE TABLE registry_allowed_types (
    registry_id VARCHAR(36) REFERENCES registries(id),
    artifact_type VARCHAR(255),
    PRIMARY KEY (registry_id, artifact_type)
);

CREATE TABLE registry_members (
    registry_id VARCHAR(36) REFERENCES registries(id),
    user_id VARCHAR(36) REFERENCES users(id),
    role ENUM('admin', 'member', 'viewer') DEFAULT 'viewer',
    PRIMARY KEY (registry_id, user_id)
);

CREATE TABLE registry_team_members (
    registry_id VARCHAR(36) REFERENCES registries(id),
    team_id VARCHAR(36) REFERENCES teams(id),
    role ENUM('admin', 'member', 'viewer') DEFAULT 'viewer',
    PRIMARY KEY (registry_id, team_id)
);

-- Linked artifacts in registry (portfolio = registry collection)
CREATE TABLE registry_linked_artifacts (
    id VARCHAR(36) PRIMARY KEY,
    registry_id VARCHAR(36) REFERENCES registries(id),
    collection_name VARCHAR(255) NOT NULL, -- portfolio name in registry
    artifact_id VARCHAR(36) REFERENCES artifacts(id),
    version_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

**Additional compatibility state required by the actual SDK:**

```sql
ALTER TABLE projects
    ADD COLUMN repo VARCHAR(1024) NULL,
    ADD COLUMN docker_image VARCHAR(1024) NULL,
    ADD COLUMN access VARCHAR(64) NULL,
    ADD COLUMN views JSON NULL;

ALTER TABLE run_files
    ADD COLUMN direct_url VARCHAR(4096) NULL,
    ADD COLUMN updated_at_remote TIMESTAMP NULL;

ALTER TABLE artifact_files_stored
    ADD COLUMN direct_url VARCHAR(4096) NULL,
    ADD COLUMN display_name VARCHAR(2048) NULL,
    ADD COLUMN birth_artifact_id VARCHAR(36) NULL;
```

---

### 2. File Stream Service

Handles real-time metrics streaming from running experiments.

**Endpoint:** `POST /files/{entity}/{project}/{run}/file_stream`

**Request body (JSON):**
```json
{
  "files": {
    "wandb-history.jsonl": {
      "offset": 0,
      "content": [
        "{\"loss\": 0.5, \"_step\": 0}\n",
        "{\"loss\": 0.4, \"_step\": 1}\n"
      ]
    },
    "wandb-summary.json": {
      "offset": 0,
      "content": [
        "{\"loss\": 0.1, \"best_acc\": 0.95}"
      ]
    },
    "wandb-events.jsonl": {
      "offset": 0,
      "content": [
        "{\"cpu\": 45.2, \"gpu.0.gpu\": 98.1}\n"
      ]
    },
    "output.log": [
      {
        "offset": 0,
        "content": [
          "2026-04-12T18:00:00.000000 Epoch 1/10\n"
        ]
      },
      {
        "offset": 4,
        "content": [
          "2026-04-12T18:00:01.000000 loss: 0.5\n"
        ]
      }
    ]
  },
  "dropped": 0
}
```

**Implementation notes:**
- Each file is sent as `{offset, content[]}`; `output.log` may be a list of such objects
- Offsets are logical line offsets for resume, not byte offsets
- `wandb-history.jsonl`: Append to run_history table, one JSON object per line = one step
- `wandb-summary.json`: Replace-mode. Overwrite run.summary_metrics. Only latest value kept.
- `wandb-events.jsonl`: Append to run_events table (system metrics)
- `output.log`: Append to run_logs table (console output). Preserve SDK timestamps / prefixes.
- Heartbeat: `{"complete": false, "failed": false, "dropped": 0, "uploaded": []}` - update run.heartbeat_at
- Preemption notice: `{"complete": false, "preempting": true, ...}`
- Completion: `{"complete": true, "exitcode": 0}` - set run.state from exit code
- Response may include `{"limits": {...}}` to dynamically adjust SDK send rate
- Retry semantics are broader than the initial draft: the SDK retries most transient
  failures, but not HTTP `400`, `403`, `404`, or `409`
- Must handle high throughput: a single GPU training run can log thousands of metrics/second

**Response:**
```json
{
  "limits": {
    "rate_limit_seconds": 15
  }
}
```

---

### 3. Object Storage Service

Artifact and run files are stored in S3-compatible object storage.

**Implementation options:**
- MinIO (self-hosted, S3-compatible)
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

**Pre-signed URL generation:**
The GraphQL service generates URLs when `createRunFiles`, `createArtifactFiles`,
and `createArtifactManifest` / `updateArtifactManifest` are called. These URLs are
usually absolute pre-signed object-store URLs, but the SDK also supports relative
URLs and prefixes them with `base_url` for proxied uploads.

**Storage layout:**
```
bucket/
  artifacts/
    {artifact_id}/
      {file_name}
  runs/
    {entity}/{project}/{run_id}/
      wandb-history.jsonl    (also stored in DB)
      wandb-summary.json     (also stored in DB)
      wandb-events.jsonl     (also stored in DB)
      output.log             (also stored in DB)
      {user_files}           (model checkpoints, etc.)
```

**Artifact save flow (actual SDK order):**
1. SDK calls `createArtifact`
2. SDK calls `createArtifactManifest(..., includeUpload=false)` to reserve the manifest record
3. SDK batches `createArtifactFiles` requests for artifact contents
4. Server may respond with either a single `uploadUrl` or multipart URLs plus `uploadID`
5. SDK uploads file parts directly
6. SDK calls `CompleteMultipartUploadArtifact` when multipart upload was used
7. SDK writes the final manifest JSON locally
8. SDK calls `updateArtifactManifest` for incremental / patch manifests, or
   re-calls `createArtifactManifest` for the finalized manifest upload URL
9. SDK uploads the manifest file itself
10. SDK calls `commitArtifact`
11. SDK may call `useArtifact` after commit for lineage

**Artifact download flow:**
- The SDK also expects authenticated download handlers under `/artifacts/...`
  and `/artifactsV2/...` in addition to direct signed URLs.

---

### 4. Authentication & SSO Service

**API Key Authentication (P0):**
- SDK sends `Authorization: Basic base64("api:{api_key}")`
- Server validates against `api_keys` table (compare key hash)
- Returns user identity for all subsequent requests
- JWT-shaped secrets are also accepted through this Basic auth path by the SDK

**OIDC / identity token exchange (P2):**
- The SDK does **not** perform browser PKCE / implicit login flows itself
- Instead, it reads `WANDB_IDENTITY_TOKEN_FILE`, then POSTs:
  - `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`
  - `assertion=<identity JWT>`
  to `POST /oidc/token`
- The server returns JSON with `access_token`, `token_type`, and `expires_in`
- The SDK caches the access token locally and then uses `Authorization: Bearer ...`
- `WANDB_API_KEY` and `WANDB_IDENTITY_TOKEN_FILE` are mutually exclusive in the SDK
- If you also build a web UI, browser OIDC flows can exist there separately, but they
  are not part of the Python SDK compatibility contract

**Headers the SDK sends:**
- `Authorization: Basic ...` or `Authorization: Bearer ...`
- `X-WANDB-USERNAME` - username
- `X-WANDB-USER-EMAIL` - email
- `User-Agent` - SDK version identifier

---

### 5. Redis (Cache & Queue)

**Purpose:**
- Rate limiting for file_stream endpoint
- Caching frequently-accessed queries (viewer, server features)
- Job queue for background tasks (artifact GC, webhook dispatch)
- Session store for web UI authentication

**Configuration:** Single Redis 7.x instance. No cluster required for small deployments.

---

## Frontend Specification

### Technology Stack
- Svelte 5 SPA (TypeScript)
- Served from the same domain as the API
- Communicates with backend via the same GraphQL endpoint + REST APIs

### Core Pages

#### 1. Login / Auth
- API key entry form
- SSO/OIDC redirect flow
- Password-based login (optional)

#### 2. Dashboard (Home)
- List of recent runs across all projects
- Quick stats (active runs, total experiments)

#### 3. Project List (`/{entity}`)
- Grid/list of projects with run counts
- Create new project

#### 4. Project View (`/{entity}/{project}`)
- **Workspace tab**: Interactive charts of run metrics
  - Line charts (loss, accuracy over steps)
  - Scatter plots (hyperparameter vs. metric)
  - Filter/group/sort runs
  - Column customization
- **Runs table**: Sortable, filterable table of all runs
  - Columns: name, state, created, duration, metrics, config values, tags
  - Bulk actions (delete, tag, group)
- **Artifacts tab**: Browse artifact types and collections

#### 5. Run View (`/{entity}/{project}/runs/{run_id}`)
- **Overview**: Config, summary, git info, system info
- **Charts**: Per-run metric charts (auto-generated from logged keys)
- **System**: GPU/CPU/memory utilization over time
- **Logs**: Console output viewer
- **Files**: Browse uploaded files, download links
- **Artifacts**: Input/output artifacts (lineage)

#### 6. Artifact View (`/{entity}/{project}/artifacts/{type}/{name}/{version}`)
- Metadata display
- File browser with preview (images, text, JSON)
- Lineage graph (which run created it, which runs consumed it)
- Version history with aliases
- Link to registry action

#### 7. Model Registry (`/{entity}/registry/{registry_name}`)
- **Collections**: List of model collections
- **Collection detail**: Version list with aliases ("production", "staging", "latest")
- **Version detail**: Linked artifact metadata, files, lineage
- **Members**: User/team access management with role assignment

#### 8. Team / Org Settings (`/{entity}/settings`)
- Member management (invite, remove, change role)
- Service account management
- API key management
- SSO configuration (admin only)

#### 9. User Settings (`/settings`)
- Profile (name, email)
- API keys
- Default entity selection

### Key UI Components

| Component | Description |
|---|---|
| **Metric Chart** | Plotly/Vega line chart. X-axis = step or wall time. Multiple runs overlaid. |
| **Runs Table** | AG Grid or similar. Dynamic columns from config + summary keys. |
| **Artifact Graph** | DAG visualization showing run -> artifact -> run lineage |
| **File Browser** | Tree view of artifact contents. Preview for images, JSON, text. |
| **Log Viewer** | Virtual-scrolling text viewer for console output |
| **Config Diff** | Side-by-side comparison of configs across runs |

### Real-time Updates
- WebSocket or SSE connection for live run updates
- File stream data reflected in charts within seconds
- Run state changes (running -> finished) update UI automatically

---

## Deployment Specification

### Minimum Production Setup

```yaml
# docker-compose.yml (simplified)
version: '3.8'
services:
  api:
    image: wandb-clone/api:latest
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: mysql://wandb:password@mysql:3306/wandb
      REDIS_URL: redis://redis:6379
      OBJECT_STORAGE_ENDPOINT: http://minio:9000
      OBJECT_STORAGE_ACCESS_KEY: minioadmin
      OBJECT_STORAGE_SECRET_KEY: minioadmin
      OBJECT_STORAGE_BUCKET: wandb
      SECRET_KEY: <random-secret-for-jwt-signing>
      # SSO (optional)
      OIDC_ISSUER: https://your-idp.example.com
      OIDC_CLIENT_ID: your-client-id

  frontend:
    image: wandb-clone/frontend:latest
    ports:
      - "80:80"
    environment:
      API_URL: http://api:8080

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: wandb
      MYSQL_USER: wandb
      MYSQL_PASSWORD: password
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data

volumes:
  mysql_data:
  redis_data:
  minio_data:
```

### SDK Configuration

Point the wandb SDK at your self-hosted instance:

```bash
# Option 1: Environment variable
export WANDB_BASE_URL=https://your-server.example.com
export WANDB_API_KEY=your-api-key

# Option 2: wandb login
wandb login --host https://your-server.example.com

# Option 3: In code
import wandb
wandb.login(host="https://your-server.example.com", key="your-api-key")
```

The SDK constructs these URLs from `WANDB_BASE_URL`:
- GraphQL: `{base_url}/graphql`
- OIDC token exchange: `{base_url}/oidc/token`
- File stream: `{base_url}/files/{entity}/{project}/{run}/file_stream`
- Artifact downloads: `{base_url}/artifacts/...` and `{base_url}/artifactsV2/...`
- Web UI links: `{base_url}/{entity}/{project}/runs/{run_id}`

---

## Implementation Recommendations

### Tech Stack Options

| Component | Recommended | Alternative |
|---|---|---|
| API Language | **Go** (match wandb-core) | Python (FastAPI), Rust |
| GraphQL Framework | gqlgen (Go) | Strawberry (Python), async-graphql (Rust) |
| Database | MySQL 8.0 | PostgreSQL 16 (change schema slightly) |
| Object Storage | MinIO | S3, GCS |
| Frontend | Svelte 5 + TypeScript | SvelteKit |
| Charting | Plotly.js or Vega-Lite | ECharts, LayerCake |
| Auth | OIDC via go-oidc | Keycloak as external IdP |
| Deployment | Docker Compose (dev), K8s (prod) | |

### Key Implementation Gotchas

1. **"model" = "project"**: The GraphQL schema uses `model` and `models` as query names for what users see as "projects". The `modelName` field in UpsertBucket input = project name.

2. **"bucket" = "run"**: Similarly, `bucket` in the GraphQL response = a run.

3. **JSONString scalar**: Many fields (config, summaryMetrics) are JSON-encoded strings, not raw JSON objects. The server must accept and return them as strings.

4. **File stream payload shape matters**: The SDK sends `{offset, content[]}` objects, not `[offset, data]` tuples. `output.log` may be a list of chunk objects.

5. **Relative upload URLs exist**: The SDK prefers direct object-store uploads, but it also accepts relative upload URLs and prefixes them with `base_url`.

6. **Heartbeat monitoring**: If no file_stream POST arrives for >5 minutes, the run should be marked as "crashed". The SDK sends heartbeats every ~30 seconds.

7. **Feature flags matter**: The SDK checks `ServerFeaturesQuery` for artifact / download behavior. `wandb.init()` itself mainly relies on `viewer` + `serverInfo`.

8. **Relay pagination**: All list queries use Relay-style cursor pagination (`first`, `after`, `edges`, `node`, `pageInfo`). Use base64-encoded cursors.

9. **Client ID deduplication**: Artifacts use `clientID` and `sequenceClientID` for idempotent creation, and later resolve them via `clientIDMapping`.

10. **Manifest upload is a separate step**: `commitArtifact` is not enough. The final manifest file upload happens immediately before commit via `createArtifactManifest` or `updateArtifactManifest`.

11. **Wandb-core (Go process)**: The SDK bundles a Go binary that handles actual network I/O. Your server doesn't need to implement the protobuf layer, but you do need GraphQL + file_stream + OIDC token exchange + artifact download handlers + upload URL generation.
