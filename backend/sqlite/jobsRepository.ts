import fs from 'node:fs'
import { openDatabase, resolveDbPath } from './db'
import { ensureAllSchema } from './schema'

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

  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : null
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
    aiScoringInProgress: row.aiScoringInProgress == null ? undefined : Boolean(row.aiScoringInProgress),
  }
}

export function createJobStore(
  dbPath = resolveDbPath(),
): JobStore {
  const db = openDatabase(dbPath)
  ensureAllSchema(db)

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
      insertStatement.run(normalizeJob((job ?? {}) as Record<string, unknown>))
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
      ensureAllSchema(db)

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
