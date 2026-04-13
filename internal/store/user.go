package store

import "gorm.io/gorm"

// GetUserByAPIKey looks up a user by their raw API key.
// Returns the user if the key matches a stored KeyHash.
func GetUserByAPIKey(db *gorm.DB, key string) (*User, error) {
	var apiKey APIKey
	if err := db.Where("key_hash = ?", key).First(&apiKey).Error; err != nil {
		return nil, err
	}
	var user User
	if err := db.First(&user, "id = ?", apiKey.UserID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// GetEntityByUserID returns the default entity for a given user.
func GetEntityByUserID(db *gorm.DB, userID string) (*Entity, error) {
	var user User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}
	if user.DefaultEntityID == "" {
		return nil, gorm.ErrRecordNotFound
	}
	var entity Entity
	if err := db.First(&entity, "id = ?", user.DefaultEntityID).Error; err != nil {
		return nil, err
	}
	return &entity, nil
}
