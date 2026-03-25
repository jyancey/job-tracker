import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  shouldCreateBackup,
  createAutoBackup,
  loadBackupConfig,
  saveBackupConfig,
  formatBackupInterval,
  getNextBackupTime,
  type BackupConfig,
  type AutoBackupState,
} from './backupScheduler'
import type { Job } from '../../domain'

const mockJobs: Job[] = [
  {
    id: '1',
    company: 'Test Corp',
    roleTitle: 'Developer',
    status: 'Applied',
    applicationDate: '2024-01-01',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '$100k',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

describe('backupScheduler', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('shouldCreateBackup', () => {
    it('should return true if interval is not disabled and no previous backup exists', () => {
      expect(shouldCreateBackup(null, 'daily')).toBe(true)
      expect(shouldCreateBackup(null, 'weekly')).toBe(true)
      expect(shouldCreateBackup(null, 'monthly')).toBe(true)
    })

    it('should return false if interval is disabled', () => {
      expect(shouldCreateBackup(null, 'disabled')).toBe(false)
      expect(shouldCreateBackup(new Date().toISOString(), 'disabled')).toBe(false)
    })

    it('should return true if enough time has passed for daily backup', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(yesterday.getHours() - 1) // 25 hours ago

      expect(shouldCreateBackup(yesterday.toISOString(), 'daily')).toBe(true)
    })

    it('should return false if not enough time has passed for daily backup', () => {
      const recent = new Date()
      recent.setHours(recent.getHours() - 12) // 12 hours ago

      expect(shouldCreateBackup(recent.toISOString(), 'daily')).toBe(false)
    })

    it('should return true if enough time has passed for weekly backup', () => {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 8) // 8 days ago

      expect(shouldCreateBackup(lastWeek.toISOString(), 'weekly')).toBe(true)
    })

    it('should return false if not enough time has passed for weekly backup', () => {
      const recent = new Date()
      recent.setDate(recent.getDate() - 3) // 3 days ago

      expect(shouldCreateBackup(recent.toISOString(), 'weekly')).toBe(false)
    })

    it('should return true if enough time has passed for monthly backup', () => {
      const lastMonth = new Date()
      lastMonth.setDate(lastMonth.getDate() - 31) // 31 days ago

      expect(shouldCreateBackup(lastMonth.toISOString(), 'monthly')).toBe(true)
    })

    it('should return false if not enough time has passed for monthly backup', () => {
      const recent = new Date()
      recent.setDate(recent.getDate() - 15) // 15 days ago

      expect(shouldCreateBackup(recent.toISOString(), 'monthly')).toBe(false)
    })
  })

  describe('createAutoBackup', () => {
    it('should create a backup snapshot and update state', () => {
      const state: AutoBackupState = {
        lastBackupAt: null,
        config: { interval: 'weekly', keepLastN: 7, autoSaveToStorage: true },
        backupHistory: [],
      }

      const newState = createAutoBackup(mockJobs, state)

      expect(newState.lastBackupAt).toBeTruthy()
      expect(newState.backupHistory).toHaveLength(1)
      expect(newState.backupHistory[0].jobCount).toBe(1)
      expect(newState.backupHistory[0].filename).toContain('job-tracker-backup-')
    })

    it('should save backup to localStorage when autoSaveToStorage is true', () => {
      const state: AutoBackupState = {
        lastBackupAt: null,
        config: { interval: 'weekly', keepLastN: 7, autoSaveToStorage: true },
        backupHistory: [],
      }

      const newState = createAutoBackup(mockJobs, state)
      const key = 'job-tracker-auto-backup-' + newState.lastBackupAt

      expect(localStorage.getItem(key)).toBeTruthy()
    })

    it('should not save to localStorage when autoSaveToStorage is false', () => {
      const state: AutoBackupState = {
        lastBackupAt: null,
        config: { interval: 'weekly', keepLastN: 7, autoSaveToStorage: false },
        backupHistory: [],
      }

      createAutoBackup(mockJobs, state)

      // Check that no auto-backup keys were created
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('job-tracker-auto-backup-'))
      expect(keys).toHaveLength(0)
    })

    it('should prune old backups when exceeding keepLastN limit', () => {
      const oldBackups = Array.from({ length: 5 }, (_, i) => ({
        filename: `backup-${i}.json`,
        createdAt: new Date(2024, 0, i + 1).toISOString(),
        jobCount: 10,
        size: 1000,
      }))

      const state: AutoBackupState = {
        lastBackupAt: oldBackups[4].createdAt,
        config: { interval: 'daily', keepLastN: 3, autoSaveToStorage: true },
        backupHistory: oldBackups,
      }

      // Save old backups to storage
      oldBackups.forEach((backup) => {
        localStorage.setItem('job-tracker-auto-backup-' + backup.createdAt, JSON.stringify({ test: 'data' }))
      })

      const newState = createAutoBackup(mockJobs, state)

      // Should keep newest 3 backups
      expect(newState.backupHistory).toHaveLength(3)
      expect(newState.backupHistory[0].createdAt).toBe(newState.lastBackupAt) // newest

      // Old backups should be removed from storage
      const remainingKeys = Object.keys(localStorage).filter((k) => k.startsWith('job-tracker-auto-backup-'))
      expect(remainingKeys).toHaveLength(3)
    })
  })

  describe('loadBackupConfig and saveBackupConfig', () => {
    it('should return default config when nothing is stored', () => {
      const config = loadBackupConfig()

      expect(config.interval).toBe('weekly')
      expect(config.keepLastN).toBe(7)
      expect(config.autoSaveToStorage).toBe(true)
    })

    it('should save and load config from localStorage', () => {
      const customConfig: BackupConfig = {
        interval: 'daily',
        keepLastN: 5,
        autoSaveToStorage: false,
      }

      saveBackupConfig(customConfig)
      const loaded = loadBackupConfig()

      expect(loaded).toEqual(customConfig)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('job-tracker-backup-config', 'invalid json')

      const config = loadBackupConfig()

      expect(config.interval).toBe('weekly') // Falls back to default
    })
  })

  describe('formatBackupInterval', () => {
    it('should format backup intervals correctly', () => {
      expect(formatBackupInterval('disabled')).toBe('Disabled')
      expect(formatBackupInterval('daily')).toBe('Daily')
      expect(formatBackupInterval('weekly')).toBe('Weekly')
      expect(formatBackupInterval('monthly')).toBe('Monthly')
    })
  })

  describe('getNextBackupTime', () => {
    it('should return null if interval is disabled', () => {
      expect(getNextBackupTime(new Date().toISOString(), 'disabled')).toBeNull()
    })

    it('should return null if no last backup time', () => {
      expect(getNextBackupTime(null, 'daily')).toBeNull()
    })

    it('should calculate next daily backup correctly', () => {
      const lastBackup = new Date('2024-01-01T12:00:00Z')
      const next = getNextBackupTime(lastBackup.toISOString(), 'daily')

      expect(next).toEqual(new Date('2024-01-02T12:00:00Z'))
    })

    it('should calculate next weekly backup correctly', () => {
      const lastBackup = new Date('2024-01-01T12:00:00Z')
      const next = getNextBackupTime(lastBackup.toISOString(), 'weekly')

      expect(next).toEqual(new Date('2024-01-08T12:00:00Z'))
    })

    it('should calculate next monthly backup correctly', () => {
      const lastBackup = new Date('2024-01-15T12:00:00Z')
      const next = getNextBackupTime(lastBackup.toISOString(), 'monthly')

      expect(next).toEqual(new Date('2024-02-15T12:00:00Z'))
    })
  })
})
