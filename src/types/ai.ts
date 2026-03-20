/* #(@)ai.ts - AI Provider configuration and types
 * 
 * This file defines the types and interfaces related to AI scoring and
 * configuration for the job application tracker. It includes the AIConfig for
 * storing provider settings, the UserProfile for capturing user information
 * that can be used to personalize AI scoring, and the AIScoreResult which
 * represents the output of the AI analysis for a given job. These types are
 * essential for integrating AI features into the application while maintaining
 * type safety and clarity in how AI-related data is structured and used.
 */
export type AIProvider = 'openai' | 'lmstudio' | 'disabled'

/**
 * Configuration for AI scoring, including provider selection and API details.
 * Note: In a real application, sensitive information like API keys should be
 * handled securely and not stored in localStorage or exposed in the frontend
 * code. This is simplified for demonstration purposes.
 */
export interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string // For LM Studio or custom endpoints
  model?: string
}

/**
 * User profile information used to personalize AI job scoring and 
 * recommendations. This can be expanded with additional fields as needed to
 * capture more details about the user's background and preferences.
 */
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

/**
 * Represents a job description and its source, along with the AI scoring 
 * results. The AIScoreResult includes various scoring dimensions and the 
 * reasoning behind the scores, which can be displayed to the user for 
 * transparency. The JobDescription captures where the job information came 
 * from, which can be useful for auditing and improving the AI analysis 
 * over time.
 */
export interface JobDescription {
  text: string
  source: 'url' | 'paste' | 'upload' | 'scraped'
  sourceUrl?: string
  scrapedAt?: string
}

/**
 * The result of AI scoring for a job, including individual scores for fit,
 * compensation, location, growth potential, and confidence. The reasoning
 * field provides an explanation of how the scores were determined, which can
 * help users understand the AI's assessment. The analyzedAt timestamp indicates
 * when the analysis was performed, and the model and provider fields specify
 * which AI configuration was used for the scoring.
 */
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
