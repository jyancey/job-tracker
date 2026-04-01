package repository

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/john/job-tracker-api/internal/database"
	"github.com/john/job-tracker-api/internal/model"
)

func setupTestDB(t *testing.T) (*JobRepository, func()) {
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

	repo := NewJobRepository(db)
	cleanup := func() {
		db.Close()
		os.Remove(dbPath)
	}
	return repo, cleanup
}

func makeTestJob(id string) model.Job {
	return model.Job{
		ID:              id,
		Company:         "Acme Corp",
		RoleTitle:       "Software Engineer",
		ApplicationDate: "2026-01-15T00:00:00.000Z",
		Status:          "Applied",
		JobURL:          "https://example.com/job",
		AtsURL:          "",
		SalaryRange:     "$120k-$150k",
		Notes:           "Great opportunity",
		ContactPerson:   "Jane Doe",
		NextAction:      "Follow up",
		NextActionDueDate: "2026-02-01T00:00:00.000Z",
		Priority:        "High",
		CreatedAt:       "2026-01-15T10:00:00.000Z",
		UpdatedAt:       "2026-01-15T10:00:00.000Z",
	}
}

func TestJobRepository_ListEmpty(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	jobs, err := repo.List()
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(jobs) != 0 {
		t.Fatalf("expected 0 jobs, got %d", len(jobs))
	}
}

func TestJobRepository_ReplaceAllAndList(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	jobs := []model.Job{
		makeTestJob("job-1"),
		makeTestJob("job-2"),
	}
	jobs[1].ApplicationDate = "2026-02-01T00:00:00.000Z"

	if err := repo.ReplaceAll(jobs); err != nil {
		t.Fatalf("replace all: %v", err)
	}

	listed, err := repo.List()
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(listed) != 2 {
		t.Fatalf("expected 2 jobs, got %d", len(listed))
	}
	// Should be ordered by applicationDate DESC
	if listed[0].ID != "job-2" {
		t.Errorf("expected job-2 first (later date), got %s", listed[0].ID)
	}
}

func TestJobRepository_ReplaceAllClearsPrevious(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	if err := repo.ReplaceAll([]model.Job{makeTestJob("old-1")}); err != nil {
		t.Fatalf("first replace: %v", err)
	}
	if err := repo.ReplaceAll([]model.Job{makeTestJob("new-1")}); err != nil {
		t.Fatalf("second replace: %v", err)
	}

	jobs, _ := repo.List()
	if len(jobs) != 1 {
		t.Fatalf("expected 1 job after replace, got %d", len(jobs))
	}
	if jobs[0].ID != "new-1" {
		t.Errorf("expected new-1, got %s", jobs[0].ID)
	}
}

func TestJobRepository_GetByID(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	repo.ReplaceAll([]model.Job{makeTestJob("find-me")})

	job, err := repo.GetByID("find-me")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if job == nil {
		t.Fatal("expected job, got nil")
	}
	if job.Company != "Acme Corp" {
		t.Errorf("expected Acme Corp, got %s", job.Company)
	}

	// Not found
	missing, err := repo.GetByID("nope")
	if err != nil {
		t.Fatalf("get missing: %v", err)
	}
	if missing != nil {
		t.Fatal("expected nil for missing job")
	}
}

func TestJobRepository_Create(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	draft := model.JobDraft{
		Company:         "New Co",
		RoleTitle:       "Backend Dev",
		ApplicationDate: "2026-03-01T00:00:00.000Z",
		Status:          "Applied",
		JobURL:          "",
		AtsURL:          "",
		SalaryRange:     "",
		Notes:           "",
		ContactPerson:   "",
		NextAction:      "",
		NextActionDueDate: "",
	}
	job, err := repo.Create(draft)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if job.ID == "" {
		t.Error("expected generated ID")
	}
	if job.Company != "New Co" {
		t.Errorf("expected New Co, got %s", job.Company)
	}
	if job.CreatedAt == "" || job.UpdatedAt == "" {
		t.Error("expected timestamps to be set")
	}
	if job.Priority != "Medium" {
		t.Errorf("expected default priority Medium, got %s", job.Priority)
	}
}

func TestJobRepository_Update(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	repo.ReplaceAll([]model.Job{makeTestJob("upd-1")})

	updated, err := repo.Update("upd-1", map[string]interface{}{
		"company":   "Updated Corp",
		"status":    "Interview",
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated == nil {
		t.Fatal("expected job, got nil")
	}
	if updated.Company != "Updated Corp" {
		t.Errorf("expected Updated Corp, got %s", updated.Company)
	}
	if updated.Status != "Interview" {
		t.Errorf("expected Interview, got %s", updated.Status)
	}
	// Other fields unchanged
	if updated.RoleTitle != "Software Engineer" {
		t.Errorf("roleTitle should be unchanged, got %s", updated.RoleTitle)
	}

	// Update non-existent
	notFound, err := repo.Update("nope", map[string]interface{}{"company": "X"})
	if err != nil {
		t.Fatalf("update missing: %v", err)
	}
	if notFound != nil {
		t.Fatal("expected nil for missing job")
	}
}

func TestJobRepository_Delete(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	repo.ReplaceAll([]model.Job{makeTestJob("del-1"), makeTestJob("del-2")})

	deleted, err := repo.Delete("del-1")
	if err != nil {
		t.Fatalf("delete: %v", err)
	}
	if !deleted {
		t.Error("expected deleted=true")
	}

	jobs, _ := repo.List()
	if len(jobs) != 1 {
		t.Fatalf("expected 1 remaining, got %d", len(jobs))
	}

	// Delete non-existent
	deleted, _ = repo.Delete("nope")
	if deleted {
		t.Error("expected deleted=false for missing job")
	}
}

func TestJobRepository_DeleteBulk(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	repo.ReplaceAll([]model.Job{
		makeTestJob("b-1"),
		makeTestJob("b-2"),
		makeTestJob("b-3"),
	})

	count, err := repo.DeleteBulk([]string{"b-1", "b-3"})
	if err != nil {
		t.Fatalf("bulk delete: %v", err)
	}
	if count != 2 {
		t.Errorf("expected 2 deleted, got %d", count)
	}

	jobs, _ := repo.List()
	if len(jobs) != 1 || jobs[0].ID != "b-2" {
		t.Error("expected only b-2 remaining")
	}
}

func TestJobRepository_AIScoringInProgressRoundTrip(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	trueVal := true
	job := makeTestJob("ai-test")
	job.AIScoringInProgress = &trueVal

	repo.ReplaceAll([]model.Job{job})

	fetched, _ := repo.GetByID("ai-test")
	if fetched.AIScoringInProgress == nil || !*fetched.AIScoringInProgress {
		t.Error("expected aiScoringInProgress=true after round-trip")
	}
}

func TestJobRepository_ScoreFieldsRoundTrip(t *testing.T) {
	repo, cleanup := setupTestDB(t)
	defer cleanup()

	fit := 4.5
	job := makeTestJob("score-test")
	job.ScoreFit = &fit

	repo.ReplaceAll([]model.Job{job})

	fetched, _ := repo.GetByID("score-test")
	if fetched.ScoreFit == nil || *fetched.ScoreFit != 4.5 {
		t.Error("expected scoreFit=4.5 after round-trip")
	}
	if fetched.ScoreCompensation != nil {
		t.Error("expected nil scoreCompensation")
	}
}
