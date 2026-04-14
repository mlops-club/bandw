# Custom Spec: bandw Extensions

Features and behaviors that diverge from or extend the upstream W&B protocol.
`system-spec.md` reflects what the wandb SDK expects; this file describes what **bandw adds on its own**.

---

## Database Backends

bandw supports two database backends: **SQLite** (default) and **MySQL**. The backend is selected at startup via environment variables and CLI arguments following [12-factor](https://12factor.net/config) principles.

### Backend Selection

| Priority | Source | Flag / Variable | Example |
|----------|--------|-----------------|---------|
| 1 (highest) | CLI argument | `--database-url` | `--database-url mysql://user:pass@host:3306/bandw` |
| 2 | Environment variable | `DATABASE_URL` | `DATABASE_URL=mysql://user:pass@host:3306/bandw` |
| 3 (default) | Built-in default | — | SQLite at `./bandw.sqlite` |

CLI arguments take precedence over environment variables. If neither is set, the server defaults to SQLite.

### SQLite (default)

SQLite is the default backend. No external dependencies are required — the server creates the database file on first startup.

**Default path:** `./bandw.sqlite` (relative to the working directory when the server is launched).

**Configuring the path:**

| Priority | Source | Flag / Variable | Example |
|----------|--------|-----------------|---------|
| 1 (highest) | CLI argument | `--sqlite-path` | `--sqlite-path /var/lib/bandw/data.sqlite` |
| 2 | Environment variable | `BANDW_SQLITE_PATH` | `BANDW_SQLITE_PATH=/var/lib/bandw/data.sqlite` |
| 3 (default) | Built-in default | — | `./bandw.sqlite` |

If the file does not exist, the server creates it (including any necessary parent directories). If it already exists, the server opens it and runs migrations.

**When to use SQLite:**
- Local development
- Single-user or small-team deployments
- Quick evaluation / demos
- CI / integration tests (in-memory mode via `DATABASE_URL=sqlite://:memory:`)

### MySQL

MySQL is the production-grade backend for multi-user and high-throughput deployments.

**Selection:** Set `DATABASE_URL` to a MySQL DSN. The server detects the backend from the URL scheme.

```bash
# Environment variable
DATABASE_URL=mysql://wandb:password@localhost:3306/bandw

# CLI argument (takes precedence)
--database-url mysql://wandb:password@localhost:3306/bandw
```

**When to use MySQL:**
- Multi-user production deployments
- High write throughput (many concurrent runs)
- When you need replication, backups, or operational tooling that MySQL provides

### Backend Detection Logic

The server determines which backend to use at startup:

1. If `--database-url` CLI arg or `DATABASE_URL` env var is set and starts with `mysql://` → use MySQL.
2. If it is set and starts with `sqlite://` → use SQLite at the specified path (e.g. `sqlite:///var/lib/bandw/data.sqlite` or `sqlite://:memory:`).
3. If it is not set → use SQLite at the path from `--sqlite-path` / `BANDW_SQLITE_PATH` / default `./bandw.sqlite`.

### GORM Abstraction

Both backends use the same GORM models and migrations. The ORM abstracts dialect differences. Production uses `gorm.io/driver/mysql`; SQLite uses `gorm.io/driver/sqlite`. Tests use in-memory SQLite (`sqlite://:memory:`) for speed and isolation.

### Summary of Environment Variables and CLI Arguments

| Variable | CLI Flag | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | `--database-url` | _(unset → SQLite)_ | Full database DSN. Scheme determines backend (`mysql://` or `sqlite://`). |
| `BANDW_SQLITE_PATH` | `--sqlite-path` | `./bandw.sqlite` | Path to the SQLite database file. Only used when `DATABASE_URL` is unset. |
| `PORT` | `--port` | `8080` | HTTP listen port. |
