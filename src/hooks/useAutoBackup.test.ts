import { renderHook } from '@testing-library/react'
import { describe, beforeEach, expect, it, vi } from 'vitest'
import { useAutoBackup } from './useAutoBackup'
import * as backupModule from '../features/backup'
import type { Job } from '../domain'

vi.mock('../features/backup', () => ({
  checkAndCreateAutoBackup: vi.fn(),
  loadBackupState: vi.fn(),
}))

function createTestJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '1',
    company: 'Test Co',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    ...overrides,
  }
}

describe('useAutoBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns early if not enabled', () => {
    const jobs = [createTestJob()]
    const mockLoadBackupState = vi.mocked(backupModule.loadBackupState)
    mockLoadBackupState.mockReturnValue({
      lastBackupAt: '2026-03-08T00:00:00Z',
      config: { interval: 'daily' },
      backupHistory: [],
    })

    renderHook(() => useAutoBackup(jobs, false))

    expect(mockLoadBackupState).not.toHaveBeenCalled()
  })

  it('returns early if jobs array is empty', () => {
    const mockLoadBackupState = vi.mocked(backupModule.loadBackupState)
    mockLoadBackupState.mockReturnValue({
      lastBackupAt: '2026-03-08T00:00:00Z',
      config: { interval: 'daily' },
      backupHistory: [],
    })

    renderHook(() => useAutoBackup([], true))

    expect(mockLoadBackupState).not.toHaveBeenCalled()
  })

  it('returns early if backups are disabled', () => {
    const jobs = [createTestJob()]
    const mockLoadBackupState = vi.mocked(backupModule.loadBackupState)
    mockLoadBackupState.mockReturnValue({
      lastBackupAt: '2026-03-08T00:00:00Z',
      config: { interval: 'disabled' },
      backupHistory: [],
    })

    renderHook(() => useAutoBackup(jobs, true))

    expect(backupModule.checkAndCreateAutoBackup).not.toHaveBeenCalled()
  })

  it('loads backup state on initialization', () => {
    const jobs = [createTestJob()]
    const mockLoadBackupState = vi.mocked(backupModule.loadBackupState)
    mockLoadBackupState.mockReturnValue({
      lastBackupAt: '2026-03-08T00:00:00Z',
      config: { interval: 'daily' },
      backupHistory: [],
    })

    renderHook(() => useAutoBackup(jobs, true))

    expect(mockLoadBackupState).toHaveBeenCalled()
  })

  it('checks and creates backup if needed', () => {
    const jobs = [createTestJob()]
    const mockLoadBackupState = vi.mocked(backupModule.loadBackupState)
    const mockCheckAndCreate = vi.mocked(backupModule.checkAndCreateAutoBackup)

    mockLoadBackupState.mockReturnValue({
      lastBackupAt: '2026-03-08T00:00:00Z',
      config: { interval: 'daily' },
      backupHistory: [],
    })

    mockCheckAndCreate.mockReturnValue(null)

    renderHook(() => useAutoBackup(jobs, true))

    expect(mockCheckAndCreate).toHaveBeenCalledWith(jobs)
  })

  it('does not log when backup returns null', () => {
    const jobs = [createTestJob()]
    const mockLoadBackupState = vi.mocked(backupModule.loadBackupState)
    const mockCheckAndCreate = vi.mocked(backupModule.checkAndCreateAutoBackup)
    const consoleLogSpy = vi.spyOn(console, 'log')

    mockLoadBackupState.mockReturnValue({
      lastBackupAt: '2026-03-08T00:00:00Z',
      config: { interval: 'daily' },
      backupHistory: [],
    })

    mockCheckAndCreate.mockReturnValue(null)

    renderHook(() => useAutoBackup(jobs, true))

    expect(consoleLogSpy).not.toHaveBeenCalled()
    consoleLogSpy.mockRestore()
  })

  it('prevents duplicate checks with same lastBackupAt', () => {
    const jobs = [createTestJob()]
    const mockLoadBackupState = vi.mocked(backupModule.loadBackupState)
    const mockCheckAndCreate = vi.mocked(backupModule.checkAndCreateAutoBackup)

    mockLoadBackupState.mockReturnValue({
      lastBackupAt: '2026-03-08T00:00:00Z',
      config: { interval: 'daily' },
      backupHistory: [],
    })

    mockCheckAndCreate.mockReturnValue(null)

    const { rerender } = renderHook(({ jobs: j }: { jobs: Job[] }) => useAutoBackup(j, true), {
      initialProps: { jobs },
    })

    expect(mockCheckAndCreate).toHaveBeenCalledTimes(1)

    // Rerender with same jobs - should not call checkAndCreate again
    rerender({ jobs })

    expect(mockCheckAndCreate).toHaveBeenCalledTimes(1)
  })

  it('works with default enabled value (true)', () => {
    const jobs = [createTestJob()]
    const mockLoadBackupState = vi.mocked(backupModule.loadBackupState)
    mockLoadBackupState.mockReturnValue({
      lastBackupAt: '2026-03-08T00:00:00Z',
      config: { interval: 'daily' },
      backupHistory: [],
    })

    // Call without enabled parameter (should default to true)
    renderHook(() => useAutoBackup(jobs))

    expect(backupModule.checkAndCreateAutoBackup).toHaveBeenCalled()
  })
})
