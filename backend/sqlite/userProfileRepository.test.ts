import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { openDatabase } from './db'
import { ensureUserProfileSchema } from './schema'
import { getUserProfile, saveUserProfile } from './userProfileRepository'

function createProfile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'John Doe',
    currentRole: 'Senior Engineer',
    yearsExperience: 8,
    skills: ['React', 'TypeScript'],
    preferredRoles: ['Staff Engineer'],
    preferredCompanySize: '50-200',
    preferredLocation: 'Remote',
    salaryExpectation: '$180k+',
    targetIndustries: ['SaaS'],
    careerGoals: 'Lead platform work',
    dealBreakers: ['Onsite only'],
    resumeText: 'Built and scaled frontend systems.',
    ...overrides,
  }
}

describe('userProfileRepository', () => {
  let tempDir: string
  let dbPath: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'job-tracker-profile-'))
    dbPath = path.join(tempDir, 'profile.sqlite')
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns an empty object when no profile exists', () => {
    expect(getUserProfile(dbPath)).toEqual({})
  })

  it('saves and reloads scalar and array profile fields', () => {
    const profile = createProfile()

    saveUserProfile(profile, dbPath)

    expect(getUserProfile(dbPath)).toMatchObject(profile)

    const db = openDatabase(dbPath)
    try {
      const row = db.prepare(`
        SELECT skills, preferredRoles, targetIndustries, dealBreakers
        FROM user_profile
        WHERE id = 'default'
      `).get() as Record<string, string>

      expect(row.skills).toBe(JSON.stringify(profile.skills))
      expect(row.preferredRoles).toBe(JSON.stringify(profile.preferredRoles))
      expect(row.targetIndustries).toBe(JSON.stringify(profile.targetIndustries))
      expect(row.dealBreakers).toBe(JSON.stringify(profile.dealBreakers))
    } finally {
      db.close()
    }
  })

  it('updates the existing default profile row instead of inserting duplicates', () => {
    saveUserProfile(createProfile(), dbPath)
    saveUserProfile(
      createProfile({
        name: 'Jane Doe',
        skills: ['Go', 'SQL'],
        preferredRoles: ['Principal Engineer'],
      }),
      dbPath,
    )

    const reloaded = getUserProfile(dbPath)
    expect(reloaded.name).toBe('Jane Doe')
    expect(reloaded.skills).toEqual(['Go', 'SQL'])
    expect(reloaded.preferredRoles).toEqual(['Principal Engineer'])

    const db = openDatabase(dbPath)
    try {
      const row = db.prepare('SELECT COUNT(*) AS count FROM user_profile').get() as { count: number }
      expect(row.count).toBe(1)
    } finally {
      db.close()
    }
  })

  it('falls back to empty arrays when stored JSON fields are invalid', () => {
    const db = openDatabase(dbPath)
    try {
      ensureUserProfileSchema(db)
      const now = new Date().toISOString()
      db.prepare(`
        INSERT INTO user_profile (
          id, name, skills, preferredRoles, targetIndustries, dealBreakers, updatedAt, createdAt
        ) VALUES (
          'default', @name, @skills, @preferredRoles, @targetIndustries, @dealBreakers, @updatedAt, @createdAt
        )
      `).run({
        name: 'Broken Profile',
        skills: 'not-json',
        preferredRoles: '[invalid',
        targetIndustries: 'not-json-either',
        dealBreakers: '',
        updatedAt: now,
        createdAt: now,
      })
    } finally {
      db.close()
    }

    const profile = getUserProfile(dbPath)
    expect(profile.name).toBe('Broken Profile')
    expect(profile.skills).toEqual([])
    expect(profile.preferredRoles).toEqual([])
    expect(profile.targetIndustries).toEqual([])
    expect(profile.dealBreakers).toEqual([])
  })
})
