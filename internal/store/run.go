package store

import (
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
