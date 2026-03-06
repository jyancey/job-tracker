import { test, describe, expect, beforeEach, vi } from 'vitest'
import { handleJobsApi } from './jobsApi.js'

function createMockStore() {
  return {
    dbPath: '/fake/path/job-tracker.sqlite',
    listJobs: vi.fn(() => []),
    replaceAllJobs: vi.fn(),
    getDatabaseInfo: vi.fn(() => ({
      provider: 'sqlite',
      dbPath: '/fake/path/job-tracker.sqlite',
      exists: true,
    })),
    createDatabase: vi.fn(() => ({
      created: false,
      dbPath: '/fake/path/job-tracker.sqlite',
      exists: true,
    })),
    testConnection: vi.fn(() => ({
      ok: true,
      dbPath: '/fake/path/job-tracker.sqlite',
    })),
    close: vi.fn(),
  }
}

function createMockRequest(method, url, body = null) {
  const req = new (require('stream').PassThrough)()
  req.method = method
  req.url = url
  req.headers = { host: 'localhost:3100' }

  if (body) {
    req.write(JSON.stringify(body))
  }
  req.end()

  return req
}

function createMockResponse() {
  const res = new (require('stream').PassThrough)()
  res.headersSent = false
  res.headers = {}
  res.writeHead = vi.fn((code, headers) => {
    res.statusCode = code
    res.headers = headers
    res.headersSent = true
  })
  res.end = vi.fn()
  return res
}

function sampleJob() {
  const now = '2026-03-04T00:00:00.000Z'
  return {
    id: 'test-1',
    company: 'Acme Labs',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-04T00:00:00.000Z',
    status: 'Applied',
    jobUrl: 'https://example.com',
    atsUrl: '',
    salaryRange: '$120k - $150k',
    notes: 'Test job',
    contactPerson: 'John',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-11T00:00:00.000Z',
    createdAt: now,
    updatedAt: now,
  }
}

describe('jobsApi', () => {
  let mockStore

  beforeEach(() => {
    mockStore = createMockStore()
  })

  test('GET /api/jobs returns jobs from store', async () => {
    mockStore.listJobs.mockReturnValue([sampleJob()])

    const req = createMockRequest('GET', '/api/jobs')
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'application/json; charset=utf-8',
    }))

    const endCall = res.end.mock.calls[0]?.[0]
    const response = JSON.parse(endCall)
    expect(response.jobs).toHaveLength(1)
    expect(response.jobs[0].id).toBe('test-1')
    expect(response.dbPath).toBeUndefined() // Should not leak filesystem path
  })

  test('PUT /api/jobs with valid jobs stores them', async () => {
    const req = createMockRequest('PUT', '/api/jobs', { jobs: [sampleJob()] })
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(mockStore.replaceAllJobs).toHaveBeenCalledWith([sampleJob()])
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.anything())

    const endCall = res.end.mock.calls[0]?.[0]
    const response = JSON.parse(endCall)
    expect(response.ok).toBe(true)
    expect(response.count).toBe(1)
  })

  test('PUT /api/jobs rejects jobs with missing required fields', async () => {
    const invalidJob = { ...sampleJob(), company: undefined }
    const req = createMockRequest('PUT', '/api/jobs', { jobs: [invalidJob] })
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(mockStore.replaceAllJobs).not.toHaveBeenCalled()
    expect(res.writeHead).toHaveBeenCalledWith(422, expect.anything())

    const endCall = res.end.mock.calls[0]?.[0]
    const response = JSON.parse(endCall)
    expect(response.error).toContain('Missing required field')
  })

  test('PUT /api/jobs rejects jobs with invalid status', async () => {
    const invalidJob = { ...sampleJob(), status: 'InvalidStatus' }
    const req = createMockRequest('PUT', '/api/jobs', { jobs: [invalidJob] })
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(mockStore.replaceAllJobs).not.toHaveBeenCalled()
    expect(res.writeHead).toHaveBeenCalledWith(422, expect.anything())

    const endCall = res.end.mock.calls[0]?.[0]
    const response = JSON.parse(endCall)
    expect(response.error).toContain('status must be one of')
  })

  test('PUT /api/jobs rejects jobs with invalid date format', async () => {
    const invalidJob = { ...sampleJob(), applicationDate: 'not-a-date' }
    const req = createMockRequest('PUT', '/api/jobs', { jobs: [invalidJob] })
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(mockStore.replaceAllJobs).not.toHaveBeenCalled()
    expect(res.writeHead).toHaveBeenCalledWith(422, expect.anything())
  })

  test('PUT /api/jobs rejects empty jobs array', async () => {
    const req = createMockRequest('PUT', '/api/jobs', { jobs: [] })
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(mockStore.replaceAllJobs).toHaveBeenCalledWith([])
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.anything())
  })

  test('returns 405 for unsupported methods', async () => {
    const req = createMockRequest('DELETE', '/api/jobs')
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(res.writeHead).toHaveBeenCalledWith(405, expect.anything())
  })

  test('returns false for non-api paths', async () => {
    const req = createMockRequest('GET', '/some-other-path')
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(false)
    expect(res.writeHead).not.toHaveBeenCalled()
  })

  test('PUT /api/jobs handles malformed JSON', async () => {
    const req = {
      method: 'PUT',
      url: '/api/jobs',
      headers: { host: 'localhost' },
    }
    req.on = vi.fn((event, callback) => {
      if (event === 'data') {
        callback(Buffer.from('invalid json {'))
      } else if (event === 'end') {
        callback()
      }
    })

    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(res.writeHead).toHaveBeenCalledWith(400, expect.anything())
  })

  test('GET /api/database/info returns database metadata', async () => {
    const req = createMockRequest('GET', '/api/database/info')
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(mockStore.getDatabaseInfo).toHaveBeenCalledTimes(1)
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.anything())

    const endCall = res.end.mock.calls[0]?.[0]
    const response = JSON.parse(endCall)
    expect(response.provider).toBe('sqlite')
    expect(response.exists).toBe(true)
  })

  test('POST /api/database/create triggers create operation', async () => {
    const req = createMockRequest('POST', '/api/database/create')
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(mockStore.createDatabase).toHaveBeenCalledTimes(1)
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.anything())
  })

  test('GET /api/database/test runs connection check', async () => {
    const req = createMockRequest('GET', '/api/database/test')
    const res = createMockResponse()

    const handled = await handleJobsApi(req, res, mockStore)

    expect(handled).toBe(true)
    expect(mockStore.testConnection).toHaveBeenCalledTimes(1)
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.anything())

    const endCall = res.end.mock.calls[0]?.[0]
    const response = JSON.parse(endCall)
    expect(response.ok).toBe(true)
  })
})
