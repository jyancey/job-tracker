import type { AIConfig, UserProfile } from '../types/ai'
import { DEFAULT_AI_CONFIG, DEFAULT_USER_PROFILE } from '../types/ai'

const AI_CONFIG_KEY = 'job-tracker-ai-config'
const USER_PROFILE_KEY = 'job-tracker-user-profile'

/**
 * Load AI configuration from localStorage
 */
export function loadAIConfig(): AIConfig {
  try {
    const stored = localStorage.getItem(AI_CONFIG_KEY)
    if (!stored) {
      return DEFAULT_AI_CONFIG
    }
    return { ...DEFAULT_AI_CONFIG, ...JSON.parse(stored) }
  } catch (error) {
    console.error('Failed to load AI config:', error)
    return DEFAULT_AI_CONFIG
  }
}

/**
 * Save AI configuration to localStorage
 */
export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save AI config:', error)
    throw new Error('Failed to save AI configuration')
  }
}

/**
 * Load user profile from localStorage
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
    console.error('Failed to load user profile:', error)
    return DEFAULT_USER_PROFILE
  }
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
  try {
    const toSave = {
      ...profile,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(toSave))
  } catch (error) {
    console.error('Failed to save user profile:', error)
    throw new Error('Failed to save user profile')
  }
}

/**
 * Clear all AI-related data
 */
export function clearAIData(): void {
  localStorage.removeItem(AI_CONFIG_KEY)
  localStorage.removeItem(USER_PROFILE_KEY)
}
