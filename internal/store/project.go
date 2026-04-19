package store

import (
	"gorm.io/gorm"
)

// GetOrCreateProject finds an existing project by entity name and project name,
// or creates it if it doesn't exist. Returns the project.
func GetOrCreateProject(db *gorm.DB, entityName, projectName, userID string) (*Project, error) {
	// Find the entity by name.
	var entity Entity
	if err := db.Where("name = ?", entityName).First(&entity).Error; err != nil {
		return nil, err
	}

	// Try to find existing project.
	var project Project
	err := db.Where("entity_id = ? AND name = ?", entity.ID, projectName).First(&project).Error
	if err == nil {
		return &project, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	// Create new project.
	project = Project{
		Name:      projectName,
		EntityID:  entity.ID,
		CreatedBy: userID,
	}
	if err := db.Create(&project).Error; err != nil {
		return nil, err
	}
	return &project, nil
}

// GetProjectByEntityAndName finds a project by entity name and project name.
func GetProjectByEntityAndName(db *gorm.DB, entityName, projectName string) (*Project, error) {
	var entity Entity
	if err := db.Where("name = ?", entityName).First(&entity).Error; err != nil {
		return nil, err
	}
	var project Project
	if err := db.Where("entity_id = ? AND name = ?", entity.ID, projectName).First(&project).Error; err != nil {
		return nil, err
	}
	return &project, nil
}

// ListProjects returns all projects for an entity.
func ListProjects(db *gorm.DB, entityName string) ([]Project, error) {
	var entity Entity
	if err := db.Where("name = ?", entityName).First(&entity).Error; err != nil {
		return nil, err
	}
	var projects []Project
	if err := db.Where("entity_id = ?", entity.ID).Order("created_at DESC").Find(&projects).Error; err != nil {
		return nil, err
	}
	return projects, nil
}

// CountRuns returns the number of runs in a project.
func CountRuns(db *gorm.DB, projectID string) (int64, error) {
	var count int64
	err := db.Model(&Run{}).Where("project_id = ?", projectID).Count(&count).Error
	return count, err
}

// LastRunTime returns the most recent run's created_at for a project.
func LastRunTime(db *gorm.DB, projectID string) (*Run, error) {
	var run Run
	err := db.Where("project_id = ?", projectID).Order("created_at DESC").First(&run).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &run, nil
}
