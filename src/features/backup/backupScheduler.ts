// Auto-backup scheduling with configurable intervals, retention limits, and persistence.
import type { Job } from '../../domain'
import { createBackupSnapshot, serializeBackup, backupFilename } from './backupService'

/**
 * How frequently automatic backups should be created.
 * `'disabled'` turns off auto-backup entirely.
 */
export type BackupInterval = 'disabled' | 'daily' | 'weekly' | 'monthly'

/**
 * User-configurable backup schedule and storage settings.
 */
export interface BackupConfig {
  /** How often automatic backups should be triggered. */
  interval: BackupInterval
  /** Maximum number of past backups to retain. Older entries are pruned. */
  keepLastN: number
  /** When `true`, auto-backups are also persisted to localStorage. */
  autoSaveToStorage: boolean
}

/**
 * Metadata record for a single completed backup entry in the history list.
 */
export interface BackupMetadata {
  /** The filename used when this backup was created or downloaded. */
  filename: string
  /** ISO timestamp for when this backup was created. */
  createdAt: string
  /** Number of jobs captured in this backup. */
  jobCount: number
  /** Size of the backup content in bytes. */
  size: number
}

/**
 * Persisted auto-backup state, stored in localStorage between sessions.
 */
export interface AutoBackupState {
  /** ISO timestamp for the most recent backup, or `null` if none has run yet. */
  lastBackupAt: string | null
  /** The current backup configuration. */
  config: BackupConfig
  /** Ordered list of past backup metadata records, newest first. */
  backupHistory: BackupMetadata[]
}

const DEFAULT_CONFIG: BackupConfig = {
  interval: 'weekly',
  keepLastN: 7,
  autoSaveToStorage: true,
}

const STORAGE_KEY_CONFIG = 'job-tracker-backup-config'
const STORAGE_KEY_STATE = 'job-tracker-backup-state'
const STORAGE_KEY_BACKUP_PREFIX = 'job-tracker-auto-backup-'

/**
 * Load the backup configuration from localStorage.
 *
 * Falls back to the default configuration if none is stored or if parsing fails.
 */
export function loadBackupConfig(): BackupConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<BackupConfig>
      return {
        interval: parsed.interval || DEFAULT_CONFIG.interval,
        keepLastN: parsed.keepLastN || DEFAULT_CONFIG.keepLastN,
        autoSaveToStorage: parsed.autoSaveToStorage ?? DEFAULT_CONFIG.autoSaveToStorage,
      }
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_CONFIG
}

/**
 * Persist the backup configuration to localStorage.
 *
 * @param config - The configuration to save.
 */
export function saveBackupConfig(config: BackupConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save backup config:', error)
  }
}

/**
 * Load the current auto-backup state from localStorage.
 *
 * Falls back to a safe default state if none is stored or if parsing fails.
 */
export function loadBackupState(): AutoBackupState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STATE)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AutoBackupState>
      return {
        lastBackupAt: parsed.lastBackupAt || null,
        config: parsed.config || loadBackupConfig(),
        backupHistory: Array.isArray(parsed.backupHistory) ? parsed.backupHistory : [],
      }
    }
  } catch {
    // Fall through to default
  }
  return {
    lastBackupAt: null,
    config: loadBackupConfig(),
    backupHistory: [],
  }
}

/**
 * Persist the current auto-backup state to localStorage.
 *
 * @param state - The state to save.
 */
export function saveBackupState(state: AutoBackupState): void {
  try {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save backup state:', error)
  }
}

export function shouldCreateBackup(lastBackupAt: string | null, interval: BackupInterval): boolean {
  if (interval === 'disabled') {
    return false
  }

  if (!lastBackupAt) {
    return true
  }

  const now = new Date()
  const lastBackup = new Date(lastBackupAt)
  const timeDiffMs = now.getTime() - lastBackup.getTime()
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60)

  switch (interval) {
    case 'daily':
      return timeDiffHours >= 24
    case 'weekly':
      return timeDiffHours >= 24 * 7
    case 'monthly':
      return timeDiffHours >= 24 * 30
    default:
      return false
  }
}

/**
 * Create an auto-backup snapshot, optionally persist it to localStorage,
 * and return the updated auto-backup state with pruned history.
 *
 * @param jobs - The current job list to back up.
 * @param state - The current auto-backup state, including config and history.
 * @returns The updated auto-backup state after this backup run.
 */
export function createAutoBackup(jobs: Job[], state: AutoBackupState): AutoBackupState {
  const snapshot = createBackupSnapshot(jobs)
  const serialized = serializeBackup(snapshot)
  const filename = backupFilename()

  // Save to localStorage if enabled
  if (state.config.autoSaveToStorage) {
    try {
      const key = STORAGE_KEY_BACKUP_PREFIX + snapshot.createdAt
      localStorage.setItem(key, serialized)
    } catch (error) {
      console.error('Failed to save auto-backup to storage:', error)
    }
  }

  // Create metadata
  const metadata: BackupMetadata = {
    filename,
    createdAt: snapshot.createdAt,
    jobCount: jobs.length,
    size: serialized.length,
  }

  // Update history
  const newHistory = [metadata, ...state.backupHistory]

  // Prune old backups
  const historyToKeep = newHistory.slice(0, state.config.keepLastN)
  const historyToRemove = newHistory.slice(state.config.keepLastN)

  // Remove old backups from storage
  if (state.config.autoSaveToStorage) {
    historyToRemove.forEach((oldBackup) => {
      try {
        const key = STORAGE_KEY_BACKUP_PREFIX + oldBackup.createdAt
        localStorage.removeItem(key)
      } catch (error) {
        console.error('Failed to remove old backup:', error)
      }
    })
  }

  return {
    lastBackupAt: snapshot.createdAt,
    config: state.config,
    backupHistory: historyToKeep,
  }
}

/**
 * Check whether a backup is due and, if so, create one and save the updated state.
 *
 * Convenience wrapper combining {@link shouldCreateBackup}, {@link createAutoBackup},
 * and {@link saveBackupState}.
 *
 * @param jobs - The current job list.
 * @returns The updated auto-backup state if a backup was created, or `null` if none was needed.
 */
export function checkAndCreateAutoBackup(jobs: Job[]): AutoBackupState | null {
  const state = loadBackupState()

  if (shouldCreateBackup(state.lastBackupAt, state.config.interval)) {
    const newState = createAutoBackup(jobs, state)
    saveBackupState(newState)
    return newState
  }

  return null
}

/**
 * Retrieve a stored auto-backup by its creation timestamp.
 *
 * @param createdAt - The ISO timestamp used as the storage key.
 * @returns The raw backup content string, or `null` if not found.
 */
export function getStoredBackup(createdAt: string): string | null {
  try {
    const key = STORAGE_KEY_BACKUP_PREFIX + createdAt
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Delete a stored auto-backup from localStorage by its creation timestamp.
 *
 * @param createdAt - The ISO timestamp used as the storage key.
 */
export function deleteStoredBackup(createdAt: string): void {
  try {
    const key = STORAGE_KEY_BACKUP_PREFIX + createdAt
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to delete stored backup:', error)
  }
}

/**
 * Trigger a browser download of a stored backup file.
 *
 * @param metadata - Metadata for the backup to download. Uses `createdAt` to look up the content.
 * @throws When the backup content is no longer present in storage.
 */
export function downloadBackup(metadata: BackupMetadata): void {
  const content = getStoredBackup(metadata.createdAt)
  if (!content) {
    throw new Error('Backup not found in storage')
  }

  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = metadata.filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatBackupInterval(interval: BackupInterval): string {
  switch (interval) {
    case 'disabled':
      return 'Disabled'
    case 'daily':
      return 'Daily'
    case 'weekly':
      return 'Weekly'
    case 'monthly':
      return 'Monthly'
    default:
      return 'Unknown'
  }
}

export function getNextBackupTime(lastBackupAt: string | null, interval: BackupInterval): Date | null {
  if (interval === 'disabled' || !lastBackupAt) {
    return null
  }

  const lastBackup = new Date(lastBackupAt)
  const next = new Date(lastBackup)

  switch (interval) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
  }

  return next
}
