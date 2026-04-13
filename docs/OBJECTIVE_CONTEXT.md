# OBJECTIVE_CONTEXT: Grounded Facts from Research

## F1: W&B Server is Closed Source
- The official W&B server (`api.wandb.ai`) is **proprietary**. No open-source reference server exists.
- The only open-source code is the Python SDK + bundled `wandb-core` Go binary in `wandb/wandb`.
- We are reverse-engineering the server contract from the SDK's client code.

## F2: wandb-core Go Binary is the Real Network Client
- The Python SDK does NOT make HTTP calls directly (except legacy paths).
- `wandb-core` is a Go sidecar process the Python SDK connects to via Unix socket + protobuf.
- `wandb-core` directly issues GraphQL POST to `/graphql` and file_stream POST to `/files/.../file_stream`.
- It handles retries, heartbeats, batching, and backpressure internally.
- Source: `core/internal/stream/stream_init.go`

## F3: Exact Network Call Sequence for init/log/finish

| Step | Call | Protocol | Endpoint |
|------|------|----------|----------|
| init | Viewer query | GraphQL POST | `/graphql` |
| init | ServerFeaturesQuery (lazy) | GraphQL POST | `/graphql` |
| init | UpsertBucket mutation | GraphQL POST | `/graphql` |
| init | Start file_stream | HTTP POST | `/files/{entity}/{project}/{runId}/file_stream` |
| log | History update via file_stream | HTTP POST | same file_stream URL |
| log (30s) | Heartbeat | HTTP POST | same file_stream URL |
| finish | UpsertBucket (update summary) | GraphQL POST | `/graphql` |
| finish | Final file_stream `complete:true` | HTTP POST | same file_stream URL |

## F4: Minimum Viewer Response
```graphql
query Viewer {
    viewer {
        id          # present but not nil-checked
        entity      # REQUIRED - nil triggers "Invalid credentials" error
        flags       # can be null/empty
        teams {     # can be null/empty
            edges { node { name } }
        }
    }
}
```
Source: `core/pkg/server/connection.go` - `handleAuthenticateImpl` checks `data.GetViewer().GetEntity() == nil`.

## F5: Minimum ServerInfo Response
```graphql
query ServerInfo {
    serverInfo {
        cliVersionInfo                    # optional, used for version warnings
        latestLocalVersionInfo {          # optional
            outOfDate
            latestVersionString
            versionOnThisInstanceString
        }
    }
}
```
All fields are optional (`omitempty`). Returning `{"serverInfo": {}}` is sufficient.

## F6: ServerFeaturesQuery
```graphql
query ServerFeaturesQuery {
    serverInfo {
        features {
            name
            isEnabled
        }
    }
}
```
Returns array of `{name, isEnabled}`. For MVP, return empty `features: []` - all flags default to false/disabled, which is safe. The SDK checks `EXPAND_DEFINED_METRIC_GLOBS` during init.

## F7: UpsertBucket Mutation

**Input variables** (all nullable):
- `$id: String` - storage ID (for updates)
- `$name: String` - run ID (e.g., "abc123de")
- `$project: String` - maps to `modelName` input field
- `$entity: String` - maps to `entityName`
- `$groupName, $description, $displayName, $notes: String`
- `$commit: String` - git commit hash
- `$config: JSONString` - hyperparameters as JSON-encoded string
- `$host: String` - hostname
- `$debug: Boolean`
- `$program: String` - maps to `jobProgram`
- `$repo: String` - maps to `jobRepo`
- `$jobType: String`
- `$state: String`
- `$sweep: String`
- `$tags: [String!]`
- `$summaryMetrics: JSONString`

**Required response fields** (checked by `lockedUpdateFromUpsert`):
```graphql
upsertBucket {
    bucket {
        id                    # → StorageID
        name                  # → RunID
        displayName
        sweepName
        historyLineCount      # used to set file_stream offsets
        project {
            id
            name
            entity { id; name }
        }
    }
    inserted                  # bool - true if new run created
}
```
Source: `core/internal/runupserter/runupserter.go`

## F8: File Stream Protocol

**Endpoint:** `POST /files/{entity}/{project}/{runId}/file_stream`

**Request body:**
```go
type FileStreamRequestJSON struct {
    Files      map[string]offsetAndContent `json:"files,omitempty"`
    Uploaded   []string                    `json:"uploaded,omitempty"`
    Preempting *bool                       `json:"preempting,omitempty"`
    Complete   *bool                       `json:"complete,omitempty"`
    ExitCode   *int32                      `json:"exitcode,omitempty"`
}
type offsetAndContent struct {
    Offset  int      `json:"offset"`
    Content []string `json:"content"`
}
```

**File keys:** `wandb-history.jsonl`, `wandb-events.jsonl`, `wandb-summary.json`, `output.log`

**Timing:**
- Transmit interval: 15 seconds
- Heartbeat period: 30 seconds
- Per-request timeout: 3 minutes
- Max request size: ~10 MB

**Response (checked by SDK):**
- `stopped` (bool): if true, user pressed Stop in UI
- `limits` (object): e.g., `{"rate_limit_seconds": 15}`

**Heartbeat** is just `{}` (empty JSON body).

**Completion** sends `{"complete": true, "exitcode": 0}`.

**Retry policy:** Up to ~10k retries over 7 days. Does NOT retry 400, 403, 404, 409.

## F9: GraphQL Schema Quirks
- `model` = project, `bucket` = run (legacy naming)
- `JSONString` is a scalar type = JSON-encoded string, not raw JSON object
- Relay-style cursor pagination (`edges/node/pageInfo`)
- `Int64` scalar for step numbers
- `Duration` scalar as string like "1h30m"

## F10: Authentication
- SDK sends `Authorization: Basic base64("api:{api_key}")` header on every request
- Or `Authorization: Bearer {access_token}` after OIDC exchange
- Also sends `X-WANDB-USERNAME`, `X-WANDB-USER-EMAIL`, `User-Agent` headers
