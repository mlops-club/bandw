package store

import "gorm.io/gorm"

// GetOrCreateProject finds or creates a project under the given entity.
// If the entity doesn't exist, it returns an error.
func GetOrCreateProject(db *gorm.DB, entityName, projectName, createdBy string) (*Project, error) {
	var entity Entity
	if err := db.Where("name = ?", entityName).First(&entity).Error; err != nil {
		return nil, err
	}

	var project Project
	result := db.Where("entity_id = ? AND name = ?", entity.ID, projectName).First(&project)
	if result.Error == nil {
		return &project, nil
	}
	if result.Error != gorm.ErrRecordNotFound {
		return nil, result.Error
	}

	project = Project{
		Name:      projectName,
		EntityID:  entity.ID,
		CreatedBy: createdBy,
	}
	if err := db.Create(&project).Error; err != nil {
		return nil, err
	}
	project.Entity = entity
	return &project, nil
}

// GetProject returns a project by entity name and project name.
func GetProject(db *gorm.DB, entityName, projectName string) (*Project, error) {
	var entity Entity
	if err := db.Where("name = ?", entityName).First(&entity).Error; err != nil {
		return nil, err
	}
	var project Project
	if err := db.Where("entity_id = ? AND name = ?", entity.ID, projectName).First(&project).Error; err != nil {
		return nil, err
	}
	project.Entity = entity
	return &project, nil
}
