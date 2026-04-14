package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestResolveDB_DefaultSQLite(t *testing.T) {
	c := Config{SQLitePath: "./bandw.sqlite"}
	dialect, dsn := c.ResolveDB()
	assert.Equal(t, "sqlite", dialect)
	assert.Equal(t, "./bandw.sqlite", dsn)
}

func TestResolveDB_MySQLURL(t *testing.T) {
	c := Config{DatabaseURL: "mysql://wandb:password@localhost:3306/bandw"}
	dialect, dsn := c.ResolveDB()
	assert.Equal(t, "mysql", dialect)
	assert.Equal(t, "wandb:password@tcp(localhost:3306)/bandw?parseTime=true", dsn)
}

func TestResolveDB_SQLiteMemoryURL(t *testing.T) {
	c := Config{DatabaseURL: "sqlite://:memory:"}
	dialect, dsn := c.ResolveDB()
	assert.Equal(t, "sqlite", dialect)
	assert.Equal(t, ":memory:", dsn)
}

func TestResolveDB_SQLiteFileURL(t *testing.T) {
	c := Config{DatabaseURL: "sqlite:///tmp/test.db"}
	dialect, dsn := c.ResolveDB()
	assert.Equal(t, "sqlite", dialect)
	assert.Equal(t, "/tmp/test.db", dsn)
}

func TestResolveDB_SQLitePathEnvOverride(t *testing.T) {
	c := Config{SQLitePath: "/var/lib/bandw/data.sqlite"}
	dialect, dsn := c.ResolveDB()
	assert.Equal(t, "sqlite", dialect)
	assert.Equal(t, "/var/lib/bandw/data.sqlite", dsn)
}

func TestResolveDB_DatabaseURLTakesPrecedenceOverSQLitePath(t *testing.T) {
	c := Config{
		DatabaseURL: "mysql://user:pass@host:3306/db",
		SQLitePath:  "/ignored/path.sqlite",
	}
	dialect, _ := c.ResolveDB()
	assert.Equal(t, "mysql", dialect)
}

func TestParseFlags_OverridesEnvValues(t *testing.T) {
	cfg := Config{Port: "8080", SQLitePath: "./bandw.sqlite"}
	ParseFlags(&cfg, []string{"--port", "9090", "--database-url", "mysql://x:y@h:3306/d", "--sqlite-path", "/tmp/other.db"})
	assert.Equal(t, "9090", cfg.Port)
	assert.Equal(t, "mysql://x:y@h:3306/d", cfg.DatabaseURL)
	assert.Equal(t, "/tmp/other.db", cfg.SQLitePath)
}

func TestParseFlags_EmptyDoesNotOverride(t *testing.T) {
	cfg := Config{Port: "8080", SQLitePath: "./bandw.sqlite"}
	ParseFlags(&cfg, []string{})
	assert.Equal(t, "8080", cfg.Port)
	assert.Equal(t, "./bandw.sqlite", cfg.SQLitePath)
}
