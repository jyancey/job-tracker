package model

import "time"

// JobStatus represents a stage in the hiring pipeline.
type JobStatus string

const (
	StatusApplied     JobStatus = "Applied"
	StatusPhoneScreen JobStatus = "Phone Screen"
	StatusInterview   JobStatus = "Interview"
	StatusOffer       JobStatus = "Offer"
	StatusRejected    JobStatus = "Rejected"
	StatusWithdrawn   JobStatus = "Withdrawn"
)

var ValidStatuses = []JobStatus{
	StatusApplied,
	StatusPhoneScreen,
	StatusInterview,
	StatusOffer,
	StatusRejected,
	StatusWithdrawn,
}

func IsValidStatus(s string) bool {
	for _, v := range ValidStatuses {
		if string(v) == s {
			return true
		}
	}
	return false
}

// JobPriority represents a priority level.
type JobPriority string

const (
	PriorityHigh   JobPriority = "High"
	PriorityMedium JobPriority = "Medium"
	PriorityLow    JobPriority = "Low"
)

// Job represents a tracked job opportunity.
type Job struct {
	ID                   string   `json:"id"`
	Company              string   `json:"company"`
	RoleTitle            string   `json:"roleTitle"`
	ApplicationDate      string   `json:"applicationDate"`
	Status               string   `json:"status"`
	JobURL               string   `json:"jobUrl"`
	AtsURL               string   `json:"atsUrl"`
	SalaryRange          string   `json:"salaryRange"`
	Notes                string   `json:"notes"`
	ContactPerson        string   `json:"contactPerson"`
	NextAction           string   `json:"nextAction"`
	NextActionDueDate    string   `json:"nextActionDueDate"`
	Priority             string   `json:"priority,omitempty"`
	CreatedAt            string   `json:"createdAt"`
	UpdatedAt            string   `json:"updatedAt"`
	JobDescription       string   `json:"jobDescription,omitempty"`
	JobDescriptionSource string   `json:"jobDescriptionSource,omitempty"`
	ScoreFit             *float64 `json:"scoreFit,omitempty"`
	ScoreCompensation    *float64 `json:"scoreCompensation,omitempty"`
	ScoreLocation        *float64 `json:"scoreLocation,omitempty"`
	ScoreGrowth          *float64 `json:"scoreGrowth,omitempty"`
	ScoreConfidence      *float64 `json:"scoreConfidence,omitempty"`
	AIScoredAt           string   `json:"aiScoredAt,omitempty"`
	AIModel              string   `json:"aiModel,omitempty"`
	AIReasoning          string   `json:"aiReasoning,omitempty"`
	AIScoringInProgress  *bool    `json:"aiScoringInProgress,omitempty"`
}

// JobDraft is used when creating a new job (no id/createdAt/updatedAt).
type JobDraft struct {
	Company              string   `json:"company"`
	RoleTitle            string   `json:"roleTitle"`
	ApplicationDate      string   `json:"applicationDate"`
	Status               string   `json:"status"`
	JobURL               string   `json:"jobUrl"`
	AtsURL               string   `json:"atsUrl"`
	SalaryRange          string   `json:"salaryRange"`
	Notes                string   `json:"notes"`
	ContactPerson        string   `json:"contactPerson"`
	NextAction           string   `json:"nextAction"`
	NextActionDueDate    string   `json:"nextActionDueDate"`
	Priority             string   `json:"priority,omitempty"`
	JobDescription       string   `json:"jobDescription,omitempty"`
	JobDescriptionSource string   `json:"jobDescriptionSource,omitempty"`
	ScoreFit             *float64 `json:"scoreFit,omitempty"`
	ScoreCompensation    *float64 `json:"scoreCompensation,omitempty"`
	ScoreLocation        *float64 `json:"scoreLocation,omitempty"`
	ScoreGrowth          *float64 `json:"scoreGrowth,omitempty"`
	ScoreConfidence      *float64 `json:"scoreConfidence,omitempty"`
	AIScoredAt           string   `json:"aiScoredAt,omitempty"`
	AIModel              string   `json:"aiModel,omitempty"`
	AIReasoning          string   `json:"aiReasoning,omitempty"`
	AIScoringInProgress  *bool    `json:"aiScoringInProgress,omitempty"`
}

// JobFromDraft creates a full Job from a JobDraft, generating id and timestamps.
func JobFromDraft(draft JobDraft, id string) Job {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	priority := draft.Priority
	if priority == "" {
		priority = string(PriorityMedium)
	}
	return Job{
		ID:                   id,
		Company:              draft.Company,
		RoleTitle:            draft.RoleTitle,
		ApplicationDate:      draft.ApplicationDate,
		Status:               draft.Status,
		JobURL:               draft.JobURL,
		AtsURL:               draft.AtsURL,
		SalaryRange:          draft.SalaryRange,
		Notes:                draft.Notes,
		ContactPerson:        draft.ContactPerson,
		NextAction:           draft.NextAction,
		NextActionDueDate:    draft.NextActionDueDate,
		Priority:             priority,
		CreatedAt:            now,
		UpdatedAt:            now,
		JobDescription:       draft.JobDescription,
		JobDescriptionSource: draft.JobDescriptionSource,
		ScoreFit:             draft.ScoreFit,
		ScoreCompensation:    draft.ScoreCompensation,
		ScoreLocation:        draft.ScoreLocation,
		ScoreGrowth:          draft.ScoreGrowth,
		ScoreConfidence:      draft.ScoreConfidence,
		AIScoredAt:           draft.AIScoredAt,
		AIModel:              draft.AIModel,
		AIReasoning:          draft.AIReasoning,
		AIScoringInProgress:  draft.AIScoringInProgress,
	}
}
