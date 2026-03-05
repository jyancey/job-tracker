import { test, describe, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { createJobStore } from './sqliteStore.js'

describe('sqliteStore', () => {
  let testDbPath
  let store

  beforeEach(() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'job-tracker-test-'))
    testDbPath = path.join(tmpDir, 'test.sqlite')
    store = createJobStore(testDbPath)
  })

  afterEach(() => {
    store.close()
    // Cleanup test database files
    const dir = path.dirname(testDbPath)
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        fs.unlinkSync(path.join(dir, file))
      }
      fs.rmdirSync(dir)
    }
  })

  test('creates database with jobs table', () => {
    const jobs = store.listJobs()
    expect(Array.isArray(jobs)).toBe(true)
    expect(jobs).toEqual([])
  })

  test('stores and retrieves a single job', () => {
    const now = '2026-03-04T00:00:00.000Z'
    const job = {
      id: 'test-id-1',
      company: 'Test Corp',
      roleTitle: 'Engineer',
      applicationDate: now,
      status: 'Applied',
      jobUrl: 'https://example.com',
      atsUrl: '',
      salaryRange: '$100k - $150k',
      notes: 'Test notes',
      contactPerson: 'Alice',
      nextAction: 'Follow up',
      nextActionDueDate: now,
      createdAt: now,
      updatedAt: now,
    }

    store.replaceAllJobs([job])
    const retrieved = store.listJobs()

    expect(retrieved).toHaveLength(1)
    expect(retrieved[0].id).toBe('test-id-1')
    expect(retrieved[0].company).toBe('Test Corp')
    expect(retrieved[0].status).toBe('Applied')
  })

  test('stores and retrieves multiple jobs in application date DESC order', () => {
    const job1 = {
      id: 'job-1',
      company: 'Company A',
      roleTitle: 'Role A',
      applicationDate: '2026-03-01T00:00:00.000Z',
      status: 'Applied',
      jobUrl: '',
      atsUrl: '',
      salaryRange: '',
      notes: '',
      contactPerson: '',
      nextAction: '',
      nextActionDueDate: '',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    }

    const job2 = {
      id: 'job-2',
      company: 'Company B',
      roleTitle: 'Role B',
      applicationDate: '2026-03-05T00:00:00.000Z',
      status: 'Applied',
      jobUrl: '',
      atsUrl: '',
      salaryRange: '',
      notes: '',
      contactPerson: '',
      nextAction: '',
      nextActionDueDate: '',
      createdAt: '2026-03-05T00:00:00.000Z',
      updatedAt: '2026-03-05T00:00:00.000Z',
    }

    store.replaceAllJobs([job1, job2])
    const retrieved = store.listJobs()

    expect(retrieved).toHaveLength(2)
    // Should be in DESC order by applicationDate
    expect(retrieved[0].id).toBe('job-2')
    expect(retrieved[1].id).toBe('job-1')
  })

  test('replaces all jobs with new set', () => {
    const job1 = {
      id: 'old-1',
      company: 'Old',
      roleTitle: 'Role',
      applicationDate: '2026-03-01T00:00:00.000Z',
      status: 'Applied',
      jobUrl: '',
      atsUrl: '',
      salaryRange: '',
      notes: '',
      contactPerson: '',
      nextAction: '',
      nextActionDueDate: '',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    }

    const job2 = {
      id: 'new-1',
      company: 'New',
      roleTitle: 'Role',
      applicationDate: '2026-03-02T00:00:00.000Z',
      status: 'Applied',
      jobUrl: '',
      atsUrl: '',
      salaryRange: '',
      notes: '',
      contactPerson: '',
      nextAction: '',
      nextActionDueDate: '',
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    }

    store.replaceAllJobs([job1])
    let jobs = store.listJobs()
    expect(jobs).toHaveLength(1)

    store.replaceAllJobs([job2])
    jobs = store.listJobs()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].id).toBe('new-1')
  })

  test('handles null/undefined values by coercing to empty strings', () => {
    const job = {
      id: 'test-id',
      company: null,
      roleTitle: undefined,
      applicationDate: '2026-03-01T00:00:00.000Z',
      status: 'Applied',
      jobUrl: '',
      atsUrl: '',
      salaryRange: '',
      notes: '',
      contactPerson: '',
      nextAction: '',
      nextActionDueDate: '',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    }

    store.replaceAllJobs([job])
    const retrieved = store.listJobs()

    expect(retrieved[0].company).toBe('')
    expect(retrieved[0].roleTitle).toBe('')
  })

  test('handles empty jobs array', () => {
    store.replaceAllJobs([])
    const jobs = store.listJobs()
    expect(jobs).toEqual([])
  })

  test('replaces all jobs with empty array when null passed', () => {
    const job = {
      id: 'test-1',
      company: 'Test',
      roleTitle: 'Role',
      applicationDate: '2026-03-01T00:00:00.000Z',
      status: 'Applied',
      jobUrl: '',
      atsUrl: '',
      salaryRange: '',
      notes: '',
      contactPerson: '',
      nextAction: '',
      nextActionDueDate: '',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    }

    store.replaceAllJobs([job])
    expect(store.listJobs()).toHaveLength(1)

    // Passing null is coerced to empty array, clearing all jobs
    store.replaceAllJobs(null)
    expect(store.listJobs()).toHaveLength(0)
  })
})
