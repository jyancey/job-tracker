import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Job } from './domain'

let rows: Job[] = []

class FakeStatement {
  run(values: unknown[]): void {
    const [
      id,
      company,
      roleTitle,
      applicationDate,
      status,
      jobUrl,
      atsUrl,
      salaryRange,
      notes,
      contactPerson,
      nextAction,
      nextActionDueDate,
      createdAt,
      updatedAt,
    ] = values as string[]

    rows.push({
      id,
      company,
      roleTitle,
      applicationDate,
      status: status as Job['status'],
      jobUrl,
      atsUrl,
      salaryRange,
      notes,
      contactPerson,
      nextAction,
      nextActionDueDate,
      createdAt,
      updatedAt,
    })
  }

  free(): void {}
}

class FakeDatabase {
  constructor(_bytes?: Uint8Array) {}

  run(sql: string): void {
    if (sql.includes('DELETE FROM jobs')) {
      rows = []
    }
  }

  prepare(_sql: string): FakeStatement {
    return new FakeStatement()
  }

  exec(_sql: string): Array<{ columns: string[]; values: string[][] }> {
    if (!rows.length) {
      return []
    }

    const columns: Array<keyof Job> = [
      'id',
      'company',
      'roleTitle',
      'applicationDate',
      'status',
      'jobUrl',
      'atsUrl',
      'salaryRange',
      'notes',
      'contactPerson',
      'nextAction',
      'nextActionDueDate',
      'createdAt',
      'updatedAt',
    ]

    return [
      {
        columns,
        values: rows.map((row) => columns.map((column) => row[column])),
      },
    ]
  }

  export(): Uint8Array {
    return new Uint8Array([1, 2, 3])
  }
}

vi.mock('sql.js/dist/sql-wasm.wasm?url', () => ({
  default: '/sql-wasm.wasm',
}))

vi.mock('sql.js', () => ({
  default: vi.fn(async () => ({
    Database: FakeDatabase,
  })),
}))

import { SQLITE_STORAGE_KEY, loadJobs, saveJobs } from './storage'

function sampleJob(): Job {
  return {
    id: '1',
    company: 'Acme Labs',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: 'https://example.com/job',
    atsUrl: '',
    salaryRange: '$120k - $150k',
    notes: '',
    contactPerson: 'Sam',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-08',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  }
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    rows = []
  })

  it('returns empty array when no data exists', async () => {
    await expect(loadJobs()).resolves.toEqual([])
  })

  it('saves and loads jobs', async () => {
    const jobs = [sampleJob()]
    await saveJobs(jobs)

    const persisted = localStorage.getItem(SQLITE_STORAGE_KEY)
    expect(persisted).toBeTruthy()

    await expect(loadJobs()).resolves.toEqual(jobs)
  })

  it('returns empty array when stored payload is invalid', async () => {
    localStorage.setItem(SQLITE_STORAGE_KEY, 'not-valid-base64')
    await expect(loadJobs()).resolves.toEqual([])
  })

})
