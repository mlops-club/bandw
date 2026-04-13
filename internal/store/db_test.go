package store_test

import (
	"testing"

	"github.com/mlops-club/bandw/internal/store"
)

func TestSQLiteDBConnects(t *testing.T) {
	db, err := store.NewSQLiteDB()
	if err != nil {
		t.Fatalf("NewSQLiteDB() failed: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("failed to get underlying sql.DB: %v", err)
	}
	if err := sqlDB.Ping(); err != nil {
		t.Fatalf("ping failed: %v", err)
	}
}

func TestAutoMigrate(t *testing.T) {
	db, err := store.NewSQLiteDB()
	if err != nil {
		t.Fatalf("NewSQLiteDB() failed: %v", err)
	}
	if err := store.AutoMigrate(db); err != nil {
		t.Fatalf("AutoMigrate() failed: %v", err)
	}
}
