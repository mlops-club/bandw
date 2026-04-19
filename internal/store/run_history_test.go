package store_test

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/mlops-club/bandw/internal/store"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupDBWithHistory creates an in-memory DB with a seeded run and history rows.
func setupDBWithHistory(t *testing.T, numRows int) (*store.Run, func()) {
	t.Helper()
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	// Find the seeded admin entity and user.
	var entity store.Entity
	require.NoError(t, db.Where("name = ?", "admin").First(&entity).Error)
	var user store.User
	require.NoError(t, db.Where("username = ?", "admin").First(&user).Error)

	project := store.Project{Name: "test-project", EntityID: entity.ID, CreatedBy: user.ID}
	require.NoError(t, db.Create(&project).Error)

	run := store.Run{Name: "run1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	require.NoError(t, db.Create(&run).Error)

	// Seed history rows.
	for i := 0; i < numRows; i++ {
		data, _ := json.Marshal(map[string]interface{}{
			"loss":     1.0 / float64(i+1),
			"accuracy": float64(i) * 0.01,
			"_step":    i,
		})
		row := store.RunHistory{RunID: run.ID, Step: int64(i), Data: data}
		require.NoError(t, db.Create(&row).Error)
	}

	cleanup := func() {} // SQLite in-memory DB is automatically cleaned up.
	_ = cleanup

	// Store DB reference on the run for later use.
	// We return the run so tests can use run.ID.
	// The db is accessed via closure in test functions.
	// Actually, let's just return what we need.

	// Stash db in a package-level helper — nah, let's just return it differently.
	// Simplest: return run and give tests the db via a wrapper.
	return &run, func() {}
}

func TestGetHistory_ReturnsRowsInStepRange(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	// Seed 100 rows.
	for i := 0; i < 100; i++ {
		data, _ := json.Marshal(map[string]interface{}{"loss": 1.0 / float64(i+1), "_step": i})
		db.Create(&store.RunHistory{RunID: run.ID, Step: int64(i), Data: data})
	}

	min := int64(10)
	max := int64(50)
	rows, err := store.GetHistory(db, run.ID, &min, &max, 0)
	require.NoError(t, err)
	assert.Equal(t, 40, len(rows))
	assert.Equal(t, int64(10), rows[0].Step)
	assert.Equal(t, int64(49), rows[len(rows)-1].Step)
}

func TestGetHistory_LimitActsAsPagination(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	for i := 0; i < 100; i++ {
		data, _ := json.Marshal(map[string]interface{}{"loss": float64(i)})
		db.Create(&store.RunHistory{RunID: run.ID, Step: int64(i), Data: data})
	}

	rows, err := store.GetHistory(db, run.ID, nil, nil, 10)
	require.NoError(t, err)
	assert.Equal(t, 10, len(rows))
	assert.Equal(t, int64(0), rows[0].Step)
	assert.Equal(t, int64(9), rows[9].Step)
}

func TestGetHistory_EmptyRange(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	// Seed rows at steps 0-9.
	for i := 0; i < 10; i++ {
		data, _ := json.Marshal(map[string]interface{}{"loss": float64(i)})
		db.Create(&store.RunHistory{RunID: run.ID, Step: int64(i), Data: data})
	}

	min := int64(100)
	max := int64(200)
	rows, err := store.GetHistory(db, run.ID, &min, &max, 0)
	require.NoError(t, err)
	assert.Equal(t, 0, len(rows))
}

func TestGetSampledHistory_DownsamplesCorrectly(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	for i := 0; i < 100; i++ {
		data, _ := json.Marshal(map[string]interface{}{"loss": 1.0 / float64(i+1), "_step": i})
		db.Create(&store.RunHistory{RunID: run.ID, Step: int64(i), Data: data})
	}

	rows, err := store.GetSampledHistory(db, run.ID, []string{"loss"}, nil, nil, 10)
	require.NoError(t, err)
	assert.Equal(t, 10, len(rows))
	// First and last rows should be included.
	assert.Equal(t, int64(0), rows[0]["_step"])
	assert.Equal(t, int64(99), rows[len(rows)-1]["_step"])
	// Each row should have _step and loss.
	for _, row := range rows {
		assert.Contains(t, row, "_step")
		assert.Contains(t, row, "loss")
	}
}

func TestGetSampledHistory_KeyFiltering(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	for i := 0; i < 5; i++ {
		data, _ := json.Marshal(map[string]interface{}{
			"loss":     float64(i),
			"accuracy": float64(i) * 0.1,
			"lr":       0.001,
			"_step":    i,
		})
		db.Create(&store.RunHistory{RunID: run.ID, Step: int64(i), Data: data})
	}

	// Request only "loss" key.
	rows, err := store.GetSampledHistory(db, run.ID, []string{"loss"}, nil, nil, 100)
	require.NoError(t, err)
	assert.Equal(t, 5, len(rows))
	for _, row := range rows {
		assert.Contains(t, row, "_step")
		assert.Contains(t, row, "loss")
		assert.NotContains(t, row, "accuracy")
		assert.NotContains(t, row, "lr")
	}
}

func TestGetSampledHistory_NoDownsampleWhenUnderLimit(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	for i := 0; i < 5; i++ {
		data, _ := json.Marshal(map[string]interface{}{"loss": float64(i), "_step": i})
		db.Create(&store.RunHistory{RunID: run.ID, Step: int64(i), Data: data})
	}

	rows, err := store.GetSampledHistory(db, run.ID, nil, nil, nil, 100)
	require.NoError(t, err)
	assert.Equal(t, 5, len(rows))
}

func TestGetHistoryKeys_ReturnsAllKeys(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	// Row 0: only loss.
	data0, _ := json.Marshal(map[string]interface{}{"loss": 0.5, "_step": 0})
	db.Create(&store.RunHistory{RunID: run.ID, Step: 0, Data: data0})

	// Row 1: loss + accuracy.
	data1, _ := json.Marshal(map[string]interface{}{"loss": 0.3, "accuracy": 0.7, "_step": 1})
	db.Create(&store.RunHistory{RunID: run.ID, Step: 1, Data: data1})

	// Row 2: loss + accuracy + lr.
	data2, _ := json.Marshal(map[string]interface{}{"loss": 0.1, "accuracy": 0.9, "lr": 0.001, "_step": 2})
	db.Create(&store.RunHistory{RunID: run.ID, Step: 2, Data: data2})

	result, err := store.GetHistoryKeys(db, run.ID)
	require.NoError(t, err)
	assert.Equal(t, int64(2), result.LastStep)
	assert.Contains(t, result.Keys, "loss")
	assert.Contains(t, result.Keys, "accuracy")
	assert.Contains(t, result.Keys, "lr")
	// Internal keys should be excluded.
	assert.NotContains(t, result.Keys, "_step")
}

func TestGetHistoryKeys_PreviousValueIsLastRow(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	for i := 0; i < 10; i++ {
		data, _ := json.Marshal(map[string]interface{}{"loss": 1.0 / float64(i+1), "_step": i})
		db.Create(&store.RunHistory{RunID: run.ID, Step: int64(i), Data: data})
	}

	result, err := store.GetHistoryKeys(db, run.ID)
	require.NoError(t, err)

	// The previousValue for "loss" should be 1/10 = 0.1 (the last row's value).
	prevVal := result.Keys["loss"]["previousValue"].(float64)
	assert.InDelta(t, 0.1, prevVal, 0.001)
}

func TestGetHistoryKeys_LastStepCorrect(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	for i := 0; i < 50; i++ {
		data, _ := json.Marshal(map[string]interface{}{"loss": float64(i), "_step": i})
		db.Create(&store.RunHistory{RunID: run.ID, Step: int64(i), Data: data})
	}

	result, err := store.GetHistoryKeys(db, run.ID)
	require.NoError(t, err)
	assert.Equal(t, int64(49), result.LastStep)
}

func TestGetHistoryKeys_EmptyRun(t *testing.T) {
	db, err := store.NewSQLiteDB()
	require.NoError(t, err)
	require.NoError(t, store.AutoMigrate(db))
	require.NoError(t, store.SeedDefaults(db))

	var entity store.Entity
	db.Where("name = ?", "admin").First(&entity)
	var user store.User
	db.Where("username = ?", "admin").First(&user)

	project := store.Project{Name: "proj", EntityID: entity.ID, CreatedBy: user.ID}
	db.Create(&project)
	run := store.Run{Name: "r1", ProjectID: project.ID, UserID: user.ID, State: "running"}
	db.Create(&run)

	result, err := store.GetHistoryKeys(db, run.ID)
	require.NoError(t, err)
	assert.Equal(t, int64(0), result.LastStep)
	assert.Empty(t, result.Keys)
}

// Remove the unused helper to avoid compiler warning.
var _ = fmt.Sprintf
