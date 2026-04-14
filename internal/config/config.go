package config

import (
	"flag"
	"os"
	"strings"
)

// Config holds all server configuration resolved from env vars and CLI flags.
type Config struct {
	Port        string // HTTP listen port
	DatabaseURL string // Full database DSN (mysql:// or sqlite://)
	SQLitePath  string // Path to SQLite file (used when DatabaseURL is unset)
}

// Load reads configuration from environment variables with defaults.
func Load() Config {
	c := Config{
		Port:       "8080",
		SQLitePath: "./bandw.sqlite",
	}
	if v := os.Getenv("PORT"); v != "" {
		c.Port = v
	}
	if v := os.Getenv("DATABASE_URL"); v != "" {
		c.DatabaseURL = v
	}
	if v := os.Getenv("BANDW_SQLITE_PATH"); v != "" {
		c.SQLitePath = v
	}
	return c
}

// ParseFlags parses CLI flags, overriding any values already set in cfg.
// Call this after Load() so CLI args take precedence over env vars.
func ParseFlags(cfg *Config, args []string) {
	fs := flag.NewFlagSet("bandw", flag.ContinueOnError)
	port := fs.String("port", "", "HTTP listen port")
	dbURL := fs.String("database-url", "", "Full database DSN (mysql:// or sqlite://)")
	sqlitePath := fs.String("sqlite-path", "", "Path to SQLite database file")

	_ = fs.Parse(args)

	if *port != "" {
		cfg.Port = *port
	}
	if *dbURL != "" {
		cfg.DatabaseURL = *dbURL
	}
	if *sqlitePath != "" {
		cfg.SQLitePath = *sqlitePath
	}
}

// ResolveDB determines the database dialect and DSN from the config.
// Returns ("mysql", dsn) or ("sqlite", path).
func (c Config) ResolveDB() (dialect string, dsn string) {
	if strings.HasPrefix(c.DatabaseURL, "mysql://") {
		// Convert mysql://user:pass@host:port/db to GORM-compatible DSN:
		// user:pass@tcp(host:port)/db?parseTime=true
		raw := strings.TrimPrefix(c.DatabaseURL, "mysql://")
		// Split user:pass@host:port/db
		atIdx := strings.LastIndex(raw, "@")
		if atIdx < 0 {
			// No credentials: host:port/db
			return "mysql", raw + "?parseTime=true"
		}
		userPass := raw[:atIdx]
		hostDB := raw[atIdx+1:]
		// Split host:port from /db
		slashIdx := strings.Index(hostDB, "/")
		if slashIdx < 0 {
			return "mysql", userPass + "@tcp(" + hostDB + ")/?parseTime=true"
		}
		hostPort := hostDB[:slashIdx]
		dbName := hostDB[slashIdx:]
		return "mysql", userPass + "@tcp(" + hostPort + ")" + dbName + "?parseTime=true"
	}

	if strings.HasPrefix(c.DatabaseURL, "sqlite://") {
		path := strings.TrimPrefix(c.DatabaseURL, "sqlite://")
		return "sqlite", path
	}

	// Default: SQLite at configured path
	return "sqlite", c.SQLitePath
}
