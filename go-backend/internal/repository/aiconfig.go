package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/john/job-tracker-api/internal/model"
)

// AIConfigRepository handles AI configuration persistence.
type AIConfigRepository struct {
	db *sql.DB
}

// NewAIConfigRepository creates a new AIConfigRepository.
func NewAIConfigRepository(db *sql.DB) *AIConfigRepository {
	return &AIConfigRepository{db: db}
}

// Get retrieves the default AI configuration.
// Returns an empty AIConfig (not an error) if no row exists.
func (r *AIConfigRepository) Get() (model.AIConfig, error) {
	var cfg model.AIConfig
	var apiKey, baseURL, modelName sql.NullString

	err := r.db.QueryRow("SELECT provider, apiKey, baseUrl, model FROM ai_config WHERE id = 'default'").
		Scan(&cfg.Provider, &apiKey, &baseURL, &modelName)
	if err == sql.ErrNoRows {
		return model.AIConfig{}, nil
	}
	if err != nil {
		return cfg, fmt.Errorf("get ai config: %w", err)
	}

	cfg.APIKey = nullStrVal(apiKey)
	cfg.BaseURL = nullStrVal(baseURL)
	cfg.Model = nullStrVal(modelName)
	return cfg, nil
}

// Save inserts or updates the default AI configuration.
func (r *AIConfigRepository) Save(cfg model.AIConfig) error {
	now := time.Now().UTC().Format(time.RFC3339Nano)

	var exists bool
	err := r.db.QueryRow("SELECT 1 FROM ai_config WHERE id = 'default'").Scan(&exists)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("check ai config exists: %w", err)
	}

	if err == nil {
		_, err = r.db.Exec(`
			UPDATE ai_config SET
				provider = ?, apiKey = ?, baseUrl = ?, model = ?, updatedAt = ?
			WHERE id = 'default'
		`, cfg.Provider, cfg.APIKey, cfg.BaseURL, cfg.Model, now)
	} else {
		_, err = r.db.Exec(`
			INSERT INTO ai_config (id, provider, apiKey, baseUrl, model, updatedAt, createdAt)
			VALUES ('default', ?, ?, ?, ?, ?, ?)
		`, cfg.Provider, cfg.APIKey, cfg.BaseURL, cfg.Model, now, now)
	}
	if err != nil {
		return fmt.Errorf("save ai config: %w", err)
	}
	return nil
}

func nullStrVal(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}
