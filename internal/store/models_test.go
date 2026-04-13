package store_test

import (
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/mlops-club/bandw/internal/testutil"
)

func TestAutoMigrateCreatesAllTables(t *testing.T) {
	h := testutil.NewHarness(t)
	defer h.Close()

	expectedTables := []string{
		"users", "entities", "api_keys",
		"projects", "runs",
		"run_histories", "run_events", "run_logs",
	}

	for _, table := range expectedTables {
		if !h.DB.Migrator().HasTable(table) {
			t.Errorf("expected table %q to exist", table)
		}
	}
}

func TestSeedDefaultsCreatesUser(t *testing.T) {
	h := testutil.NewHarness(t)
	defer h.Close()

	var user store.User
	err := h.DB.Where("username = ?", "admin").First(&user).Error
	if err != nil {
		t.Fatalf("expected admin user to exist: %v", err)
	}
	if user.Name != "Admin User" {
		t.Errorf("expected name 'Admin User', got %q", user.Name)
	}

	var entity store.Entity
	err = h.DB.Where("name = ?", "admin").First(&entity).Error
	if err != nil {
		t.Fatalf("expected admin entity to exist: %v", err)
	}

	var apiKey store.APIKey
	err = h.DB.Where("user_id = ?", user.ID).First(&apiKey).Error
	if err != nil {
		t.Fatalf("expected API key to exist: %v", err)
	}
}

func TestSeedDefaultsIsIdempotent(t *testing.T) {
	h := testutil.NewHarness(t)
	defer h.Close()

	// SeedDefaults was already called by the harness; call it again.
	if err := store.SeedDefaults(h.DB); err != nil {
		t.Fatalf("second SeedDefaults call failed: %v", err)
	}

	var count int64
	h.DB.Model(&store.User{}).Count(&count)
	if count != 1 {
		t.Errorf("expected 1 user after double seed, got %d", count)
	}
}

func TestRunUniqueConstraint(t *testing.T) {
	h := testutil.NewHarness(t)
	defer h.Close()

	// Create a project to attach runs to.
	project := store.Project{Name: "test-project", EntityID: "entity-1"}
	h.DB.Create(&store.Entity{ID: "entity-1", Name: "testent", Type: "user"})
	h.DB.Create(&project)

	run1 := store.Run{Name: "run-1", ProjectID: project.ID, UserID: "user-1", State: "running"}
	if err := h.DB.Create(&run1).Error; err != nil {
		t.Fatalf("first run create failed: %v", err)
	}

	run2 := store.Run{Name: "run-1", ProjectID: project.ID, UserID: "user-1", State: "running"}
	err := h.DB.Create(&run2).Error
	if err == nil {
		t.Error("expected unique constraint violation for duplicate (project_id, name)")
	}
}

func TestProjectUniqueConstraint(t *testing.T) {
	h := testutil.NewHarness(t)
	defer h.Close()

	entity := store.Entity{ID: "entity-2", Name: "testent2", Type: "user"}
	h.DB.Create(&entity)

	p1 := store.Project{Name: "proj", EntityID: entity.ID}
	if err := h.DB.Create(&p1).Error; err != nil {
		t.Fatalf("first project create failed: %v", err)
	}

	p2 := store.Project{Name: "proj", EntityID: entity.ID}
	err := h.DB.Create(&p2).Error
	if err == nil {
		t.Error("expected unique constraint violation for duplicate (entity_id, name)")
	}
}
