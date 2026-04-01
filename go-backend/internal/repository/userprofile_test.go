package repository

import (
	"path/filepath"
	"testing"

	"github.com/john/job-tracker-api/internal/database"
	"github.com/john/job-tracker-api/internal/model"
)

func setupProfileTestDB(t *testing.T) (*UserProfileRepository, func()) {
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
	return NewUserProfileRepository(db), func() { db.Close() }
}

func TestUserProfileRepository_GetEmpty(t *testing.T) {
	repo, cleanup := setupProfileTestDB(t)
	defer cleanup()

	p, err := repo.Get()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if p.Name != "" {
		t.Errorf("expected empty name, got %s", p.Name)
	}
}

func TestUserProfileRepository_SaveAndGet(t *testing.T) {
	repo, cleanup := setupProfileTestDB(t)
	defer cleanup()

	years := 10
	profile := model.UserProfile{
		Name:            "John",
		CurrentRole:     "Senior Engineer",
		YearsExperience: &years,
		Skills:          []string{"Go", "TypeScript", "SQLite"},
		PreferredRoles:  []string{"Backend", "Full Stack"},
		TargetIndustries: []string{"Tech", "Finance"},
		DealBreakers:    []string{"No remote"},
		CareerGoals:     "Staff engineer",
	}
	if err := repo.Save(profile); err != nil {
		t.Fatalf("save: %v", err)
	}

	loaded, err := repo.Get()
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if loaded.Name != "John" {
		t.Errorf("expected John, got %s", loaded.Name)
	}
	if loaded.YearsExperience == nil || *loaded.YearsExperience != 10 {
		t.Error("expected yearsExperience=10")
	}
	if len(loaded.Skills) != 3 || loaded.Skills[0] != "Go" {
		t.Errorf("expected [Go, TypeScript, SQLite], got %v", loaded.Skills)
	}
	if len(loaded.PreferredRoles) != 2 {
		t.Errorf("expected 2 preferred roles, got %d", len(loaded.PreferredRoles))
	}
	if len(loaded.TargetIndustries) != 2 {
		t.Errorf("expected 2 target industries, got %d", len(loaded.TargetIndustries))
	}
	if len(loaded.DealBreakers) != 1 {
		t.Errorf("expected 1 deal breaker, got %d", len(loaded.DealBreakers))
	}
	if loaded.UpdatedAt == "" {
		t.Error("expected updatedAt to be set")
	}
}

func TestUserProfileRepository_Update(t *testing.T) {
	repo, cleanup := setupProfileTestDB(t)
	defer cleanup()

	repo.Save(model.UserProfile{Name: "V1", Skills: []string{"Go"}})
	repo.Save(model.UserProfile{Name: "V2", Skills: []string{"Go", "Rust"}})

	loaded, _ := repo.Get()
	if loaded.Name != "V2" {
		t.Errorf("expected V2 after update, got %s", loaded.Name)
	}
	if len(loaded.Skills) != 2 {
		t.Errorf("expected 2 skills after update, got %d", len(loaded.Skills))
	}
}
