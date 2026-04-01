package repository

import (
	"path/filepath"
	"testing"

	"github.com/john/job-tracker-api/internal/database"
	"github.com/john/job-tracker-api/internal/model"
)

func setupAIConfigTestDB(t *testing.T) (*AIConfigRepository, func()) {
	t.Helper()
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.sqlite")

	db, err := database.Open(dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := database.EnsureAllSchema(db); err != nil {
		t.Fatalf("ensure schema: %v", err)
	}
	return NewAIConfigRepository(db), func() { db.Close() }
}

func TestAIConfigRepository_GetEmpty(t *testing.T) {
	repo, cleanup := setupAIConfigTestDB(t)
	defer cleanup()

	cfg, err := repo.Get()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if cfg.Provider != "" {
		t.Errorf("expected empty provider, got %s", cfg.Provider)
	}
}

func TestAIConfigRepository_SaveAndGet(t *testing.T) {
	repo, cleanup := setupAIConfigTestDB(t)
	defer cleanup()

	cfg := model.AIConfig{
		Provider: "openai",
		APIKey:   "sk-test-123",
		BaseURL:  "https://api.openai.com/v1",
		Model:    "gpt-4o-mini",
	}
	if err := repo.Save(cfg); err != nil {
		t.Fatalf("save: %v", err)
	}

	loaded, err := repo.Get()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if loaded.Provider != "openai" {
		t.Errorf("expected openai, got %s", loaded.Provider)
	}
	if loaded.APIKey != "sk-test-123" {
		t.Errorf("expected sk-test-123, got %s", loaded.APIKey)
	}
	if loaded.Model != "gpt-4o-mini" {
		t.Errorf("expected gpt-4o-mini, got %s", loaded.Model)
	}
}

func TestAIConfigRepository_Update(t *testing.T) {
	repo, cleanup := setupAIConfigTestDB(t)
	defer cleanup()

	repo.Save(model.AIConfig{Provider: "openai", APIKey: "key1"})
	repo.Save(model.AIConfig{Provider: "lmstudio", APIKey: "key2"})

	loaded, _ := repo.Get()
	if loaded.Provider != "lmstudio" {
		t.Errorf("expected lmstudio after update, got %s", loaded.Provider)
	}
	if loaded.APIKey != "key2" {
		t.Errorf("expected key2 after update, got %s", loaded.APIKey)
	}
}
