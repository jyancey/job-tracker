package handler

import (
	"encoding/json"
	"net/http"
)

// writeJSON marshals data to JSON and writes it to the response.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// writeError writes a JSON error response.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]interface{}{"error": message})
}
