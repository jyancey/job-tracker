package handler

import (
	"database/sql"
	"net/http"
	"os"

	"github.com/john/job-tracker-api/internal/database"
)

// DatabaseHandler holds HTTP handlers for database admin endpoints.
type DatabaseHandler struct {
	db     *sql.DB
	dbPath string
}

// NewDatabaseHandler creates a new DatabaseHandler.
func NewDatabaseHandler(db *sql.DB, dbPath string) *DatabaseHandler {
	return &DatabaseHandler{db: db, dbPath: dbPath}
}

// Info handles GET /api/v1/database/info
func (h *DatabaseHandler) Info(w http.ResponseWriter, r *http.Request) {
	_, err := os.Stat(h.dbPath)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"provider": "sqlite",
		"dbPath":   h.dbPath,
		"exists":   err == nil,
	})
}

// Create handles POST /api/v1/database/create
func (h *DatabaseHandler) Create(w http.ResponseWriter, r *http.Request) {
	_, statErr := os.Stat(h.dbPath)
	existedBefore := statErr == nil

	if err := database.EnsureAllSchema(h.db); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	_, statErr = os.Stat(h.dbPath)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"created": !existedBefore,
		"dbPath":  h.dbPath,
		"exists":  statErr == nil,
	})
}

// Test handles GET /api/v1/database/test
func (h *DatabaseHandler) Test(w http.ResponseWriter, r *http.Request) {
	var ok int
	err := h.db.QueryRow("SELECT 1 AS ok").Scan(&ok)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":     err == nil && ok == 1,
		"dbPath": h.dbPath,
	})
}

// Health handles GET /api/v1/health
func (h *DatabaseHandler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"status": "ok"})
}
