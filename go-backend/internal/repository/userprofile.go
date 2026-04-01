package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/john/job-tracker-api/internal/model"
)

// UserProfileRepository handles user profile persistence.
type UserProfileRepository struct {
	db *sql.DB
}

// NewUserProfileRepository creates a new UserProfileRepository.
func NewUserProfileRepository(db *sql.DB) *UserProfileRepository {
	return &UserProfileRepository{db: db}
}

// Get retrieves the default user profile, parsing JSON array fields.
func (r *UserProfileRepository) Get() (model.UserProfile, error) {
	var p model.UserProfile
	var name, currentRole, prefCompSize, prefLoc, salaryExp, careerGoals, resumeText, updatedAt sql.NullString
	var yearsExp sql.NullInt64
	var skillsJSON, prefRolesJSON, targetIndJSON, dealBreakersJSON sql.NullString

	err := r.db.QueryRow(`
		SELECT name, currentRole, yearsExperience, skills, preferredRoles,
		       preferredCompanySize, preferredLocation, salaryExpectation,
		       targetIndustries, careerGoals, dealBreakers, resumeText, updatedAt
		FROM user_profile WHERE id = 'default'
	`).Scan(
		&name, &currentRole, &yearsExp, &skillsJSON, &prefRolesJSON,
		&prefCompSize, &prefLoc, &salaryExp,
		&targetIndJSON, &careerGoals, &dealBreakersJSON, &resumeText, &updatedAt,
	)
	if err == sql.ErrNoRows {
		return model.UserProfile{}, nil
	}
	if err != nil {
		return p, fmt.Errorf("get user profile: %w", err)
	}

	p.Name = nullStrProfile(name)
	p.CurrentRole = nullStrProfile(currentRole)
	if yearsExp.Valid {
		v := int(yearsExp.Int64)
		p.YearsExperience = &v
	}
	p.Skills = parseJSONArray(skillsJSON)
	p.PreferredRoles = parseJSONArray(prefRolesJSON)
	p.PreferredCompanySize = nullStrProfile(prefCompSize)
	p.PreferredLocation = nullStrProfile(prefLoc)
	p.SalaryExpectation = nullStrProfile(salaryExp)
	p.TargetIndustries = parseJSONArray(targetIndJSON)
	p.CareerGoals = nullStrProfile(careerGoals)
	p.DealBreakers = parseJSONArray(dealBreakersJSON)
	p.ResumeText = nullStrProfile(resumeText)
	p.UpdatedAt = nullStrProfile(updatedAt)

	return p, nil
}

// Save inserts or updates the default user profile, serializing JSON array fields.
func (r *UserProfileRepository) Save(p model.UserProfile) error {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	p.UpdatedAt = now

	skillsJSON := serializeJSONArray(p.Skills)
	prefRolesJSON := serializeJSONArray(p.PreferredRoles)
	targetIndJSON := serializeJSONArray(p.TargetIndustries)
	dealBreakersJSON := serializeJSONArray(p.DealBreakers)

	var yearsExp interface{}
	if p.YearsExperience != nil {
		yearsExp = *p.YearsExperience
	}

	var exists bool
	err := r.db.QueryRow("SELECT 1 FROM user_profile WHERE id = 'default'").Scan(&exists)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("check user profile exists: %w", err)
	}

	if err == nil {
		_, err = r.db.Exec(`
			UPDATE user_profile SET
				name = ?, currentRole = ?, yearsExperience = ?, skills = ?,
				preferredRoles = ?, preferredCompanySize = ?, preferredLocation = ?,
				salaryExpectation = ?, targetIndustries = ?, careerGoals = ?,
				dealBreakers = ?, resumeText = ?, updatedAt = ?
			WHERE id = 'default'
		`,
			p.Name, p.CurrentRole, yearsExp, skillsJSON,
			prefRolesJSON, p.PreferredCompanySize, p.PreferredLocation,
			p.SalaryExpectation, targetIndJSON, p.CareerGoals,
			dealBreakersJSON, p.ResumeText, now,
		)
	} else {
		_, err = r.db.Exec(`
			INSERT INTO user_profile (
				id, name, currentRole, yearsExperience, skills, preferredRoles,
				preferredCompanySize, preferredLocation, salaryExpectation,
				targetIndustries, careerGoals, dealBreakers, resumeText,
				updatedAt, createdAt
			) VALUES (
				'default', ?, ?, ?, ?, ?,
				?, ?, ?,
				?, ?, ?, ?,
				?, ?
			)
		`,
			p.Name, p.CurrentRole, yearsExp, skillsJSON,
			prefRolesJSON, p.PreferredCompanySize, p.PreferredLocation,
			p.SalaryExpectation, targetIndJSON, p.CareerGoals,
			dealBreakersJSON, p.ResumeText, now, now,
		)
	}
	if err != nil {
		return fmt.Errorf("save user profile: %w", err)
	}
	return nil
}

func nullStrProfile(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

// parseJSONArray parses a JSON string column into a string slice.
// Returns empty slice on parse failure (matches TypeScript behavior).
func parseJSONArray(ns sql.NullString) []string {
	if !ns.Valid || ns.String == "" {
		return []string{}
	}
	var arr []string
	if err := json.Unmarshal([]byte(ns.String), &arr); err != nil {
		return []string{}
	}
	return arr
}

// serializeJSONArray converts a string slice to a JSON string for storage.
func serializeJSONArray(arr []string) string {
	if arr == nil {
		arr = []string{}
	}
	b, _ := json.Marshal(arr)
	return string(b)
}
