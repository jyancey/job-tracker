import { describe, expect, it } from 'vitest'
import type { Job } from './domain'
import { importFromCsv, importJobsFromFile, mergeImportedJobs } from './services/importExportService'

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

describe('CSV import', () => {
  it('imports rows from exported-style CSV', () => {
    const csv = [
      'Company,Role Title,Status,Application Date,Salary Range,Contact Person,Next Action,Next Action Due,Notes',
      '"Acme, Inc","Frontend Engineer","Applied","2026-03-02","$120k - $150k","Sam","Follow up","2026-03-09","Strong portfolio"',
    ].join('\n')

    const imported = importFromCsv(csv)

    expect(imported).toHaveLength(1)
    expect(imported[0].company).toBe('Acme, Inc')
    expect(imported[0].roleTitle).toBe('Frontend Engineer')
    expect(imported[0].status).toBe('Applied')
    expect(imported[0].applicationDate).toBe('2026-03-02')
    expect(imported[0].contactPerson).toBe('Sam')
  })

  it('skips invalid CSV rows missing required fields', () => {
    const csv = [
      'Company,Role Title,Application Date,Status',
      '"","Engineer","2026-03-01","Applied"',
      '"Valid Co","","2026-03-01","Applied"',
      '"Good Co","Designer","2026-03-05","Interview"',
    ].join('\n')

    const imported = importFromCsv(csv)

    expect(imported).toHaveLength(1)
    expect(imported[0].company).toBe('Good Co')
  })

  it('routes import by filename extension', () => {
    const csv = [
      'Company,Role Title,Application Date,Status',
      '"CSV Co","Engineer","2026-03-03","Applied"',
    ].join('\n')

    const json = JSON.stringify([job('json-1', 'JSON Co')])

    expect(importJobsFromFile(csv, 'jobs.csv')[0].company).toBe('CSV Co')
    expect(importJobsFromFile(json, 'jobs.json')[0].company).toBe('JSON Co')
  })
})
