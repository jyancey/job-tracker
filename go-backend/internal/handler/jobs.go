package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/john/job-tracker-api/internal/model"
	"github.com/john/job-tracker-api/internal/repository"
)

// JobHandler holds HTTP handlers for job endpoints.
type JobHandler struct {
	repo *repository.JobRepository
}

// NewJobHandler creates a new JobHandler.
func NewJobHandler(repo *repository.JobRepository) *JobHandler {
	return &JobHandler{repo: repo}
}

// List handles GET /api/v1/jobs
func (h *JobHandler) List(w http.ResponseWriter, r *http.Request) {
	jobs, err := h.repo.List()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"jobs": jobs})
}

// GetByID handles GET /api/v1/jobs/{id}
func (h *JobHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	job, err := h.repo.GetByID(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if job == nil {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"job": job})
}

// Create handles POST /api/v1/jobs
func (h *JobHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Job model.JobDraft `json:"job"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	result := model.ValidateJobDraft(body.Job)
	if !result.Valid {
		writeJSON(w, http.StatusUnprocessableEntity, map[string]interface{}{
			"error":   result.Error,
			"code":    "VALIDATION_ERROR",
			"details": result.Details,
		})
		return
	}

	job, err := h.repo.Create(body.Job)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"job": job})
}

// Update handles PATCH /api/v1/jobs/{id}
func (h *JobHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var body struct {
		Job map[string]interface{} `json:"job"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if body.Job == nil {
		writeError(w, http.StatusBadRequest, "missing 'job' field")
		return
	}

	job, err := h.repo.Update(id, body.Job)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if job == nil {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"job": job})
}

// Delete handles DELETE /api/v1/jobs/{id}
func (h *JobHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	deleted, err := h.repo.Delete(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if !deleted {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// DeleteBulk handles DELETE /api/v1/jobs
func (h *JobHandler) DeleteBulk(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDs []string `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if len(body.IDs) == 0 {
		writeError(w, http.StatusBadRequest, "ids must be a non-empty array")
		return
	}

	count, err := h.repo.DeleteBulk(body.IDs)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "count": count})
}

// ReplaceAll handles PUT /api/v1/jobs (legacy full-replace)
func (h *JobHandler) ReplaceAll(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Jobs []model.Job `json:"jobs"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	jobs := body.Jobs
	if jobs == nil {
		jobs = []model.Job{}
	}

	result := model.ValidateJobArray(jobs)
	if !result.Valid {
		writeJSON(w, http.StatusUnprocessableEntity, map[string]interface{}{
			"error": result.Error,
		})
		return
	}

	if err := h.repo.ReplaceAll(jobs); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "count": len(jobs)})
}
