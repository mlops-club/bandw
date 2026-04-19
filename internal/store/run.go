package store

import (
	"encoding/json"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// UpsertRunInput holds the fields for creating or updating a run.
type UpsertRunInput struct {
	Name           string
	DisplayName    string
	ProjectID      string
	UserID         string
	Config         string
	SummaryMetrics string
	Description    string
	Notes          string
	GroupName      string
	JobType        string
	Host           string
	Program        string
	GitCommit      string
	GitRepo        string
	SweepName      string
	State          string
	Tags           string // JSON array
}

// UpsertRun creates a new run or updates an existing one by name within a project.
// Returns the run and whether it was newly inserted.
func UpsertRun(db *gorm.DB, input UpsertRunInput) (*Run, bool, error) {
	var existing Run
	err := db.Where("project_id = ? AND name = ?", input.ProjectID, input.Name).First(&existing).Error

	if err == nil {
		// Update existing run.
		updates := map[string]interface{}{}
		if input.Config != "" {
			updates["config"] = datatypes.JSON(input.Config)
		}
		if input.SummaryMetrics != "" {
			updates["summary_metrics"] = datatypes.JSON(input.SummaryMetrics)
		}
		if input.Description != "" {
			updates["description"] = input.Description
		}
		if input.Notes != "" {
			updates["notes"] = input.Notes
		}
		if input.DisplayName != "" {
			updates["display_name"] = input.DisplayName
		}
		if input.GroupName != "" {
			updates["group_name"] = input.GroupName
		}
		if input.JobType != "" {
			updates["job_type"] = input.JobType
		}
		if input.Host != "" {
			updates["host"] = input.Host
		}
		if input.State != "" {
			updates["state"] = input.State
		}
		if input.Tags != "" {
			updates["tags"] = datatypes.JSON(input.Tags)
		}
		if len(updates) > 0 {
			if err := db.Model(&existing).Updates(updates).Error; err != nil {
				return nil, false, err
			}
		}
		// Re-read to get updated values.
		db.First(&existing, "id = ?", existing.ID)
		return &existing, false, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, false, err
	}

	// Create new run.
	run := Run{
		Name:        input.Name,
		DisplayName: input.DisplayName,
		ProjectID:   input.ProjectID,
		UserID:      input.UserID,
		State:       "running",
		GroupName:   input.GroupName,
		JobType:     input.JobType,
		Host:        input.Host,
		Program:     input.Program,
		GitCommit:   input.GitCommit,
		GitRepo:     input.GitRepo,
		SweepName:   input.SweepName,
	}
	if input.Config != "" {
		run.Config = datatypes.JSON(input.Config)
	}
	if input.SummaryMetrics != "" {
		run.SummaryMetrics = datatypes.JSON(input.SummaryMetrics)
	}
	if input.Tags != "" {
		run.Tags = datatypes.JSON(input.Tags)
	}
	if input.State != "" {
		run.State = input.State
	}
	if err := db.Create(&run).Error; err != nil {
		return nil, false, err
	}
	return &run, true, nil
}

// ListRuns returns runs for a project with pagination and total count.
func ListRuns(db *gorm.DB, projectID string, limit, offset int, order string) ([]Run, int64, error) {
	var total int64
	db.Model(&Run{}).Where("project_id = ?", projectID).Count(&total)

	if order == "" {
		order = "created_at DESC"
	}
	var runs []Run
	err := db.Where("project_id = ?", projectID).
		Order(order).Limit(limit).Offset(offset).
		Find(&runs).Error
	return runs, total, err
}

// GetRunByName finds a run by project ID and run name.
func GetRunByName(db *gorm.DB, projectID, runName string) (*Run, error) {
	var run Run
	if err := db.Where("project_id = ? AND name = ?", projectID, runName).First(&run).Error; err != nil {
		return nil, err
	}
	return &run, nil
}

// GetHistory returns history rows for a run within a step range, paginated by limit.
// This is pagination (not downsampling) — matches the SDK's HistoryScan which uses samples as pageSize.
func GetHistory(db *gorm.DB, runID string, minStep, maxStep *int64, limit int) ([]RunHistory, error) {
	q := db.Where("run_id = ?", runID)
	if minStep != nil {
		q = q.Where("step >= ?", *minStep)
	}
	if maxStep != nil {
		q = q.Where("step < ?", *maxStep)
	}
	q = q.Order("step ASC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	var rows []RunHistory
	err := q.Find(&rows).Error
	return rows, err
}

// GetSampledHistory returns downsampled history for specific keys.
// If the row count exceeds samples, it uniformly selects rows (always including first and last).
// Key filtering is done in Go for SQLite/MySQL portability (no JSON SQL functions).
func GetSampledHistory(db *gorm.DB, runID string, keys []string, minStep, maxStep *int64, samples int) ([]map[string]interface{}, error) {
	q := db.Where("run_id = ?", runID)
	if minStep != nil {
		q = q.Where("step >= ?", *minStep)
	}
	if maxStep != nil {
		q = q.Where("step < ?", *maxStep)
	}
	q = q.Order("step ASC")

	var rows []RunHistory
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}

	// Downsample if needed.
	if samples > 0 && len(rows) > samples {
		rows = downsampleRows(rows, samples)
	}

	// Build key set for filtering.
	keySet := make(map[string]bool, len(keys))
	for _, k := range keys {
		keySet[k] = true
	}

	result := make([]map[string]interface{}, 0, len(rows))
	for _, row := range rows {
		var parsed map[string]interface{}
		if err := json.Unmarshal(row.Data, &parsed); err != nil {
			continue
		}
		// Always include _step.
		filtered := map[string]interface{}{"_step": row.Step}
		for k, v := range parsed {
			if len(keySet) == 0 || keySet[k] {
				filtered[k] = v
			}
		}
		result = append(result, filtered)
	}
	return result, nil
}

// downsampleRows uniformly selects `samples` rows, always including first and last.
func downsampleRows(rows []RunHistory, samples int) []RunHistory {
	n := len(rows)
	if samples >= n {
		return rows
	}
	if samples <= 0 {
		return nil
	}
	if samples == 1 {
		return []RunHistory{rows[n-1]}
	}

	result := make([]RunHistory, 0, samples)
	for i := 0; i < samples; i++ {
		idx := i * (n - 1) / (samples - 1)
		result = append(result, rows[idx])
	}
	return result
}

// HistoryKeysResult holds the response for GetHistoryKeys.
type HistoryKeysResult struct {
	LastStep int64
	Keys     map[string]map[string]interface{} // key -> {"previousValue": lastValue}
}

// GetHistoryKeys discovers all logged metric keys and their last values for a run.
func GetHistoryKeys(db *gorm.DB, runID string) (*HistoryKeysResult, error) {
	var rows []RunHistory
	if err := db.Where("run_id = ?", runID).Order("step ASC").Find(&rows).Error; err != nil {
		return nil, err
	}

	if len(rows) == 0 {
		return &HistoryKeysResult{
			LastStep: 0,
			Keys:     map[string]map[string]interface{}{},
		}, nil
	}

	keys := make(map[string]map[string]interface{})
	var lastStep int64

	for _, row := range rows {
		if row.Step > lastStep {
			lastStep = row.Step
		}
		var parsed map[string]interface{}
		if err := json.Unmarshal(row.Data, &parsed); err != nil {
			continue
		}
		for k, v := range parsed {
			if k == "_step" || k == "_runtime" || k == "_timestamp" {
				continue
			}
			keys[k] = map[string]interface{}{"previousValue": v}
		}
	}

	return &HistoryKeysResult{
		LastStep: lastStep,
		Keys:     keys,
	}, nil
}
