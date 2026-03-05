import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'job-tracker.sqlite')

const JOB_COLUMNS = [
  'id',
  'company',
  'roleTitle',
  'applicationDate',
  'status',
  'jobUrl',
  'atsUrl',
  'salaryRange',
  'notes',
  'contactPerson',
  'nextAction',
  'nextActionDueDate',
  'createdAt',
  'updatedAt',
]

function normalizeText(value) {
  return typeof value === 'string' ? value : ''
}

function normalizeJob(input) {
  return {
    id: normalizeText(input.id),
    company: normalizeText(input.company),
    roleTitle: normalizeText(input.roleTitle),
    applicationDate: normalizeText(input.applicationDate),
    status: normalizeText(input.status),
    jobUrl: normalizeText(input.jobUrl),
    atsUrl: normalizeText(input.atsUrl),
    salaryRange: normalizeText(input.salaryRange),
    notes: normalizeText(input.notes),
    contactPerson: normalizeText(input.contactPerson),
    nextAction: normalizeText(input.nextAction),
    nextActionDueDate: normalizeText(input.nextActionDueDate),
    createdAt: normalizeText(input.createdAt),
    updatedAt: normalizeText(input.updatedAt),
  }
}

export function createJobStore(dbPath = process.env.JOB_TRACKER_DB_PATH || DEFAULT_DB_PATH) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
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
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  const listStatement = db.prepare(`
    SELECT ${JOB_COLUMNS.join(', ')}
    FROM jobs
    ORDER BY applicationDate DESC
  `)

  const clearStatement = db.prepare('DELETE FROM jobs')
  const insertStatement = db.prepare(`
    INSERT INTO jobs (
      id, company, roleTitle, applicationDate, status,
      jobUrl, atsUrl, salaryRange, notes, contactPerson,
      nextAction, nextActionDueDate, createdAt, updatedAt
    ) VALUES (
      @id, @company, @roleTitle, @applicationDate, @status,
      @jobUrl, @atsUrl, @salaryRange, @notes, @contactPerson,
      @nextAction, @nextActionDueDate, @createdAt, @updatedAt
    )
  `)

  const replaceAllStatement = db.transaction((jobs) => {
    clearStatement.run()

    for (const job of jobs) {
      insertStatement.run(normalizeJob(job))
    }
  })

  return {
    dbPath,
    listJobs() {
      return listStatement.all()
    },
    replaceAllJobs(jobs) {
      replaceAllStatement(Array.isArray(jobs) ? jobs : [])
    },
    close() {
      db.close()
    },
  }
}
