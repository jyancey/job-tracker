import type { Job } from './domain'
import { downloadTextFile } from './utils/downloadUtils'

const API_JOBS_ENDPOINT = '/api/jobs'
const STORAGE_LOG_BUFFER_KEY = 'job-tracker.storage.logs'
const FALLBACK_JOBS_KEY = 'job-tracker.jobs.fallback'

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
    console.warn(`[storage] ${message}`, details)
    return
  }

  console.warn(`[storage] ${message}`)
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

  downloadTextFile(content, filename)
}

export interface LoadJobsResult {
  jobs: Job[]
  didLoad: boolean
}

function readFallbackJobs(): Job[] {
  try {
    const raw = localStorage.getItem(FALLBACK_JOBS_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Job[]) : []
  } catch {
    return []
  }
}

function writeFallbackJobs(jobs: Job[]): void {
  localStorage.setItem(FALLBACK_JOBS_KEY, JSON.stringify(jobs))
}

function isApiUrlPatternError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes('did not match the expected pattern') || message.includes('failed to parse url')
}

export async function loadJobs(): Promise<LoadJobsResult> {
  const startedAt = performance.now()
  try {
    const response = await fetch(API_JOBS_ENDPOINT)
    if (!response.ok) {
      throw new Error(`load failed with status ${response.status}`)
    }

    const payload = (await response.json()) as { jobs?: Job[] }
    const jobs = Array.isArray(payload.jobs) ? payload.jobs : []

    logStorageInfo('loaded jobs', {
      count: jobs.length,
      durationMs: Math.round(performance.now() - startedAt),
    })
    return {
      jobs,
      didLoad: true,
    }
  } catch (error) {
    if (isApiUrlPatternError(error)) {
      const jobs = readFallbackJobs()
      logStorageInfo('loaded jobs from local fallback', {
        count: jobs.length,
        durationMs: Math.round(performance.now() - startedAt),
      })
      return {
        jobs,
        didLoad: true,
      }
    }

    logStorageError('failed to load jobs', error)
    return {
      jobs: [],
      didLoad: false,
    }
  }
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  const startedAt = performance.now()
  logStorageInfo('saving jobs', { count: jobs.length })

  try {
    const response = await fetch(API_JOBS_ENDPOINT, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobs }),
    })

    if (!response.ok) {
      throw new Error(`save failed with status ${response.status}`)
    }

    logStorageInfo('saved jobs', {
      count: jobs.length,
      durationMs: Math.round(performance.now() - startedAt),
    })
  } catch (error) {
    if (isApiUrlPatternError(error)) {
      writeFallbackJobs(jobs)
      logStorageInfo('saved jobs to local fallback', {
        count: jobs.length,
        durationMs: Math.round(performance.now() - startedAt),
      })
      return
    }

    logStorageError('failed to save jobs', error)
    throw error
  }
}
