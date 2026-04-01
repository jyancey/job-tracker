package database

import (
	"database/sql"
	"fmt"
	"log/slog"
)

// columnMigration represents a single ALTER TABLE ADD COLUMN migration.
type columnMigration struct {
	Name string
	SQL  string
}

var jobColumnMigrations = []columnMigration{
	{Name: "scoreFit", SQL: "ALTER TABLE jobs ADD COLUMN scoreFit REAL"},
	{Name: "scoreCompensation", SQL: "ALTER TABLE jobs ADD COLUMN scoreCompensation REAL"},
	{Name: "scoreLocation", SQL: "ALTER TABLE jobs ADD COLUMN scoreLocation REAL"},
	{Name: "scoreGrowth", SQL: "ALTER TABLE jobs ADD COLUMN scoreGrowth REAL"},
	{Name: "scoreConfidence", SQL: "ALTER TABLE jobs ADD COLUMN scoreConfidence REAL"},
	{Name: "jobDescription", SQL: "ALTER TABLE jobs ADD COLUMN jobDescription TEXT"},
	{Name: "jobDescriptionSource", SQL: "ALTER TABLE jobs ADD COLUMN jobDescriptionSource TEXT"},
	{Name: "aiScoredAt", SQL: "ALTER TABLE jobs ADD COLUMN aiScoredAt TEXT"},
	{Name: "aiModel", SQL: "ALTER TABLE jobs ADD COLUMN aiModel TEXT"},
	{Name: "aiReasoning", SQL: "ALTER TABLE jobs ADD COLUMN aiReasoning TEXT"},
	{Name: "priority", SQL: "ALTER TABLE jobs ADD COLUMN priority TEXT"},
	{Name: "aiScoringInProgress", SQL: "ALTER TABLE jobs ADD COLUMN aiScoringInProgress INTEGER"},
}

// getColumnNames returns the set of column names for a given table.
func getColumnNames(db *sql.DB, tableName string) (map[string]bool, error) {
	rows, err := db.Query(fmt.Sprintf("PRAGMA table_info(%s)", tableName))
	if err != nil {
		return nil, fmt.Errorf("pragma table_info(%s): %w", tableName, err)
	}
	defer rows.Close()

	columns := make(map[string]bool)
	for rows.Next() {
		var cid int
		var name, colType string
		var notNull int
		var dfltValue sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk); err != nil {
			return nil, fmt.Errorf("scan column info: %w", err)
		}
		columns[name] = true
	}
	return columns, rows.Err()
}

// EnsureJobsSchema creates the jobs table and runs column migrations.
func EnsureJobsSchema(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS jobs (
			id TEXT PRIMARY KEY,
			company TEXT NOT NULL,
			roleTitle TEXT NOT NULL,
			applicationDate TEXT NOT NULL,
			status TEXT NOT NULL,
			jobUrl TEXT NOT NULL,
			atsUrl TEXT NOT NULL,
			salaryRange TEXT NOT NULL,
			notes TEXT NOT NULL,
			contactPerson TEXT NOT NULL,
			nextAction TEXT NOT NULL,
			nextActionDueDate TEXT NOT NULL,
			priority TEXT,
			createdAt TEXT NOT NULL,
			updatedAt TEXT NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("create jobs table: %w", err)
	}

	columns, err := getColumnNames(db, "jobs")
	if err != nil {
		return err
	}

	for _, m := range jobColumnMigrations {
		if !columns[m.Name] {
			if _, err := db.Exec(m.SQL); err != nil {
				return fmt.Errorf("migrate column %s: %w", m.Name, err)
			}
			slog.Info("migrated column", "table", "jobs", "column", m.Name)
		}
	}

	return nil
}

// EnsureUserProfileSchema creates the user_profile table.
func EnsureUserProfileSchema(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS user_profile (
			id TEXT PRIMARY KEY DEFAULT 'default',
			name TEXT,
			currentRole TEXT,
			yearsExperience INTEGER,
			skills TEXT,
			preferredRoles TEXT,
			preferredCompanySize TEXT,
			preferredLocation TEXT,
			salaryExpectation TEXT,
			targetIndustries TEXT,
			careerGoals TEXT,
			dealBreakers TEXT,
			resumeText TEXT,
			updatedAt TEXT NOT NULL,
			createdAt TEXT NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("create user_profile table: %w", err)
	}
	return nil
}

// EnsureAIConfigSchema creates the ai_config table.
func EnsureAIConfigSchema(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS ai_config (
			id TEXT PRIMARY KEY DEFAULT 'default',
			provider TEXT NOT NULL,
			apiKey TEXT,
			baseUrl TEXT,
			model TEXT,
			updatedAt TEXT NOT NULL,
			createdAt TEXT NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("create ai_config table: %w", err)
	}
	return nil
}

// EnsureAllSchema creates all tables and runs all migrations.
func EnsureAllSchema(db *sql.DB) error {
	if err := EnsureJobsSchema(db); err != nil {
		return err
	}
	if err := EnsureUserProfileSchema(db); err != nil {
		return err
	}
	if err := EnsureAIConfigSchema(db); err != nil {
		return err
	}
	return nil
}
