package store

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// BeforeCreate hook for UUID-based primary keys.
func generateUUID(id *string) {
	if *id == "" {
		*id = uuid.NewString()
	}
}

// User represents a wandb user account.
type User struct {
	ID              string         `gorm:"type:varchar(36);primaryKey" json:"id"`
	Username        string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"username"`
	Email           string         `gorm:"type:varchar(255);uniqueIndex" json:"email"`
	Name            string         `gorm:"type:varchar(255)" json:"name"`
	PasswordHash    string         `gorm:"type:varchar(255)" json:"-"`
	AccountType     string         `gorm:"type:varchar(64);default:user" json:"account_type"`
	Admin           bool           `gorm:"default:false" json:"admin"`
	DefaultEntityID string         `gorm:"type:varchar(36)" json:"default_entity_id"`
	CreatedAt       time.Time      `json:"created_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"deleted_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	generateUUID(&u.ID)
	return nil
}

// Entity represents a user or team namespace.
type Entity struct {
	ID             string         `gorm:"type:varchar(36);primaryKey" json:"id"`
	Name           string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"name"`
	Type           string         `gorm:"type:varchar(64);not null" json:"type"` // user, team, org
	OrganizationID string         `gorm:"type:varchar(36)" json:"organization_id"`
	PhotoURL       string         `gorm:"type:varchar(2048)" json:"photo_url"`
	Metadata       datatypes.JSON `gorm:"type:json" json:"metadata"`
	CreatedAt      time.Time      `json:"created_at"`
}

func (e *Entity) BeforeCreate(tx *gorm.DB) error {
	generateUUID(&e.ID)
	return nil
}

// APIKey represents an API key for authenticating SDK requests.
type APIKey struct {
	ID          string    `gorm:"type:varchar(36);primaryKey" json:"id"`
	UserID      string    `gorm:"type:varchar(36);not null;index" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID" json:"-"`
	Name        string    `gorm:"type:varchar(255)" json:"name"`
	KeyHash     string    `gorm:"type:varchar(255);not null" json:"-"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

func (k *APIKey) BeforeCreate(tx *gorm.DB) error {
	generateUUID(&k.ID)
	return nil
}

// Project groups runs under an entity namespace.
type Project struct {
	ID          string    `gorm:"type:varchar(36);primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null;uniqueIndex:idx_entity_project" json:"name"`
	EntityID    string    `gorm:"type:varchar(36);not null;uniqueIndex:idx_entity_project;index" json:"entity_id"`
	Entity      Entity    `gorm:"foreignKey:EntityID" json:"-"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedBy   string    `gorm:"type:varchar(36)" json:"created_by"`
	Repo        string    `gorm:"type:varchar(1024)" json:"repo"`
	DockerImage string    `gorm:"type:varchar(1024)" json:"docker_image"`
	Access      string    `gorm:"type:varchar(64)" json:"access"`
	Views       datatypes.JSON `gorm:"type:json" json:"views"`
	CreatedAt   time.Time `json:"created_at"`
}

func (p *Project) BeforeCreate(tx *gorm.DB) error {
	generateUUID(&p.ID)
	return nil
}

// Run represents a single experiment run (called "bucket" in the legacy SDK).
type Run struct {
	ID               string         `gorm:"type:varchar(36);primaryKey" json:"id"`
	Name             string         `gorm:"type:varchar(255);not null;uniqueIndex:idx_project_run" json:"name"`
	DisplayName      string         `gorm:"type:varchar(255)" json:"display_name"`
	ProjectID        string         `gorm:"type:varchar(36);not null;uniqueIndex:idx_project_run;index" json:"project_id"`
	Project          Project        `gorm:"foreignKey:ProjectID" json:"-"`
	UserID           string         `gorm:"type:varchar(36);not null;index" json:"user_id"`
	User             User           `gorm:"foreignKey:UserID" json:"-"`
	State            string         `gorm:"type:varchar(64);default:running" json:"state"` // running, finished, crashed, failed
	Config           datatypes.JSON `gorm:"type:json" json:"config"`
	SummaryMetrics   datatypes.JSON `gorm:"type:json" json:"summary_metrics"`
	WandbConfig      datatypes.JSON `gorm:"type:json" json:"wandb_config"`
	RunInfo          datatypes.JSON `gorm:"type:json" json:"run_info"`
	Description      string         `gorm:"type:text" json:"description"`
	Notes            string         `gorm:"type:text" json:"notes"`
	Tags             datatypes.JSON `gorm:"type:json" json:"tags"`
	GroupName        string         `gorm:"type:varchar(255)" json:"group_name"`
	JobType          string         `gorm:"type:varchar(255)" json:"job_type"`
	Host             string         `gorm:"type:varchar(255)" json:"host"`
	Program          string         `gorm:"type:varchar(1024)" json:"program"`
	GitCommit        string         `gorm:"type:varchar(40)" json:"git_commit"`
	GitRepo          string         `gorm:"type:varchar(1024)" json:"git_repo"`
	SweepName        string         `gorm:"type:varchar(255)" json:"sweep_name"`
	HistoryLineCount int            `gorm:"default:0" json:"history_line_count"`
	LogLineCount     int            `gorm:"default:0" json:"log_line_count"`
	EventsLineCount  int            `gorm:"default:0" json:"events_line_count"`
	Stopped          bool           `gorm:"default:false" json:"stopped"`
	ExitCode         *int           `json:"exit_code"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	HeartbeatAt      *time.Time     `json:"heartbeat_at"`
}

func (r *Run) BeforeCreate(tx *gorm.DB) error {
	generateUUID(&r.ID)
	return nil
}

// RunHistory stores one row per history step (metrics logged via wandb.log).
type RunHistory struct {
	ID        int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	RunID     string         `gorm:"type:varchar(36);not null;index:idx_run_step" json:"run_id"`
	Run       Run            `gorm:"foreignKey:RunID" json:"-"`
	Step      int64          `gorm:"not null;index:idx_run_step" json:"step"`
	Data      datatypes.JSON `gorm:"type:json;not null" json:"data"`
	CreatedAt time.Time      `json:"created_at"`
}

// RunEvent stores system metrics snapshots (CPU, GPU, memory).
type RunEvent struct {
	ID        int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	RunID     string         `gorm:"type:varchar(36);not null;index" json:"run_id"`
	Run       Run            `gorm:"foreignKey:RunID" json:"-"`
	Data      datatypes.JSON `gorm:"type:json;not null" json:"data"`
	CreatedAt time.Time      `json:"created_at"`
}

// RunLog stores console output lines from a run.
type RunLog struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	RunID     string    `gorm:"type:varchar(36);not null;index:idx_run_log" json:"run_id"`
	Run       Run       `gorm:"foreignKey:RunID" json:"-"`
	LineNum   int       `gorm:"not null;index:idx_run_log" json:"line_num"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Stream    string    `gorm:"type:varchar(16);default:stdout" json:"stream"` // stdout, stderr
	CreatedAt time.Time `json:"created_at"`
}
