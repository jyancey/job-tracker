package model

// UserProfile holds user profile information for AI scoring personalization.
type UserProfile struct {
	Name                 string   `json:"name,omitempty"`
	CurrentRole          string   `json:"currentRole,omitempty"`
	YearsExperience      *int     `json:"yearsExperience,omitempty"`
	Skills               []string `json:"skills,omitempty"`
	PreferredRoles       []string `json:"preferredRoles,omitempty"`
	PreferredCompanySize string   `json:"preferredCompanySize,omitempty"`
	PreferredLocation    string   `json:"preferredLocation,omitempty"`
	SalaryExpectation    string   `json:"salaryExpectation,omitempty"`
	TargetIndustries     []string `json:"targetIndustries,omitempty"`
	CareerGoals          string   `json:"careerGoals,omitempty"`
	DealBreakers         []string `json:"dealBreakers,omitempty"`
	ResumeText           string   `json:"resumeText,omitempty"`
	UpdatedAt            string   `json:"updatedAt,omitempty"`
}
