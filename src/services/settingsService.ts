import type { AIConfig } from '../types/ai'

export interface DatabaseInfo {
  provider: 'sqlite'
  dbPath: string
  exists: boolean
}

export interface DatabaseCreateResult {
  created: boolean
  dbPath: string
  exists: boolean
}

export interface DatabaseTestResult {
  ok: boolean
  dbPath: string
}

export interface EndpointTestResult {
  ok: boolean
  message: string
  latencyMs: number
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function fetchDatabaseInfo(): Promise<DatabaseInfo> {
  const response = await fetch('/api/database/info')
  if (!response.ok) {
    throw new Error(`Failed to load database info (${response.status})`)
  }

  return response.json() as Promise<DatabaseInfo>
}

export async function createDatabase(): Promise<DatabaseCreateResult> {
  const response = await fetch('/api/database/create', {
    method: 'POST',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create database (${response.status}): ${text}`)
  }

  return response.json() as Promise<DatabaseCreateResult>
}

export async function testDatabaseConnection(): Promise<DatabaseTestResult> {
  const response = await fetch('/api/database/test')
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Database connection test failed (${response.status}): ${text}`)
  }

  return response.json() as Promise<DatabaseTestResult>
}

export async function testAIEndpoint(config: AIConfig): Promise<EndpointTestResult> {
  if (config.provider === 'disabled') {
    return {
      ok: true,
      message: 'AI provider is disabled',
      latencyMs: 0,
    }
  }

  const startedAt = performance.now()

  try {
    if (config.provider === 'openai') {
      if (!config.apiKey?.trim()) {
        throw new Error('OpenAI API key is required to test the endpoint')
      }

      const baseUrl = normalizeBaseUrl(config.baseUrl || 'https://api.openai.com/v1')
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`OpenAI endpoint returned ${response.status}: ${errorBody}`)
      }

      return {
        ok: true,
        message: 'Connected to OpenAI endpoint',
        latencyMs: Math.round(performance.now() - startedAt),
      }
    }

    const rawBaseUrl = config.baseUrl || 'http://localhost:1234'
    const trimmedBaseUrl = normalizeBaseUrl(rawBaseUrl)
    const apiBaseUrl = trimmedBaseUrl.endsWith('/v1') ? trimmedBaseUrl : `${trimmedBaseUrl}/v1`

    const response = await fetch(`${apiBaseUrl}/models`)
    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`LM Studio endpoint returned ${response.status}: ${errorBody}`)
    }

    return {
      ok: true,
      message: 'Connected to LM Studio endpoint',
      latencyMs: Math.round(performance.now() - startedAt),
    }
  } catch (error) {
    return {
      ok: false,
      message: toErrorMessage(error),
      latencyMs: Math.round(performance.now() - startedAt),
    }
  }
}
