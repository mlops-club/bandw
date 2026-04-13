package store

import (
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// UpsertRunInput holds the fields for creating or updating a run.
type UpsertRunInput struct {
	Name           string
	DisplayName    string
	Config         string // JSON string
	SummaryMetrics string // JSON string
	Description    string
	Notes          string
	Tags           string // JSON array string
	GroupName      string
	JobType        string
	Host           string
	Program        string
	Commit         string
	Repo           string
	Sweep          string
	State          string
}

// UpsertRun creates or updates a run. Returns the run and whether it was inserted (true) or updated (false).
func UpsertRun(db *gorm.DB, projectID, userID string, input UpsertRunInput) (*Run, bool, error) {
	var existing Run
	result := db.Where("project_id = ? AND name = ?", projectID, input.Name).First(&existing)

	if result.Error == nil {
		// Update existing run.
		updates := map[string]interface{}{}
		if input.DisplayName != "" {
			updates["display_name"] = input.DisplayName
		}
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
		if input.Tags != "" {
			updates["tags"] = datatypes.JSON(input.Tags)
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
		if input.Program != "" {
			updates["program"] = input.Program
		}
		if input.Commit != "" {
			updates["git_commit"] = input.Commit
		}
		if input.Repo != "" {
			updates["git_repo"] = input.Repo
		}
		if input.Sweep != "" {
			updates["sweep_name"] = input.Sweep
		}
		if input.State != "" {
			updates["state"] = input.State
		}

		if len(updates) > 0 {
			if err := db.Model(&existing).Updates(updates).Error; err != nil {
				return nil, false, err
			}
		}
		// Re-fetch to get updated values.
		db.First(&existing, "id = ?", existing.ID)
		return &existing, false, nil
	}

	if result.Error != gorm.ErrRecordNotFound {
		return nil, false, result.Error
	}

	// Create new run.
	run := Run{
		Name:        input.Name,
		DisplayName: input.DisplayName,
		ProjectID:   projectID,
		UserID:      userID,
		State:       "running",
		Description: input.Description,
		Notes:       input.Notes,
		GroupName:   input.GroupName,
		JobType:     input.JobType,
		Host:        input.Host,
		Program:     input.Program,
		GitCommit:   input.Commit,
		GitRepo:     input.Repo,
		SweepName:   input.Sweep,
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

	if err := db.Create(&run).Error; err != nil {
		return nil, false, err
	}
	return &run, true, nil
}

// GetRunByName returns a run by project ID and run name.
func GetRunByName(db *gorm.DB, projectID, runName string) (*Run, error) {
	var run Run
	if err := db.Where("project_id = ? AND name = ?", projectID, runName).First(&run).Error; err != nil {
		return nil, err
	}
	return &run, nil
}
