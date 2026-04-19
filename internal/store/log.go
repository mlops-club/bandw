package store

import "gorm.io/gorm"

// GetRunLogs returns paginated log lines for a run, ordered by line number.
func GetRunLogs(db *gorm.DB, runID string, offset, limit int) ([]RunLog, int64, error) {
	var total int64
	db.Model(&RunLog{}).Where("run_id = ?", runID).Count(&total)

	if limit <= 0 {
		limit = 1000
	}

	var logs []RunLog
	err := db.Where("run_id = ?", runID).
		Order("line_num ASC").
		Offset(offset).
		Limit(limit).
		Find(&logs).Error
	return logs, total, err
}
