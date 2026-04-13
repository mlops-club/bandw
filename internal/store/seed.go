package store

import "gorm.io/gorm"

// SeedDefaults creates a default admin user, entity, and API key if they
// don't already exist. This is idempotent — safe to call on every startup.
func SeedDefaults(db *gorm.DB) error {
	var count int64
	db.Model(&User{}).Where("username = ?", "admin").Count(&count)
	if count > 0 {
		return nil
	}

	user := User{
		Username:    "admin",
		Name:        "Admin User",
		AccountType: "user",
		Admin:       true,
	}
	if err := db.Create(&user).Error; err != nil {
		return err
	}

	entity := Entity{
		Name:   "admin",
		Type:   "user",
	}
	if err := db.Create(&entity).Error; err != nil {
		return err
	}

	// Link user to its default entity.
	if err := db.Model(&user).Update("default_entity_id", entity.ID).Error; err != nil {
		return err
	}

	apiKey := APIKey{
		UserID:  user.ID,
		Name:    "Default API Key",
		KeyHash: "local-dev-key",
	}
	return db.Create(&apiKey).Error
}
