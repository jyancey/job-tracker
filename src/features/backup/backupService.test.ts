import { describe, expect, it } from 'vitest'
import type { Job, JobStatus } from '../../domain'
import {
  applyRestore,
  backupFilename,
  calculateRestoreImpact,
  createBackupSnapshot,
  parseBackup,
  serializeBackup,
} from './backupService'

function makeJob(overrides: Partial<Job> = {}): Job {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    company: 'Acme',
    roleTitle: 'Engineer',
    applicationDate: now,
    status: 'Applied' as JobStatus,
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('backupService', () => {
  it('creates and serializes snapshot', () => {
    const jobs = [makeJob(), makeJob()]
    const snapshot = createBackupSnapshot(jobs)
    const json = serializeBackup(snapshot)
    expect(json).toContain('job-tracker-backup')
    expect(json).toContain('"schemaVersion": 1')
  })

  it('parses backup snapshot format', () => {
    const jobs = [makeJob()]
    const parsed = parseBackup(
      JSON.stringify({
        kind: 'job-tracker-backup',
        schemaVersion: 1,
        createdAt: '2026-03-08T00:00:00.000Z',
        jobs,
      }),
    )

    expect(parsed).not.toBeNull()
    expect(parsed?.jobs).toHaveLength(1)
  })

  it('parses plain jobs array export as backup', () => {
    const jobs = [makeJob()]
    const parsed = parseBackup(JSON.stringify(jobs))
    expect(parsed).not.toBeNull()
    expect(parsed?.jobs).toHaveLength(1)
  })

  it('returns null for invalid backup payload', () => {
    expect(parseBackup('{"foo":1}')).toBeNull()
    expect(parseBackup('not-json')).toBeNull()
  })

  it('calculates replace impact including removals', () => {
    const a = makeJob({ id: 'a' })
    const b = makeJob({ id: 'b' })
    const c = makeJob({ id: 'c' })

    const impact = calculateRestoreImpact([a, b], [b, c], 'replace')
    expect(impact).toEqual({
      inserted: 2,
      updated: 0,
      removed: 1,
      finalCount: 2,
    })
  })

  it('calculates upsert impact', () => {
    const a = makeJob({ id: 'a' })
    const b = makeJob({ id: 'b', company: 'old' })
    const bNew = makeJob({ id: 'b', company: 'new' })

    const impact = calculateRestoreImpact([a, b], [bNew], 'upsert')
    expect(impact.inserted).toBe(0)
    expect(impact.updated).toBe(1)
    expect(impact.finalCount).toBe(2)
    expect(impact.removed).toBe(0)
  })

  it('applies replace restore', () => {
    const a = makeJob({ id: 'a' })
    const b = makeJob({ id: 'b' })
    const result = applyRestore([a], [b], 'replace')
    expect(result.map((j) => j.id)).toEqual(['b'])
  })

  it('builds deterministic backup filename', () => {
    const fixed = new Date('2026-03-08T12:34:56.789Z')
    expect(backupFilename(fixed)).toBe('job-tracker-backup-2026-03-08_12-34-56-789.json')
  })
})
