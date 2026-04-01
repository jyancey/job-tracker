package model

import (
	"fmt"
	"strings"
	"time"
)

// ValidationError holds field-level validation details.
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationResult holds the result of a validation check.
type ValidationResult struct {
	Valid   bool              `json:"valid"`
	Error   string            `json:"error,omitempty"`
	Details []ValidationError `json:"details,omitempty"`
}

var requiredFields = []string{
	"id", "company", "roleTitle", "applicationDate", "status",
	"jobUrl", "atsUrl", "salaryRange", "notes", "contactPerson",
	"nextAction", "nextActionDueDate", "createdAt", "updatedAt",
}

func isValidISODate(s string) bool {
	if s == "" {
		return false
	}
	// Try full ISO 8601 formats
	for _, layout := range []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05.000Z",
		"2006-01-02",
	} {
		if _, err := time.Parse(layout, s); err == nil {
			return true
		}
	}
	return false
}

// ValidateJob validates a single Job for required fields, types, and values.
func ValidateJob(job Job) ValidationResult {
	if strings.TrimSpace(job.ID) == "" {
		return ValidationResult{Valid: false, Error: "id must be a non-empty string"}
	}
	if !IsValidStatus(job.Status) {
		statusNames := make([]string, len(ValidStatuses))
		for i, s := range ValidStatuses {
			statusNames[i] = string(s)
		}
		return ValidationResult{
			Valid: false,
			Error: fmt.Sprintf("status must be one of: %s", strings.Join(statusNames, ", ")),
		}
	}
	if !isValidISODate(job.ApplicationDate) {
		return ValidationResult{Valid: false, Error: "applicationDate must be a valid ISO 8601 date"}
	}
	if !isValidISODate(job.CreatedAt) {
		return ValidationResult{Valid: false, Error: "createdAt must be a valid ISO 8601 date"}
	}
	if !isValidISODate(job.UpdatedAt) {
		return ValidationResult{Valid: false, Error: "updatedAt must be a valid ISO 8601 date"}
	}
	if job.NextActionDueDate != "" && !isValidISODate(job.NextActionDueDate) {
		return ValidationResult{Valid: false, Error: "nextActionDueDate must be a valid ISO 8601 date or empty string"}
	}
	return ValidationResult{Valid: true}
}

// ValidateJobArray validates a slice of Jobs.
func ValidateJobArray(jobs []Job) ValidationResult {
	for i, job := range jobs {
		result := ValidateJob(job)
		if !result.Valid {
			return ValidationResult{
				Valid: false,
				Error: fmt.Sprintf("Job at index %d: %s", i, result.Error),
			}
		}
	}
	return ValidationResult{Valid: true}
}

// ValidateJobDraft validates a JobDraft for creating a new job.
func ValidateJobDraft(draft JobDraft) ValidationResult {
	var details []ValidationError

	if strings.TrimSpace(draft.Company) == "" {
		details = append(details, ValidationError{Field: "company", Message: "must be a non-empty string"})
	}
	if strings.TrimSpace(draft.RoleTitle) == "" {
		details = append(details, ValidationError{Field: "roleTitle", Message: "must be a non-empty string"})
	}
	if !IsValidStatus(draft.Status) {
		statusNames := make([]string, len(ValidStatuses))
		for i, s := range ValidStatuses {
			statusNames[i] = string(s)
		}
		details = append(details, ValidationError{
			Field:   "status",
			Message: fmt.Sprintf("must be one of: %s", strings.Join(statusNames, ", ")),
		})
	}
	if draft.ApplicationDate != "" && !isValidISODate(draft.ApplicationDate) {
		details = append(details, ValidationError{Field: "applicationDate", Message: "must be a valid ISO 8601 date"})
	}

	if len(details) > 0 {
		return ValidationResult{
			Valid:   false,
			Error:   "Validation failed",
			Details: details,
		}
	}
	return ValidationResult{Valid: true}
}
