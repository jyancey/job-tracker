import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_DB_PATH = path.join(MODULE_DIR, 'data', 'job-tracker.sqlite')

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
  'jobDescription',
  'jobDescriptionSource',
  'scoreFit',
  'scoreCompensation',
  'scoreLocation',
  'scoreGrowth',
  'scoreConfidence',
  'aiScoredAt',
  'aiModel',
  'aiReasoning',
]

function normalizeText(value) {
  return typeof value === 'string' ? value : ''
}

function normalizeNumber(value) {
  if (value == null) {
    return null
  }
  const num = Number(value)
  return Number.isFinite(num) ? num : null
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
    jobDescription: normalizeText(input.jobDescription),
    jobDescriptionSource: normalizeText(input.jobDescriptionSource),
    scoreFit: normalizeNumber(input.scoreFit),
    scoreCompensation: normalizeNumber(input.scoreCompensation),
    scoreLocation: normalizeNumber(input.scoreLocation),
    scoreGrowth: normalizeNumber(input.scoreGrowth),
    scoreConfidence: normalizeNumber(input.scoreConfidence),
    aiScoredAt: normalizeText(input.aiScoredAt),
    aiModel: normalizeText(input.aiModel),
    aiReasoning: normalizeText(input.aiReasoning),
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

  // Migration: Add scoring columns if they don't exist
  const columns = db.pragma('table_info(jobs)')
  const columnNames = columns.map((col) => col.name)

  if (!columnNames.includes('scoreFit')) {
    db.exec('ALTER TABLE jobs ADD COLUMN scoreFit REAL')
  }
  if (!columnNames.includes('scoreCompensation')) {
    db.exec('ALTER TABLE jobs ADD COLUMN scoreCompensation REAL')
  }
  if (!columnNames.includes('scoreLocation')) {
    db.exec('ALTER TABLE jobs ADD COLUMN scoreLocation REAL')
  }
  if (!columnNames.includes('scoreGrowth')) {
    db.exec('ALTER TABLE jobs ADD COLUMN scoreGrowth REAL')
  }
  if (!columnNames.includes('scoreConfidence')) {
    db.exec('ALTER TABLE jobs ADD COLUMN scoreConfidence REAL')
  }
  
  // Migration: Add AI and job description columns
  if (!columnNames.includes('jobDescription')) {
    db.exec('ALTER TABLE jobs ADD COLUMN jobDescription TEXT')
  }
  if (!columnNames.includes('jobDescriptionSource')) {
    db.exec('ALTER TABLE jobs ADD COLUMN jobDescriptionSource TEXT')
  }
  if (!columnNames.includes('aiScoredAt')) {
    db.exec('ALTER TABLE jobs ADD COLUMN aiScoredAt TEXT')
  }
  if (!columnNames.includes('aiModel')) {
    db.exec('ALTER TABLE jobs ADD COLUMN aiModel TEXT')
  }
  if (!columnNames.includes('aiReasoning')) {
    db.exec('ALTER TABLE jobs ADD COLUMN aiReasoning TEXT')
  }

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
      nextAction, nextActionDueDate, createdAt, updatedAt,
      jobDescription, jobDescriptionSource,
      scoreFit, scoreCompensation, scoreLocation, scoreGrowth, scoreConfidence,
      aiScoredAt, aiModel, aiReasoning
    ) VALUES (
      @id, @company, @roleTitle, @applicationDate, @status,
      @jobUrl, @atsUrl, @salaryRange, @notes, @contactPerson,
      @nextAction, @nextActionDueDate, @createdAt, @updatedAt,
      @jobDescription, @jobDescriptionSource,
      @scoreFit, @scoreCompensation, @scoreLocation, @scoreGrowth, @scoreConfidence,
      @aiScoredAt, @aiModel, @aiReasoning
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
