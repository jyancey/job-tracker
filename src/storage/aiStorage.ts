// Persists AI configuration and user profile with two-tier storage:
// Primary: SQLite via API endpoints. Fallback: localStorage.
// Synchronous localStorage functions for state initialization,
// with async API sync for persistence.
import type { AIConfig, UserProfile } from '../types/ai'
import { DEFAULT_AI_CONFIG, DEFAULT_USER_PROFILE } from '../types/ai'

const AI_CONFIG_KEY = 'job-tracker-ai-config'
const USER_PROFILE_KEY = 'job-tracker-user-profile'

/**
 * Load AI configuration from localStorage (synchronous, for state initialization).
 * Data is synced with API in the background via syncAIConfigWithAPI().
 */
export function loadAIConfig(): AIConfig {
  try {
    const stored = localStorage.getItem(AI_CONFIG_KEY)
    if (!stored) {
      return DEFAULT_AI_CONFIG
    }
    return { ...DEFAULT_AI_CONFIG, ...JSON.parse(stored) }
  } catch (error) {
    console.error('Failed to load AI config from localStorage:', error)
    return DEFAULT_AI_CONFIG
  }
}

/**
 * Sync AI config with the database API.
 * Call this after saving config to ensure it's persisted to SQLite.
 */
export async function syncAIConfigWithAPI(config: AIConfig): Promise<void> {
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    })
    if (!response.ok) {
      console.warn('Failed to sync AI config with API:', response.statusText)
    }
  } catch (error) {
    console.warn('Failed to sync AI config with API:', error)
  }
}

/**
 * Save AI configuration to localStorage (synchronous) and sync with API in background.
 */
export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
    // Sync with API asynchronously (fire and forget)
    syncAIConfigWithAPI(config).catch((err) => {
      console.warn('Background AI config sync failed:', err)
    })
  } catch (error) {
    console.error('Failed to save AI config to localStorage:', error)
    throw new Error('Failed to save AI configuration')
  }
}

/**
 * Load AI configuration from API (returns stored server state).
 * Useful for verifying what's in the database.
 */
export async function loadAIConfigFromAPI(): Promise<AIConfig> {
  try {
    const response = await fetch('/api/config', { method: 'GET' })
    if (response.ok) {
      const data = (await response.json()) as { config?: Record<string, unknown> }
      if (data.config && Object.keys(data.config).length > 0) {
        return { ...DEFAULT_AI_CONFIG, ...(data.config as Partial<AIConfig>) }
      }
    }
  } catch (error) {
    console.warn('Failed to load AI config from API:', error)
  }
  return DEFAULT_AI_CONFIG
}


/**
 * Load user profile from localStorage (synchronous, for state initialization).
 * Data is synced with API in the background via syncUserProfileWithAPI().
 */
export function loadUserProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(USER_PROFILE_KEY)
    if (!stored) {
      return DEFAULT_USER_PROFILE
    }
    const profile = JSON.parse(stored)
    return {
      ...DEFAULT_USER_PROFILE,
      ...profile,
      // Ensure arrays are actually arrays
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      preferredRoles: Array.isArray(profile.preferredRoles) ? profile.preferredRoles : [],
      targetIndustries: Array.isArray(profile.targetIndustries) ? profile.targetIndustries : [],
      dealBreakers: Array.isArray(profile.dealBreakers) ? profile.dealBreakers : [],
    }
  } catch (error) {
    console.error('Failed to load user profile from localStorage:', error)
    return DEFAULT_USER_PROFILE
  }
}

/**
 * Sync user profile with the database API.
 * Call this after saving profile to ensure it's persisted to SQLite.
 */
export async function syncUserProfileWithAPI(profile: UserProfile): Promise<void> {
  try {
    const toSave = {
      ...profile,
      updatedAt: new Date().toISOString(),
    }
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: toSave }),
    })
    if (!response.ok) {
      console.warn('Failed to sync user profile with API:', response.statusText)
    }
  } catch (error) {
    console.warn('Failed to sync user profile with API:', error)
  }
}

/**
 * Save user profile to localStorage (synchronous) and sync with API in background.
 */
export function saveUserProfile(profile: UserProfile): void {
  try {
    const toSave = {
      ...profile,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(toSave))
    // Sync with API asynchronously (fire and forget)
    syncUserProfileWithAPI(profile).catch((err) => {
      console.warn('Background user profile sync failed:', err)
    })
  } catch (error) {
    console.error('Failed to save user profile to localStorage:', error)
    throw new Error('Failed to save user profile')
  }
}

/**
 * Load user profile from API (returns stored server state).
 * Useful for verifying what's in the database.
 */
export async function loadUserProfileFromAPI(): Promise<UserProfile> {
  try {
    const response = await fetch('/api/profile', { method: 'GET' })
    if (response.ok) {
      const data = (await response.json()) as { profile?: Record<string, unknown> }
      if (data.profile && Object.keys(data.profile).length > 0) {
        const profile = data.profile as Partial<UserProfile>
        return {
          ...DEFAULT_USER_PROFILE,
          ...profile,
          // Ensure arrays are actually arrays
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          preferredRoles: Array.isArray(profile.preferredRoles) ? profile.preferredRoles : [],
          targetIndustries: Array.isArray(profile.targetIndustries) ? profile.targetIndustries : [],
          dealBreakers: Array.isArray(profile.dealBreakers) ? profile.dealBreakers : [],
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load user profile from API:', error)
  }
  return DEFAULT_USER_PROFILE
}

/**
 * Clear all AI-related data from localStorage and database.
 */
export async function clearAIData(): Promise<void> {
  // Clear localStorage
  localStorage.removeItem(AI_CONFIG_KEY)
  localStorage.removeItem(USER_PROFILE_KEY)
  // Note: Could add API endpoints to clear database if needed
}
