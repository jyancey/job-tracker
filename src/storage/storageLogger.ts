import { downloadTextFile } from '../utils/downloadUtils'

const STORAGE_LOG_BUFFER_KEY = 'job-tracker.storage.logs'
const STORAGE_DEBUG_KEY = 'job-tracker.debug'
const MAX_LOG_LINES = 500

type StorageLogLevel = 'info' | 'error'

function isStorageDebugEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_DEBUG_KEY) === 'true'
  } catch {
    return false
  }
}

function appendStorageLog(level: StorageLogLevel, message: string, details?: Record<string, unknown>): void {
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

export function logStorageInfo(message: string, details?: Record<string, unknown>): void {
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

export function logStorageError(message: string, error: unknown): void {
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
