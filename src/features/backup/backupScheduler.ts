import type { Job } from '../../domain'
import { createBackupSnapshot, serializeBackup, backupFilename } from './backupService'

export type BackupInterval = 'disabled' | 'daily' | 'weekly' | 'monthly'

export interface BackupConfig {
  interval: BackupInterval
  keepLastN: number
  autoSaveToStorage: boolean
}

export interface BackupMetadata {
  filename: string
  createdAt: string
  jobCount: number
  size: number
}

export interface AutoBackupState {
  lastBackupAt: string | null
  config: BackupConfig
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

export function saveBackupConfig(config: BackupConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save backup config:', error)
  }
}

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

export function checkAndCreateAutoBackup(jobs: Job[]): AutoBackupState | null {
  const state = loadBackupState()

  if (shouldCreateBackup(state.lastBackupAt, state.config.interval)) {
    const newState = createAutoBackup(jobs, state)
    saveBackupState(newState)
    return newState
  }

  return null
}

export function getStoredBackup(createdAt: string): string | null {
  try {
    const key = STORAGE_KEY_BACKUP_PREFIX + createdAt
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function deleteStoredBackup(createdAt: string): void {
  try {
    const key = STORAGE_KEY_BACKUP_PREFIX + createdAt
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to delete stored backup:', error)
  }
}

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
