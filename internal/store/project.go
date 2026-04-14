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
