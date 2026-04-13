package store

import (
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
func NewSQLiteDB() (*gorm.DB, error) {
	return gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
}

// AutoMigrate runs all GORM model migrations.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{}, &Entity{}, &APIKey{},
		&Project{}, &Run{},
		&RunHistory{}, &RunEvent{}, &RunLog{},
	)
}
