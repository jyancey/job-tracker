// SQLite database initialization, schema management, and job store implementation using better-sqlite3.
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

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
  'priority',
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
  'aiScoringInProgress',
] as const

type JobRecord = {
  id: string
  company: string
  roleTitle: string
  applicationDate: string
  status: string
  jobUrl: string
  atsUrl: string
  salaryRange: string
  notes: string
  contactPerson: string
  nextAction: string
  nextActionDueDate: string
  priority: string
  createdAt: string
  updatedAt: string
  jobDescription: string
  jobDescriptionSource: string
  scoreFit: number | null
  scoreCompensation: number | null
  scoreLocation: number | null
  scoreGrowth: number | null
  scoreConfidence: number | null
  aiScoredAt: string
  aiModel: string
  aiReasoning: string
  aiScoringInProgress: number | null
}

type HydratedJob = Omit<JobRecord, 'aiScoringInProgress'> & {
  aiScoringInProgress?: boolean
}

interface DatabaseInfo {
  provider: 'sqlite'
  dbPath: string
  exists: boolean
}

interface DatabaseCreateResult {
  created: boolean
  dbPath: string
  exists: boolean
}

interface ConnectionTestResult {
  ok: boolean
  dbPath: string
}

export interface JobStore {
  dbPath: string
  listJobs: () => HydratedJob[]
  replaceAllJobs: (jobs: unknown[] | null | undefined) => void
  getDatabaseInfo: () => DatabaseInfo
  createDatabase: () => DatabaseCreateResult
  testConnection: () => ConnectionTestResult
  close: () => void
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normalizeNumber(value: unknown): number | null {
  if (value == null) {
    return null
  }
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function normalizeBooleanToInteger(value: unknown): number | null {
  if (value == null) {
    return null
  }
  return value ? 1 : 0
}

function normalizeJob(input: Record<string, unknown>): JobRecord {
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
    priority: normalizeText(input.priority),
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
    aiScoringInProgress: normalizeBooleanToInteger(input.aiScoringInProgress),
  }
}

function hydrateJob(row: JobRecord): HydratedJob {
  return {
    ...row,
    aiScoringInProgress:
      row.aiScoringInProgress == null ? undefined : Boolean(row.aiScoringInProgress),
  }
}

function ensureJobsSchema(db: InstanceType<typeof Database>): void {
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
      priority TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  const columns = db.pragma('table_info(jobs)') as Array<{ name: string }>
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
  if (!columnNames.includes('priority')) {
    db.exec('ALTER TABLE jobs ADD COLUMN priority TEXT')
  }
  if (!columnNames.includes('aiScoringInProgress')) {
    db.exec('ALTER TABLE jobs ADD COLUMN aiScoringInProgress INTEGER')
  }
}

function ensureUserProfileSchema(db: InstanceType<typeof Database>): void {
  db.exec(`
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
}

function ensureAIConfigSchema(db: InstanceType<typeof Database>): void {
  db.exec(`
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
}

export function createJobStore(
  dbPath = process.env.JOB_TRACKER_DB_PATH || DEFAULT_DB_PATH,
): JobStore {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 10000')
  ensureJobsSchema(db)
  ensureUserProfileSchema(db)
  ensureAIConfigSchema(db)

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
      nextAction, nextActionDueDate, priority, createdAt, updatedAt,
      jobDescription, jobDescriptionSource,
      scoreFit, scoreCompensation, scoreLocation, scoreGrowth, scoreConfidence,
      aiScoredAt, aiModel, aiReasoning, aiScoringInProgress
    ) VALUES (
      @id, @company, @roleTitle, @applicationDate, @status,
      @jobUrl, @atsUrl, @salaryRange, @notes, @contactPerson,
      @nextAction, @nextActionDueDate, @priority, @createdAt, @updatedAt,
      @jobDescription, @jobDescriptionSource,
      @scoreFit, @scoreCompensation, @scoreLocation, @scoreGrowth, @scoreConfidence,
      @aiScoredAt, @aiModel, @aiReasoning, @aiScoringInProgress
    )
  `)

  const replaceAllStatement = db.transaction((jobs: unknown[]) => {
    clearStatement.run()

    for (const job of jobs) {
      const normalized = normalizeJob((job ?? {}) as Record<string, unknown>)
      insertStatement.run(normalized)
    }
  })

  return {
    dbPath,
    listJobs() {
      return (listStatement.all() as JobRecord[]).map(hydrateJob)
    },
    replaceAllJobs(jobs) {
      replaceAllStatement(Array.isArray(jobs) ? jobs : [])
    },
    getDatabaseInfo() {
      return {
        provider: 'sqlite',
        dbPath,
        exists: fs.existsSync(dbPath),
      }
    },
    createDatabase() {
      const existedBefore = fs.existsSync(dbPath)
      fs.mkdirSync(path.dirname(dbPath), { recursive: true })
      ensureJobsSchema(db)
      return {
        created: !existedBefore,
        dbPath,
        exists: fs.existsSync(dbPath),
      }
    },
    testConnection() {
      const result = db.prepare('SELECT 1 AS ok').get() as { ok?: number } | undefined
      return {
        ok: result?.ok === 1,
        dbPath,
      }
    },
    close() {
      db.close()
    },
  }
}

/**
 * Get or initialize a user profile from the database.
 * Returns the stored profile or an empty profile object.
 */
export function getUserProfile(
  dbPath = process.env.JOB_TRACKER_DB_PATH || DEFAULT_DB_PATH,
): Record<string, unknown> {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 10000')
  ensureUserProfileSchema(db)

  try {
    const row = db.prepare('SELECT * FROM user_profile WHERE id = ?').get('default') as
      | Record<string, unknown>
      | undefined

    if (!row) {
      return {}
    }

    // Parse JSON fields
    const profile: Record<string, unknown> = { ...row }
    const jsonFields = ['skills', 'preferredRoles', 'targetIndustries', 'dealBreakers']
    for (const field of jsonFields) {
      if (typeof profile[field] === 'string') {
        try {
          profile[field] = JSON.parse(profile[field] as string)
        } catch {
          profile[field] = []
        }
      }
    }

    return profile
  } finally {
    db.close()
  }
}

/**
 * Save a user profile to the database.
 */
export function saveUserProfile(
  profile: Record<string, unknown>,
  dbPath = process.env.JOB_TRACKER_DB_PATH || DEFAULT_DB_PATH,
): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 10000')
  ensureUserProfileSchema(db)

  try {
    const now = new Date().toISOString()
    
    // Convert array fields to JSON strings
    const toSave: Record<string, unknown> = { ...profile, id: 'default' }
    const jsonFields = ['skills', 'preferredRoles', 'targetIndustries', 'dealBreakers']
    for (const field of jsonFields) {
      if (Array.isArray(toSave[field])) {
        toSave[field] = JSON.stringify(toSave[field])
      }
    }

    const existing = db.prepare('SELECT id FROM user_profile WHERE id = ?').get('default')

    if (existing) {
      const updateStmt = db.prepare(`
        UPDATE user_profile SET 
          name = @name,
          currentRole = @currentRole,
          yearsExperience = @yearsExperience,
          skills = @skills,
          preferredRoles = @preferredRoles,
          preferredCompanySize = @preferredCompanySize,
          preferredLocation = @preferredLocation,
          salaryExpectation = @salaryExpectation,
          targetIndustries = @targetIndustries,
          careerGoals = @careerGoals,
          dealBreakers = @dealBreakers,
          resumeText = @resumeText,
          updatedAt = @updatedAt
        WHERE id = 'default'
      `)
      updateStmt.run({ ...toSave, updatedAt: now })
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO user_profile (
          id, name, currentRole, yearsExperience, skills, preferredRoles,
          preferredCompanySize, preferredLocation, salaryExpectation,
          targetIndustries, careerGoals, dealBreakers, resumeText,
          updatedAt, createdAt
        ) VALUES (
          'default', @name, @currentRole, @yearsExperience, @skills, @preferredRoles,
          @preferredCompanySize, @preferredLocation, @salaryExpectation,
          @targetIndustries, @careerGoals, @dealBreakers, @resumeText,
          @updatedAt, @createdAt
        )
      `)
      insertStmt.run({ ...toSave, updatedAt: now, createdAt: now })
    }
  } finally {
    db.close()
  }
}

/**
 * Get or initialize AI configuration from the database.
 */
export function getAIConfig(
  dbPath = process.env.JOB_TRACKER_DB_PATH || DEFAULT_DB_PATH,
): Record<string, unknown> {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 10000')
  ensureAIConfigSchema(db)

  try {
    const row = db.prepare('SELECT * FROM ai_config WHERE id = ?').get('default') as
      | Record<string, unknown>
      | undefined

    return row || {}
  } finally {
    db.close()
  }
}

/**
 * Save AI configuration to the database.
 */
export function saveAIConfig(
  config: Record<string, unknown>,
  dbPath = process.env.JOB_TRACKER_DB_PATH || DEFAULT_DB_PATH,
): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 10000')
  ensureAIConfigSchema(db)

  try {
    const now = new Date().toISOString()
    const toSave = { ...config, id: 'default' }

    const existing = db.prepare('SELECT id FROM ai_config WHERE id = ?').get('default')

    if (existing) {
      const updateStmt = db.prepare(`
        UPDATE ai_config SET 
          provider = @provider,
          apiKey = @apiKey,
          baseUrl = @baseUrl,
          model = @model,
          updatedAt = @updatedAt
        WHERE id = 'default'
      `)
      updateStmt.run({ ...toSave, updatedAt: now })
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO ai_config (
          id, provider, apiKey, baseUrl, model, updatedAt, createdAt
        ) VALUES (
          'default', @provider, @apiKey, @baseUrl, @model, @updatedAt, @createdAt
        )
      `)
      insertStmt.run({ ...toSave, updatedAt: now, createdAt: now })
    }
  } finally {
    db.close()
  }
}
