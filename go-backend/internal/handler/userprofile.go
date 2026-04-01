package handler

import (
	"encoding/json"
	"net/http"

	"github.com/john/job-tracker-api/internal/model"
	"github.com/john/job-tracker-api/internal/repository"
)

// UserProfileHandler holds HTTP handlers for user profile endpoints.
type UserProfileHandler struct {
	repo *repository.UserProfileRepository
}

// NewUserProfileHandler creates a new UserProfileHandler.
func NewUserProfileHandler(repo *repository.UserProfileRepository) *UserProfileHandler {
	return &UserProfileHandler{repo: repo}
}

// Get handles GET /api/v1/profile
func (h *UserProfileHandler) Get(w http.ResponseWriter, r *http.Request) {
	profile, err := h.repo.Get()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"profile": profile})
}

// Save handles POST /api/v1/profile and PUT /api/v1/profile
func (h *UserProfileHandler) Save(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Profile model.UserProfile `json:"profile"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if err := h.repo.Save(body.Profile); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}
