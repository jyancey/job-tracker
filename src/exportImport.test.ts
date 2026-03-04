import { describe, expect, it } from 'vitest'
import type { Job } from './domain'
import { mergeImportedJobs } from './exportImport'

function job(id: string, company = `Company ${id}`): Job {
  return {
    id,
    company,
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '$100k - $120k',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  }
}

describe('mergeImportedJobs', () => {
  it('appends imported records in append mode', () => {
    const existing = [job('1')]
    const imported = [job('2')]

    const result = mergeImportedJobs(existing, imported, 'append')

    expect(result.jobs.map((x) => x.id)).toEqual(['1', '2'])
    expect(result.inserted).toBe(1)
    expect(result.updated).toBe(0)
  })

  it('upserts by id in upsert mode', () => {
    const existing = [job('1', 'Old Co'), job('2', 'Keep Co')]
    const imported = [job('1', 'New Co'), job('3', 'Fresh Co')]

    const result = mergeImportedJobs(existing, imported, 'upsert')

    expect(result.jobs.find((x) => x.id === '1')?.company).toBe('New Co')
    expect(result.jobs.find((x) => x.id === '2')?.company).toBe('Keep Co')
    expect(result.jobs.find((x) => x.id === '3')?.company).toBe('Fresh Co')
    expect(result.inserted).toBe(1)
    expect(result.updated).toBe(1)
  })

  it('replaces all records in replace mode', () => {
    const existing = [job('1'), job('2')]
    const imported = [job('3')]

    const result = mergeImportedJobs(existing, imported, 'replace')

    expect(result.jobs.map((x) => x.id)).toEqual(['3'])
    expect(result.inserted).toBe(1)
    expect(result.updated).toBe(0)
  })
})
