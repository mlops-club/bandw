package store

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// InsertHistory adds a history row for a run step.
func InsertHistory(db *gorm.DB, runID string, step int64, dataJSON string) error {
	h := RunHistory{
		RunID: runID,
		Step:  step,
		Data:  datatypes.JSON(dataJSON),
	}
	if err := db.Create(&h).Error; err != nil {
		return err
	}
	// Increment history line count.
	db.Model(&Run{}).Where("id = ?", runID).
		UpdateColumn("history_line_count", gorm.Expr("history_line_count + 1"))
	return nil
}

// UpdateSummary replaces the run's summary metrics.
func UpdateSummary(db *gorm.DB, runID string, summaryJSON string) error {
	return db.Model(&Run{}).Where("id = ?", runID).
		Update("summary_metrics", datatypes.JSON(summaryJSON)).Error
}

// InsertEvent adds a system event row for a run.
func InsertEvent(db *gorm.DB, runID string, dataJSON string) error {
	e := RunEvent{
		RunID: runID,
		Data:  datatypes.JSON(dataJSON),
	}
	if err := db.Create(&e).Error; err != nil {
		return err
	}
	db.Model(&Run{}).Where("id = ?", runID).
		UpdateColumn("events_line_count", gorm.Expr("events_line_count + 1"))
	return nil
}

// InsertLog adds a console output line for a run.
func InsertLog(db *gorm.DB, runID string, lineNum int, content, stream string) error {
	l := RunLog{
		RunID:   runID,
		LineNum: lineNum,
		Content: content,
		Stream:  stream,
	}
	if err := db.Create(&l).Error; err != nil {
		return err
	}
	db.Model(&Run{}).Where("id = ?", runID).
		UpdateColumn("log_line_count", gorm.Expr("log_line_count + 1"))
	return nil
}

// CompleteRun sets the run state based on exit code.
func CompleteRun(db *gorm.DB, runID string, exitCode int32) error {
	state := "finished"
	if exitCode != 0 {
		state = "crashed"
	}
	return db.Model(&Run{}).Where("id = ?", runID).
		Updates(map[string]interface{}{
			"state":     state,
			"exit_code": exitCode,
		}).Error
}

// UpdateHeartbeat updates the run's heartbeat timestamp.
func UpdateHeartbeat(db *gorm.DB, runID string) error {
	now := time.Now()
	return db.Model(&Run{}).Where("id = ?", runID).
		Update("heartbeat_at", &now).Error
}
