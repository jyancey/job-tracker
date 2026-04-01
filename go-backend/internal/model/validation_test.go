package model

import (
	"testing"
)

func TestValidateJob_Valid(t *testing.T) {
	job := Job{
		ID:              "abc-123",
		Company:         "Acme",
		RoleTitle:       "Engineer",
		ApplicationDate: "2026-01-15T00:00:00.000Z",
		Status:          "Applied",
		JobURL:          "https://example.com",
		AtsURL:          "",
		SalaryRange:     "$100k",
		Notes:           "",
		ContactPerson:   "",
		NextAction:      "",
		NextActionDueDate: "",
		CreatedAt:       "2026-01-15T10:00:00.000Z",
		UpdatedAt:       "2026-01-15T10:00:00.000Z",
	}
	result := ValidateJob(job)
	if !result.Valid {
		t.Fatalf("expected valid, got error: %s", result.Error)
	}
}

func TestValidateJob_EmptyID(t *testing.T) {
	job := Job{ID: "", Status: "Applied"}
	result := ValidateJob(job)
	if result.Valid {
		t.Fatal("expected invalid for empty id")
	}
	if result.Error != "id must be a non-empty string" {
		t.Fatalf("unexpected error: %s", result.Error)
	}
}

func TestValidateJob_InvalidStatus(t *testing.T) {
	job := Job{
		ID:              "x",
		Status:          "NotAStatus",
		ApplicationDate: "2026-01-15T00:00:00.000Z",
		CreatedAt:       "2026-01-15T00:00:00.000Z",
		UpdatedAt:       "2026-01-15T00:00:00.000Z",
	}
	result := ValidateJob(job)
	if result.Valid {
		t.Fatal("expected invalid for bad status")
	}
}

func TestValidateJob_InvalidDates(t *testing.T) {
	job := Job{
		ID:              "x",
		Status:          "Applied",
		ApplicationDate: "not-a-date",
		CreatedAt:       "2026-01-15T00:00:00.000Z",
		UpdatedAt:       "2026-01-15T00:00:00.000Z",
	}
	result := ValidateJob(job)
	if result.Valid {
		t.Fatal("expected invalid for bad applicationDate")
	}
}

func TestValidateJob_OptionalNextActionDueDate(t *testing.T) {
	job := Job{
		ID:                "x",
		Status:            "Applied",
		ApplicationDate:   "2026-01-15T00:00:00.000Z",
		CreatedAt:         "2026-01-15T00:00:00.000Z",
		UpdatedAt:         "2026-01-15T00:00:00.000Z",
		NextActionDueDate: "invalid",
	}
	result := ValidateJob(job)
	if result.Valid {
		t.Fatal("expected invalid for bad nextActionDueDate")
	}
}

func TestValidateJobArray_Empty(t *testing.T) {
	result := ValidateJobArray([]Job{})
	if !result.Valid {
		t.Fatalf("expected valid for empty array, got: %s", result.Error)
	}
}

func TestValidateJobArray_WithInvalid(t *testing.T) {
	jobs := []Job{{ID: "", Status: "Applied"}}
	result := ValidateJobArray(jobs)
	if result.Valid {
		t.Fatal("expected invalid")
	}
	if result.Error == "" {
		t.Fatal("expected error message")
	}
}

func TestValidateJobDraft_Valid(t *testing.T) {
	draft := JobDraft{
		Company:         "Acme",
		RoleTitle:       "Engineer",
		Status:          "Applied",
		ApplicationDate: "2026-01-15",
	}
	result := ValidateJobDraft(draft)
	if !result.Valid {
		t.Fatalf("expected valid, got: %s", result.Error)
	}
}

func TestValidateJobDraft_MissingRequired(t *testing.T) {
	draft := JobDraft{Status: "Applied"}
	result := ValidateJobDraft(draft)
	if result.Valid {
		t.Fatal("expected invalid for missing company/roleTitle")
	}
	if len(result.Details) < 2 {
		t.Fatalf("expected at least 2 detail errors, got %d", len(result.Details))
	}
}

func TestIsValidStatus(t *testing.T) {
	for _, s := range ValidStatuses {
		if !IsValidStatus(string(s)) {
			t.Errorf("expected %s to be valid", s)
		}
	}
	if IsValidStatus("Nope") {
		t.Error("expected 'Nope' to be invalid")
	}
}
