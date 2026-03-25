import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { openDatabase } from './db'
import { getAIConfig, saveAIConfig } from './aiConfigRepository'

function createAIConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    provider: 'openai',
    apiKey: 'sk-test',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    ...overrides,
  }
}

describe('aiConfigRepository', () => {
  let tempDir: string
  let dbPath: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'job-tracker-config-'))
    dbPath = path.join(tempDir, 'config.sqlite')
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns an empty object when no AI config exists', () => {
    expect(getAIConfig(dbPath)).toEqual({})
  })

  it('saves and reloads AI config values', () => {
    const config = createAIConfig()

    saveAIConfig(config, dbPath)

    expect(getAIConfig(dbPath)).toMatchObject(config)
  })

  it('updates the existing default AI config row instead of inserting duplicates', () => {
    saveAIConfig(createAIConfig(), dbPath)
    saveAIConfig(
      createAIConfig({
        provider: 'lmstudio',
        apiKey: '',
        baseUrl: 'http://localhost:1234',
        model: 'local-model',
      }),
      dbPath,
    )

    const reloaded = getAIConfig(dbPath)
    expect(reloaded).toMatchObject({
      provider: 'lmstudio',
      apiKey: '',
      baseUrl: 'http://localhost:1234',
      model: 'local-model',
    })

    const db = openDatabase(dbPath)
    try {
      const row = db.prepare('SELECT COUNT(*) AS count FROM ai_config').get() as { count: number }
      expect(row.count).toBe(1)
    } finally {
      db.close()
    }
  })
})
