package handler

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/john/job-tracker-api/internal/database"
	"github.com/john/job-tracker-api/internal/model"
	"github.com/john/job-tracker-api/internal/repository"
)

func setupJobHandler(t *testing.T) (*JobHandler, func()) {
	t.Helper()
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.sqlite")

	db, err := database.Open(dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	database.EnsureAllSchema(db)

	repo := repository.NewJobRepository(db)
	h := NewJobHandler(repo)
	return h, func() { db.Close() }
}

func makeJob() model.Job {
	return model.Job{
		ID:              "test-1",
		Company:         "Test Co",
		RoleTitle:       "Engineer",
		ApplicationDate: "2026-01-15T00:00:00.000Z",
		Status:          "Applied",
		JobURL:          "",
		AtsURL:          "",
		SalaryRange:     "",
		Notes:           "",
		ContactPerson:   "",
		NextAction:      "",
		NextActionDueDate: "",
		CreatedAt:       "2026-01-15T10:00:00.000Z",
		UpdatedAt:       "2026-01-15T10:00:00.000Z",
	}
}

func TestJobHandler_ListEmpty(t *testing.T) {
	h, cleanup := setupJobHandler(t)
	defer cleanup()

	req := httptest.NewRequest("GET", "/api/v1/jobs", nil)
	w := httptest.NewRecorder()

	h.List(w, req)

	if w.Code != 200 {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp struct {
		Jobs []model.Job `json:"jobs"`
	}
	json.NewDecoder(w.Body).Decode(&resp)
	if len(resp.Jobs) != 0 {
		t.Errorf("expected 0 jobs, got %d", len(resp.Jobs))
	}
}

func TestJobHandler_ReplaceAllAndList(t *testing.T) {
	h, cleanup := setupJobHandler(t)
	defer cleanup()

	body, _ := json.Marshal(map[string]interface{}{
		"jobs": []model.Job{makeJob()},
	})
	req := httptest.NewRequest("PUT", "/api/v1/jobs", bytes.NewReader(body))
	w := httptest.NewRecorder()
	h.ReplaceAll(w, req)

	if w.Code != 200 {
		t.Fatalf("replace: expected 200, got %d: %s", w.Code, w.Body.String())
	}

	req = httptest.NewRequest("GET", "/api/v1/jobs", nil)
	w = httptest.NewRecorder()
	h.List(w, req)

	var resp struct {
		Jobs []model.Job `json:"jobs"`
	}
	json.NewDecoder(w.Body).Decode(&resp)
	if len(resp.Jobs) != 1 {
		t.Fatalf("expected 1 job, got %d", len(resp.Jobs))
	}
	if resp.Jobs[0].Company != "Test Co" {
		t.Errorf("expected Test Co, got %s", resp.Jobs[0].Company)
	}
}

func TestJobHandler_ReplaceAllValidationError(t *testing.T) {
	h, cleanup := setupJobHandler(t)
	defer cleanup()

	body, _ := json.Marshal(map[string]interface{}{
		"jobs": []map[string]interface{}{
			{"id": "", "status": "Applied"},
		},
	})
	req := httptest.NewRequest("PUT", "/api/v1/jobs", bytes.NewReader(body))
	w := httptest.NewRecorder()
	h.ReplaceAll(w, req)

	if w.Code != 422 {
		t.Fatalf("expected 422, got %d: %s", w.Code, w.Body.String())
	}
}

func TestJobHandler_Create(t *testing.T) {
	h, cleanup := setupJobHandler(t)
	defer cleanup()

	body, _ := json.Marshal(map[string]interface{}{
		"job": model.JobDraft{
			Company:         "New Co",
			RoleTitle:       "Dev",
			ApplicationDate: "2026-03-01T00:00:00.000Z",
			Status:          "Applied",
		},
	})
	req := httptest.NewRequest("POST", "/api/v1/jobs", bytes.NewReader(body))
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != 201 {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Job model.Job `json:"job"`
	}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp.Job.ID == "" {
		t.Error("expected generated ID")
	}
	if resp.Job.Company != "New Co" {
		t.Errorf("expected New Co, got %s", resp.Job.Company)
	}
}

func TestJobHandler_CreateValidationError(t *testing.T) {
	h, cleanup := setupJobHandler(t)
	defer cleanup()

	body, _ := json.Marshal(map[string]interface{}{
		"job": model.JobDraft{Status: "BadStatus"},
	})
	req := httptest.NewRequest("POST", "/api/v1/jobs", bytes.NewReader(body))
	w := httptest.NewRecorder()
	h.Create(w, req)

	if w.Code != 422 {
		t.Fatalf("expected 422, got %d: %s", w.Code, w.Body.String())
	}
}

func TestJobHandler_GetByID(t *testing.T) {
	h, cleanup := setupJobHandler(t)
	defer cleanup()

	// Seed data
	body, _ := json.Marshal(map[string]interface{}{"jobs": []model.Job{makeJob()}})
	req := httptest.NewRequest("PUT", "/api/v1/jobs", bytes.NewReader(body))
	w := httptest.NewRecorder()
	h.ReplaceAll(w, req)

	// Use chi router to properly set URL params
	r := chi.NewRouter()
	r.Get("/api/v1/jobs/{id}", h.GetByID)
	r.ServeHTTP(w, httptest.NewRequest("GET", "/api/v1/jobs/test-1", nil))

	if w.Code != 200 {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestJobHandler_GetByID_NotFound(t *testing.T) {
	h, cleanup := setupJobHandler(t)
	defer cleanup()

	r := chi.NewRouter()
	r.Get("/api/v1/jobs/{id}", h.GetByID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("GET", "/api/v1/jobs/nope", nil))

	if w.Code != 404 {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestJobHandler_Delete(t *testing.T) {
	h, cleanup := setupJobHandler(t)
	defer cleanup()

	// Seed
	body, _ := json.Marshal(map[string]interface{}{"jobs": []model.Job{makeJob()}})
	req := httptest.NewRequest("PUT", "/api/v1/jobs", bytes.NewReader(body))
	w := httptest.NewRecorder()
	h.ReplaceAll(w, req)

	r := chi.NewRouter()
	r.Delete("/api/v1/jobs/{id}", h.Delete)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("DELETE", "/api/v1/jobs/test-1", nil))

	if w.Code != 204 {
		t.Fatalf("expected 204, got %d: %s", w.Code, w.Body.String())
	}
}
