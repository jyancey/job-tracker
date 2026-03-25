import { resolveDbPath, withDatabase } from './db'
import { ensureUserProfileSchema } from './schema'

const JSON_PROFILE_FIELDS = ['skills', 'preferredRoles', 'targetIndustries', 'dealBreakers'] as const

function parseProfile(row: Record<string, unknown>): Record<string, unknown> {
  const profile: Record<string, unknown> = { ...row }

  for (const field of JSON_PROFILE_FIELDS) {
    if (typeof profile[field] === 'string') {
      try {
        profile[field] = JSON.parse(profile[field] as string)
      } catch {
        profile[field] = []
      }
    }
  }

  return profile
}

function serializeProfile(profile: Record<string, unknown>): Record<string, unknown> {
  const serialized: Record<string, unknown> = { ...profile, id: 'default' }

  for (const field of JSON_PROFILE_FIELDS) {
    if (Array.isArray(serialized[field])) {
      serialized[field] = JSON.stringify(serialized[field])
    }
  }

  return serialized
}

export function getUserProfile(
  dbPath = resolveDbPath(),
): Record<string, unknown> {
  return withDatabase(dbPath, (db) => {
    ensureUserProfileSchema(db)

    const row = db.prepare('SELECT * FROM user_profile WHERE id = ?').get('default') as
      | Record<string, unknown>
      | undefined

    return row ? parseProfile(row) : {}
  })
}

export function saveUserProfile(
  profile: Record<string, unknown>,
  dbPath = resolveDbPath(),
): void {
  withDatabase(dbPath, (db) => {
    ensureUserProfileSchema(db)

    const now = new Date().toISOString()
    const toSave = serializeProfile(profile)
    const existing = db.prepare('SELECT id FROM user_profile WHERE id = ?').get('default')

    if (existing) {
      const updateStatement = db.prepare(`
        UPDATE user_profile SET
          name = @name,
          currentRole = @currentRole,
          yearsExperience = @yearsExperience,
          skills = @skills,
          preferredRoles = @preferredRoles,
          preferredCompanySize = @preferredCompanySize,
          preferredLocation = @preferredLocation,
          salaryExpectation = @salaryExpectation,
          targetIndustries = @targetIndustries,
          careerGoals = @careerGoals,
          dealBreakers = @dealBreakers,
          resumeText = @resumeText,
          updatedAt = @updatedAt
        WHERE id = 'default'
      `)
      updateStatement.run({ ...toSave, updatedAt: now })
      return
    }

    const insertStatement = db.prepare(`
      INSERT INTO user_profile (
        id, name, currentRole, yearsExperience, skills, preferredRoles,
        preferredCompanySize, preferredLocation, salaryExpectation,
        targetIndustries, careerGoals, dealBreakers, resumeText,
        updatedAt, createdAt
      ) VALUES (
        'default', @name, @currentRole, @yearsExperience, @skills, @preferredRoles,
        @preferredCompanySize, @preferredLocation, @salaryExpectation,
        @targetIndustries, @careerGoals, @dealBreakers, @resumeText,
        @updatedAt, @createdAt
      )
    `)
    insertStatement.run({ ...toSave, updatedAt: now, createdAt: now })
  })
}
