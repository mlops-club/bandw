# STRUCTURE OUTLINE: Go Backend + Minimal Frontend

## Architecture Decision: Single Go Binary

```
wandb-clone-server (single binary)
├── cmd/server/main.go              # entry point, wire everything
├── internal/
│   ├── server/                     # HTTP server setup, middleware
│   │   ├── server.go               # chi/mux router, CORS, auth middleware
│   │   └── auth.go                 # API key Basic auth extraction + validation
│   ├── graphql/                    # GraphQL handler
│   │   ├── schema.graphql          # SDL schema (gqlgen)
│   │   ├── resolver.go             # root resolver
│   │   ├── viewer.go               # Viewer query
│   │   ├── server_info.go          # ServerInfo + ServerFeatures queries
│   │   ├── run.go                  # UpsertBucket mutation + run queries
│   │   ├── scalars.go              # JSONString, Int64, Duration scalars
│   │   └── generated.go           # gqlgen output
│   ├── filestream/                 # file_stream REST handler
│   │   ├── handler.go              # POST /files/{entity}/{project}/{run}/file_stream
│   │   └── types.go                # request/response structs
│   ├── store/                      # data access layer (GORM)
│   │   ├── db.go                   # GORM connection (MySQL prod, SQLite test)
│   │   ├── models.go               # GORM model structs (User, Entity, Run, etc.)
│   │   ├── user.go                 # user/entity/api_key CRUD
│   │   ├── project.go              # project CRUD
│   │   └── run.go                  # run CRUD + history/events/logs
│   ├── testutil/                   # test harness
│   │   └── harness.go              # in-memory SQLite + httptest.Server
│   └── config/                     # server config (env vars)
│       └── config.go
├── frontend/                       # minimal Svelte 5 SPA (later)
│   └── ...
├── docker-compose.yml              # MySQL + MinIO + server
├── go.mod
└── go.sum
```

## HTTP Routes (Phase 1)

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| POST | `/graphql` | gqlgen | All GraphQL operations |
| POST | `/files/{entity}/{project}/{run}/file_stream` | filestream.Handler | Metrics streaming |
| GET | `/` | frontend SPA | Serve Svelte app (later) |

## Data Flow: wandb.init() → wandb.log() → wandb.finish()

```
SDK (wandb-core Go binary)                Our Server
─────────────────────────                  ──────────
POST /graphql {viewer}          ───►       Auth middleware: extract API key from Basic auth
                                           Resolve viewer from api_keys → users table
                                ◄───       {viewer: {id, entity, flags, teams}}

POST /graphql {serverInfo}      ───►       Return static/minimal serverInfo
                                ◄───       {serverInfo: {cliVersionInfo: null, ...}}

POST /graphql {serverFeatures}  ───►       Return empty features array
                                ◄───       {serverInfo: {features: []}}

POST /graphql {upsertBucket}    ───►       Create/update run in DB
                                           Auto-create project + entity if needed
                                ◄───       {upsertBucket: {bucket: {...}, inserted: true}}

POST /files/.../file_stream     ───►       Parse JSON body
  {files: {wandb-history.jsonl:            Insert into run_history table
    {offset: 0, content: [...]}}}          Insert into run_events table
                                           Insert into run_logs table
                                           Update summary_metrics on run
                                           Update heartbeat_at
                                ◄───       {limits: {}}

POST /files/.../file_stream     ───►       Set run.state from exit code
  {complete: true, exitcode: 0}            (0 = finished, non-0 = crashed)
                                ◄───       {}

POST /graphql {upsertBucket}    ───►       Update run.summary_metrics
  {summaryMetrics: "..."}       ◄───       {upsertBucket: {bucket: {...}}}
```

## Key Design Decisions

1. **Single binary** - GraphQL + file_stream + static frontend in one process
2. **MySQL** - as specified, via docker-compose for dev
3. **gqlgen** - for type-safe GraphQL
4. **chi router** - lightweight Go HTTP router
5. **GORM** - ORM for MySQL (prod) and SQLite (tests). Models defined once, dialect swapped at connection time.
6. **No Redis for MVP** - not needed until rate limiting or background jobs
7. **No MinIO for Tier 0** - file_stream data goes to DB, not object storage. MinIO added when we need file uploads (run files, artifacts)
8. **Auto-create entities/projects** - when UpsertBucket references a project that doesn't exist, create it automatically (matches W&B behavior)

## What We Are NOT Building in Phase 1
- Object storage / pre-signed URLs
- Artifact system
- OIDC / SSO
- Reports
- WebSocket/SSE real-time updates
- Redis
- Frontend (except static shell to prove the server serves it)
