package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/john/job-tracker-api/internal/model"
)

// JobRepository handles job persistence in SQLite.
type JobRepository struct {
	db *sql.DB
}

// NewJobRepository creates a new JobRepository.
func NewJobRepository(db *sql.DB) *JobRepository {
	return &JobRepository{db: db}
}

// jobColumns is the canonical column list matching the TypeScript JOB_COLUMNS.
var jobColumns = []string{
	"id", "company", "roleTitle", "applicationDate", "status",
	"jobUrl", "atsUrl", "salaryRange", "notes", "contactPerson",
	"nextAction", "nextActionDueDate", "priority", "createdAt", "updatedAt",
	"jobDescription", "jobDescriptionSource",
	"scoreFit", "scoreCompensation", "scoreLocation", "scoreGrowth", "scoreConfidence",
	"aiScoredAt", "aiModel", "aiReasoning", "aiScoringInProgress",
}

// scanJob scans a row into a model.Job, handling nullable columns
// and the boolean-to-integer conversion for aiScoringInProgress.
func scanJob(scanner interface{ Scan(dest ...any) error }) (model.Job, error) {
	var j model.Job
	var priority, jobDesc, jobDescSrc, aiScoredAt, aiModel, aiReasoning sql.NullString
	var scoreFit, scoreComp, scoreLoc, scoreGrowth, scoreConf sql.NullFloat64
	var aiScoringInProgress sql.NullInt64

	err := scanner.Scan(
		&j.ID, &j.Company, &j.RoleTitle, &j.ApplicationDate, &j.Status,
		&j.JobURL, &j.AtsURL, &j.SalaryRange, &j.Notes, &j.ContactPerson,
		&j.NextAction, &j.NextActionDueDate, &priority, &j.CreatedAt, &j.UpdatedAt,
		&jobDesc, &jobDescSrc,
		&scoreFit, &scoreComp, &scoreLoc, &scoreGrowth, &scoreConf,
		&aiScoredAt, &aiModel, &aiReasoning, &aiScoringInProgress,
	)
	if err != nil {
		return j, err
	}

	j.Priority = nullStr(priority)
	j.JobDescription = nullStr(jobDesc)
	j.JobDescriptionSource = nullStr(jobDescSrc)
	j.AIScoredAt = nullStr(aiScoredAt)
	j.AIModel = nullStr(aiModel)
	j.AIReasoning = nullStr(aiReasoning)
	j.ScoreFit = nullFloat(scoreFit)
	j.ScoreCompensation = nullFloat(scoreComp)
	j.ScoreLocation = nullFloat(scoreLoc)
	j.ScoreGrowth = nullFloat(scoreGrowth)
	j.ScoreConfidence = nullFloat(scoreConf)

	// Hydrate boolean from integer (matches TypeScript hydrateJob).
	if aiScoringInProgress.Valid {
		v := aiScoringInProgress.Int64 != 0
		j.AIScoringInProgress = &v
	}

	return j, nil
}

func nullStr(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

func nullFloat(nf sql.NullFloat64) *float64 {
	if nf.Valid {
		v := nf.Float64
		return &v
	}
	return nil
}

// List returns all jobs ordered by applicationDate DESC.
func (r *JobRepository) List() ([]model.Job, error) {
	query := fmt.Sprintf("SELECT %s FROM jobs ORDER BY applicationDate DESC", strings.Join(jobColumns, ", "))
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("list jobs: %w", err)
	}
	defer rows.Close()

	var jobs []model.Job
	for rows.Next() {
		j, err := scanJob(rows)
		if err != nil {
			return nil, fmt.Errorf("scan job: %w", err)
		}
		jobs = append(jobs, j)
	}
	if jobs == nil {
		jobs = []model.Job{}
	}
	return jobs, rows.Err()
}

// GetByID returns a single job by ID.
func (r *JobRepository) GetByID(id string) (*model.Job, error) {
	query := fmt.Sprintf("SELECT %s FROM jobs WHERE id = ?", strings.Join(jobColumns, ", "))
	row := r.db.QueryRow(query, id)
	j, err := scanJob(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get job %s: %w", id, err)
	}
	return &j, nil
}

// Create inserts a new job from a draft, generating UUID and timestamps.
func (r *JobRepository) Create(draft model.JobDraft) (*model.Job, error) {
	id := uuid.New().String()
	job := model.JobFromDraft(draft, id)

	if err := r.insertJob(job); err != nil {
		return nil, err
	}
	return &job, nil
}

// Update partially updates a job. Only non-zero fields in the partial map are applied.
func (r *JobRepository) Update(id string, partial map[string]interface{}) (*model.Job, error) {
	existing, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, nil
	}

	setClauses, args := buildUpdateClauses(partial)
	if len(setClauses) == 0 {
		return existing, nil
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)
	setClauses = append(setClauses, "updatedAt = ?")
	args = append(args, now)
	args = append(args, id)

	query := fmt.Sprintf("UPDATE jobs SET %s WHERE id = ?", strings.Join(setClauses, ", "))
	if _, err := r.db.Exec(query, args...); err != nil {
		return nil, fmt.Errorf("update job %s: %w", id, err)
	}

	return r.GetByID(id)
}

// Delete removes a job by ID. Returns true if a row was deleted.
func (r *JobRepository) Delete(id string) (bool, error) {
	result, err := r.db.Exec("DELETE FROM jobs WHERE id = ?", id)
	if err != nil {
		return false, fmt.Errorf("delete job %s: %w", id, err)
	}
	n, _ := result.RowsAffected()
	return n > 0, nil
}

// DeleteBulk removes multiple jobs by ID. Returns count of deleted rows.
func (r *JobRepository) DeleteBulk(ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}

	query := fmt.Sprintf("DELETE FROM jobs WHERE id IN (%s)", strings.Join(placeholders, ", "))
	result, err := r.db.Exec(query, args...)
	if err != nil {
		return 0, fmt.Errorf("bulk delete jobs: %w", err)
	}
	return result.RowsAffected()
}

// ReplaceAll atomically replaces all jobs (DELETE + INSERT in a transaction).
// This matches the existing TypeScript replaceAllJobs behavior.
func (r *JobRepository) ReplaceAll(jobs []model.Job) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM jobs"); err != nil {
		return fmt.Errorf("clear jobs: %w", err)
	}

	stmt, err := tx.Prepare(insertSQL())
	if err != nil {
		return fmt.Errorf("prepare insert: %w", err)
	}
	defer stmt.Close()

	for _, job := range jobs {
		args := jobInsertArgs(job)
		if _, err := stmt.Exec(args...); err != nil {
			return fmt.Errorf("insert job %s: %w", job.ID, err)
		}
	}

	return tx.Commit()
}

func insertSQL() string {
	cols := strings.Join(jobColumns, ", ")
	placeholders := make([]string, len(jobColumns))
	for i := range jobColumns {
		placeholders[i] = "?"
	}
	return fmt.Sprintf("INSERT INTO jobs (%s) VALUES (%s)", cols, strings.Join(placeholders, ", "))
}

func (r *JobRepository) insertJob(job model.Job) error {
	_, err := r.db.Exec(insertSQL(), jobInsertArgs(job)...)
	if err != nil {
		return fmt.Errorf("insert job %s: %w", job.ID, err)
	}
	return nil
}

// jobInsertArgs returns the values for an INSERT, matching the jobColumns order.
// Handles the boolean-to-integer conversion for aiScoringInProgress.
func jobInsertArgs(j model.Job) []interface{} {
	var aiScoringInProgress interface{}
	if j.AIScoringInProgress != nil {
		if *j.AIScoringInProgress {
			aiScoringInProgress = 1
		} else {
			aiScoringInProgress = 0
		}
	}

	return []interface{}{
		j.ID, j.Company, j.RoleTitle, j.ApplicationDate, j.Status,
		j.JobURL, j.AtsURL, j.SalaryRange, j.Notes, j.ContactPerson,
		j.NextAction, j.NextActionDueDate, nilIfEmpty(j.Priority), j.CreatedAt, j.UpdatedAt,
		nilIfEmpty(j.JobDescription), nilIfEmpty(j.JobDescriptionSource),
		j.ScoreFit, j.ScoreCompensation, j.ScoreLocation, j.ScoreGrowth, j.ScoreConfidence,
		nilIfEmpty(j.AIScoredAt), nilIfEmpty(j.AIModel), nilIfEmpty(j.AIReasoning),
		aiScoringInProgress,
	}
}

func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// allowedUpdateColumns is the set of columns that can be partially updated.
var allowedUpdateColumns = map[string]bool{
	"company": true, "roleTitle": true, "applicationDate": true, "status": true,
	"jobUrl": true, "atsUrl": true, "salaryRange": true, "notes": true,
	"contactPerson": true, "nextAction": true, "nextActionDueDate": true, "priority": true,
	"jobDescription": true, "jobDescriptionSource": true,
	"scoreFit": true, "scoreCompensation": true, "scoreLocation": true,
	"scoreGrowth": true, "scoreConfidence": true,
	"aiScoredAt": true, "aiModel": true, "aiReasoning": true, "aiScoringInProgress": true,
}

func buildUpdateClauses(partial map[string]interface{}) ([]string, []interface{}) {
	var setClauses []string
	var args []interface{}
	for col, val := range partial {
		if !allowedUpdateColumns[col] {
			continue
		}
		// Convert aiScoringInProgress boolean to integer for SQLite.
		if col == "aiScoringInProgress" {
			if b, ok := val.(bool); ok {
				if b {
					val = 1
				} else {
					val = 0
				}
			}
		}
		setClauses = append(setClauses, col+" = ?")
		args = append(args, val)
	}
	return setClauses, args
}
