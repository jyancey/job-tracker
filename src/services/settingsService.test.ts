import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createDatabase,
  fetchDatabaseInfo,
  testAIEndpoint,
  testDatabaseConnection,
} from './settingsService'

describe('settingsService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads database info from backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            provider: 'sqlite',
            dbPath: '/tmp/job-tracker.sqlite',
            exists: true,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    await expect(fetchDatabaseInfo()).resolves.toEqual({
      provider: 'sqlite',
      dbPath: '/tmp/job-tracker.sqlite',
      exists: true,
    })
  })

  it('creates database via backend endpoint', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          created: true,
          dbPath: '/tmp/job-tracker.sqlite',
          exists: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(createDatabase()).resolves.toEqual({
      created: true,
      dbPath: '/tmp/job-tracker.sqlite',
      exists: true,
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/database/create', { method: 'POST' })
  })

  it('tests database connection via backend endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: true,
            dbPath: '/tmp/job-tracker.sqlite',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    await expect(testDatabaseConnection()).resolves.toEqual({
      ok: true,
      dbPath: '/tmp/job-tracker.sqlite',
    })
  })

  it('tests OpenAI endpoint successfully', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await testAIEndpoint({
      provider: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    })

    expect(result.ok).toBe(true)
    expect(result.message).toContain('Connected to OpenAI endpoint')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer sk-test' }),
      }),
    )
  })

  it('returns failure when OpenAI key is missing', async () => {
    const result = await testAIEndpoint({
      provider: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    })

    expect(result.ok).toBe(false)
    expect(result.message).toContain('API key is required')
  })

  it('tests LM Studio endpoint with /v1 normalization', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await testAIEndpoint({
      provider: 'lmstudio',
      apiKey: '',
      baseUrl: 'http://localhost:1234',
      model: 'local-model',
    })

    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:1234/v1/models')
  })
})
