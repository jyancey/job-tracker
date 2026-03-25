import { resolveDbPath, withDatabase } from './db'
import { ensureAIConfigSchema } from './schema'

export function getAIConfig(
  dbPath = resolveDbPath(),
): Record<string, unknown> {
  return withDatabase(dbPath, (db) => {
    ensureAIConfigSchema(db)

    const row = db.prepare('SELECT * FROM ai_config WHERE id = ?').get('default') as
      | Record<string, unknown>
      | undefined

    return row || {}
  })
}

export function saveAIConfig(
  config: Record<string, unknown>,
  dbPath = resolveDbPath(),
): void {
  withDatabase(dbPath, (db) => {
    ensureAIConfigSchema(db)

    const now = new Date().toISOString()
    const toSave = { ...config, id: 'default' }
    const existing = db.prepare('SELECT id FROM ai_config WHERE id = ?').get('default')

    if (existing) {
      const updateStatement = db.prepare(`
        UPDATE ai_config SET
          provider = @provider,
          apiKey = @apiKey,
          baseUrl = @baseUrl,
          model = @model,
          updatedAt = @updatedAt
        WHERE id = 'default'
      `)
      updateStatement.run({ ...toSave, updatedAt: now })
      return
    }

    const insertStatement = db.prepare(`
      INSERT INTO ai_config (
        id, provider, apiKey, baseUrl, model, updatedAt, createdAt
      ) VALUES (
        'default', @provider, @apiKey, @baseUrl, @model, @updatedAt, @createdAt
      )
    `)
    insertStatement.run({ ...toSave, updatedAt: now, createdAt: now })
  })
}
