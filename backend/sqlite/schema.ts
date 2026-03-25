import type { SQLiteDatabase } from './db'

const JOB_TABLE_SQL = `
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
`

const JOB_COLUMN_MIGRATIONS = [
  { name: 'scoreFit', sql: 'ALTER TABLE jobs ADD COLUMN scoreFit REAL' },
  { name: 'scoreCompensation', sql: 'ALTER TABLE jobs ADD COLUMN scoreCompensation REAL' },
  { name: 'scoreLocation', sql: 'ALTER TABLE jobs ADD COLUMN scoreLocation REAL' },
  { name: 'scoreGrowth', sql: 'ALTER TABLE jobs ADD COLUMN scoreGrowth REAL' },
  { name: 'scoreConfidence', sql: 'ALTER TABLE jobs ADD COLUMN scoreConfidence REAL' },
  { name: 'jobDescription', sql: 'ALTER TABLE jobs ADD COLUMN jobDescription TEXT' },
  { name: 'jobDescriptionSource', sql: 'ALTER TABLE jobs ADD COLUMN jobDescriptionSource TEXT' },
  { name: 'aiScoredAt', sql: 'ALTER TABLE jobs ADD COLUMN aiScoredAt TEXT' },
  { name: 'aiModel', sql: 'ALTER TABLE jobs ADD COLUMN aiModel TEXT' },
  { name: 'aiReasoning', sql: 'ALTER TABLE jobs ADD COLUMN aiReasoning TEXT' },
  { name: 'priority', sql: 'ALTER TABLE jobs ADD COLUMN priority TEXT' },
  { name: 'aiScoringInProgress', sql: 'ALTER TABLE jobs ADD COLUMN aiScoringInProgress INTEGER' },
] as const

function getColumnNames(db: SQLiteDatabase, tableName: string): Set<string> {
  const columns = db.pragma(`table_info(${tableName})`) as Array<{ name: string }>
  return new Set(columns.map((column) => column.name))
}

export function ensureJobsSchema(db: SQLiteDatabase): void {
  db.exec(JOB_TABLE_SQL)

  const columnNames = getColumnNames(db, 'jobs')
  for (const migration of JOB_COLUMN_MIGRATIONS) {
    if (!columnNames.has(migration.name)) {
      db.exec(migration.sql)
    }
  }
}

export function ensureUserProfileSchema(db: SQLiteDatabase): void {
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

export function ensureAIConfigSchema(db: SQLiteDatabase): void {
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

export function ensureAllSchema(db: SQLiteDatabase): void {
  ensureJobsSchema(db)
  ensureUserProfileSchema(db)
  ensureAIConfigSchema(db)
}
