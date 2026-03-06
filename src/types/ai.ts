/**
 * AI Provider configuration and types
 */

export type AIProvider = 'openai' | 'lmstudio' | 'disabled'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string // For LM Studio or custom endpoints
  model?: string
}

export interface UserProfile {
  name?: string
  currentRole?: string
  yearsExperience?: number
  skills?: string[]
  preferredRoles?: string[]
  preferredCompanySize?: string
  preferredLocation?: string
  salaryExpectation?: string
  targetIndustries?: string[]
  careerGoals?: string
  dealBreakers?: string[]
  resumeText?: string
  updatedAt?: string
}

export interface JobDescription {
  text: string
  source: 'url' | 'paste' | 'upload' | 'scraped'
  sourceUrl?: string
  scrapedAt?: string
}

export interface AIScoreResult {
  scoreFit: number
  scoreCompensation: number
  scoreLocation: number
  scoreGrowth: number
  scoreConfidence: number
  reasoning: string
  analyzedAt: string
  model: string
  provider: AIProvider
}

export interface AIScoreRequest {
  jobDescription: string
  jobTitle: string
  company: string
  salaryRange?: string
  userProfile: UserProfile
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'disabled',
  apiKey: '',
  baseUrl: '',
  model: 'gpt-4o-mini',
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  currentRole: '',
  skills: [],
  preferredRoles: [],
  careerGoals: '',
  dealBreakers: [],
}
