package handler

import (
	"encoding/json"
	"net/http"

	"github.com/john/job-tracker-api/internal/model"
	"github.com/john/job-tracker-api/internal/repository"
)

// AIConfigHandler holds HTTP handlers for AI config endpoints.
type AIConfigHandler struct {
	repo *repository.AIConfigRepository
}

// NewAIConfigHandler creates a new AIConfigHandler.
func NewAIConfigHandler(repo *repository.AIConfigRepository) *AIConfigHandler {
	return &AIConfigHandler{repo: repo}
}

// Get handles GET /api/v1/config
func (h *AIConfigHandler) Get(w http.ResponseWriter, r *http.Request) {
	cfg, err := h.repo.Get()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"config": cfg})
}

// Save handles POST /api/v1/config and PUT /api/v1/config
func (h *AIConfigHandler) Save(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Config model.AIConfig `json:"config"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if err := h.repo.Save(body.Config); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}
