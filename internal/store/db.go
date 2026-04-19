package store

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewMySQLDB opens a GORM connection to MySQL.
func NewMySQLDB(dsn string) (*gorm.DB, error) {
	return gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
}

// NewSQLiteDB opens an in-memory SQLite database for testing.
// MaxOpenConns(1) ensures all queries use the same connection, which is
// required for in-memory SQLite (each connection gets its own DB otherwise).
func NewSQLiteDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err
	}
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(1)
	return db, nil
}

// NewSQLiteDBFromPath opens a SQLite database at the given file path.
// Use ":memory:" for an in-memory database.
func NewSQLiteDBFromPath(path string) (*gorm.DB, error) {
	logLevel := logger.Warn
	if path == ":memory:" {
		logLevel = logger.Silent
	}
	return gorm.Open(sqlite.Open(path), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
}

// NewDBFromConfig creates a GORM database connection based on dialect and DSN.
// dialect must be "mysql" or "sqlite".
func NewDBFromConfig(dialect, dsn string) (*gorm.DB, error) {
	switch dialect {
	case "mysql":
		return NewMySQLDB(dsn)
	case "sqlite":
		return NewSQLiteDBFromPath(dsn)
	default:
		return nil, fmt.Errorf("unsupported database dialect: %s", dialect)
	}
}

// AutoMigrate runs all GORM model migrations.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{}, &Entity{}, &APIKey{},
		&Project{}, &Run{},
		&RunHistory{}, &RunEvent{}, &RunLog{},
		// Artifact tables
		&ArtifactType{}, &ArtifactCollection{}, &Artifact{},
		&ArtifactAlias{}, &ArtifactManifest{}, &ArtifactManifestEntry{},
		&ArtifactFileStored{}, &ArtifactUsage{},
		&Tag{}, &ArtifactCollectionTag{},
	)
}
