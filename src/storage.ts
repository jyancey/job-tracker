import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import sqliteWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { Job } from './domain'

export const SQLITE_STORAGE_KEY = 'job-tracker.sqlite.base64'
const LEGACY_JSON_STORAGE_KEY = 'job-tracker.store'
const STORAGE_LOG_BUFFER_KEY = 'job-tracker.storage.logs'

let sqlJsPromise: Promise<SqlJsStatic> | null = null
let dbPromise: Promise<Database> | null = null

const STORAGE_DEBUG_KEY = 'job-tracker.debug'
const MAX_LOG_LINES = 500

function isStorageDebugEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_DEBUG_KEY) === 'true'
  } catch {
    return false
  }
}

function logStorageInfo(message: string, details?: Record<string, unknown>): void {
  appendStorageLog('info', message, details)

  if (!isStorageDebugEnabled()) {
    return
  }

  if (details) {
    console.info(`[storage] ${message}`, details)
    return
  }

  console.info(`[storage] ${message}`)
}

function logStorageError(message: string, error: unknown): void {
  appendStorageLog('error', message, {
    error: error instanceof Error ? error.message : String(error),
  })

  if (!isStorageDebugEnabled()) {
    return
  }

  console.error(`[storage] ${message}`, error)
}

export function setStorageDebugLogging(enabled: boolean): void {
  localStorage.setItem(STORAGE_DEBUG_KEY, String(enabled))
  logStorageInfo('debug logging enabled')
}

function appendStorageLog(
  level: 'info' | 'error',
  message: string,
  details?: Record<string, unknown>,
): void {
  try {
    const now = new Date().toISOString()
    const entry = details
      ? `${now} [${level.toUpperCase()}] ${message} ${JSON.stringify(details)}`
      : `${now} [${level.toUpperCase()}] ${message}`

    const existing = localStorage.getItem(STORAGE_LOG_BUFFER_KEY)
    const lines = existing ? existing.split('\n') : []
    lines.push(entry)
    const trimmed = lines.slice(-MAX_LOG_LINES)
    localStorage.setItem(STORAGE_LOG_BUFFER_KEY, trimmed.join('\n'))
  } catch {
    // Ignore log persistence failures.
  }
}

export function getStorageLogText(): string {
  return localStorage.getItem(STORAGE_LOG_BUFFER_KEY) ?? ''
}

export function clearStorageLogs(): void {
  localStorage.removeItem(STORAGE_LOG_BUFFER_KEY)
}

export function downloadStorageLogs(filename = 'job-tracker-storage.log'): void {
  const content = getStorageLogText()
  if (!content || typeof document === 'undefined') {
    return
  }

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

function fromBase64(encoded: string): Uint8Array {
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

function getSqlJs(): Promise<SqlJsStatic> {
  if (sqlJsPromise) {
    logStorageInfo('reusing existing sql.js promise')
    return sqlJsPromise
  }

  logStorageInfo('initializing sql.js runtime', { wasm: sqliteWasmUrl })
  sqlJsPromise = initSqlJs({
    locateFile: () => sqliteWasmUrl,
  })
  return sqlJsPromise
}

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await getSqlJs()
      const encodedDb = localStorage.getItem(SQLITE_STORAGE_KEY)

      logStorageInfo('opening database', {
        source: encodedDb ? 'localStorage' : 'new',
      })

      const db = encodedDb ? new SQL.Database(fromBase64(encodedDb)) : new SQL.Database()

      db.run(`
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

      migrateLegacyJsonStore(db)
      logStorageInfo('database ready')
      return db
    })()
  }

  return dbPromise
}

function persistDb(db: Database): void {
  const serializedDb = db.export()
  localStorage.setItem(SQLITE_STORAGE_KEY, toBase64(serializedDb))
  logStorageInfo('database persisted', { bytes: serializedDb.length })
}

function migrateLegacyJsonStore(db: Database): void {
  if (localStorage.getItem(SQLITE_STORAGE_KEY)) {
    logStorageInfo('legacy migration skipped; sqlite payload already exists')
    return
  }

  const legacyRaw = localStorage.getItem(LEGACY_JSON_STORAGE_KEY)
  if (!legacyRaw) {
    logStorageInfo('legacy migration skipped; no legacy payload found')
    return
  }

  try {
    const parsed = JSON.parse(legacyRaw) as { jobs?: unknown }
    if (!Array.isArray(parsed.jobs) || parsed.jobs.length === 0) {
      return
    }

    const statement = db.prepare(`
      INSERT OR REPLACE INTO jobs (
        id, company, roleTitle, applicationDate, status,
        jobUrl, atsUrl, salaryRange, notes, contactPerson,
        nextAction, nextActionDueDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const entry of parsed.jobs) {
      const job = entry as Partial<Job>
      statement.run([
        String(job.id ?? ''),
        String(job.company ?? ''),
        String(job.roleTitle ?? ''),
        String(job.applicationDate ?? ''),
        String(job.status ?? 'Applied'),
        String(job.jobUrl ?? ''),
        String(job.atsUrl ?? ''),
        String(job.salaryRange ?? ''),
        String(job.notes ?? ''),
        String(job.contactPerson ?? ''),
        String(job.nextAction ?? ''),
        String(job.nextActionDueDate ?? ''),
        String(job.createdAt ?? ''),
        String(job.updatedAt ?? ''),
      ])
    }

    statement.free()
    persistDb(db)
    logStorageInfo('legacy migration completed', { importedRows: parsed.jobs.length })
  } catch (error) {
    logStorageError('legacy migration failed; continuing with empty sqlite store', error)
    // Ignore malformed legacy payloads and continue with empty SQLite store.
  }
}

export async function loadJobs(): Promise<Job[]> {
  const startedAt = performance.now()
  try {
    const db = await getDb()
    const result = db.exec(`
      SELECT
        id, company, roleTitle, applicationDate, status,
        jobUrl, atsUrl, salaryRange, notes, contactPerson,
        nextAction, nextActionDueDate, createdAt, updatedAt
      FROM jobs
      ORDER BY applicationDate DESC
    `)

    if (!result.length) {
      logStorageInfo('loaded jobs', {
        count: 0,
        durationMs: Math.round(performance.now() - startedAt),
      })
      return []
    }

    const jobs = result[0].values.map((row): Job => ({
      id: String(row[0] ?? ''),
      company: String(row[1] ?? ''),
      roleTitle: String(row[2] ?? ''),
      applicationDate: String(row[3] ?? ''),
      status: String(row[4] ?? 'Applied') as Job['status'],
      jobUrl: String(row[5] ?? ''),
      atsUrl: String(row[6] ?? ''),
      salaryRange: String(row[7] ?? ''),
      notes: String(row[8] ?? ''),
      contactPerson: String(row[9] ?? ''),
      nextAction: String(row[10] ?? ''),
      nextActionDueDate: String(row[11] ?? ''),
      createdAt: String(row[12] ?? ''),
      updatedAt: String(row[13] ?? ''),
    }))
    logStorageInfo('loaded jobs', {
      count: jobs.length,
      durationMs: Math.round(performance.now() - startedAt),
    })
    return jobs
  } catch (error) {
    logStorageError('failed to load jobs', error)
    return []
  }
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  const startedAt = performance.now()
  const db = await getDb()

  logStorageInfo('saving jobs', { count: jobs.length })

  db.run('BEGIN TRANSACTION')
  try {
    db.run('DELETE FROM jobs')

    const statement = db.prepare(`
      INSERT INTO jobs (
        id, company, roleTitle, applicationDate, status,
        jobUrl, atsUrl, salaryRange, notes, contactPerson,
        nextAction, nextActionDueDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const job of jobs) {
      statement.run([
        job.id,
        job.company,
        job.roleTitle,
        job.applicationDate,
        job.status,
        job.jobUrl,
        job.atsUrl,
        job.salaryRange,
        job.notes,
        job.contactPerson,
        job.nextAction,
        job.nextActionDueDate,
        job.createdAt,
        job.updatedAt,
      ])
    }

    statement.free()
    db.run('COMMIT')
    persistDb(db)
    logStorageInfo('saved jobs', {
      count: jobs.length,
      durationMs: Math.round(performance.now() - startedAt),
    })
  } catch (error) {
    db.run('ROLLBACK')
    logStorageError('failed to save jobs; transaction rolled back', error)
    throw error
  }
}
