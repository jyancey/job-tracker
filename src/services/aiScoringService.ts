/* #(@)aiScoringService.ts - AI Job Scoring Service
 * 
 * This service provides functionality to analyze job descriptions using AI
 * and generate quality scores based on a candidate's profile. It supports
 * multiple AI providers (OpenAI and LM Studio) and includes robust handling
 * of API responses, ensuring that the application can extract meaningful
 * insights from the AI's analysis. The service also includes validation for
 * AI configuration settings and normalization of API endpoints to accommodate
 * different provider requirements. This allows users to receive personalized
 * job scoring that can help them make informed decisions about their job
 * applications.
 */

import type { AIConfig, AIScoreRequest, AIScoreResult, AIProvider, UserProfile } from '../types/ai'

const SCORING_PROMPT = `You are an expert career advisor analyzing job opportunities. Given a job description and a candidate's profile, provide objective quality scores across 5 dimensions on a 0-5 scale:

**Scoring Dimensions:**
- **Fit (0-5)**: How well does the role match the candidate's skills, experience, and career goals?
- **Compensation (0-5)**: How competitive is the salary/compensation relative to market and candidate expectations?
- **Location (0-5)**: How well does the location (remote/hybrid/onsite) match candidate preferences?
- **Growth (0-5)**: What are the career growth, learning, and advancement opportunities?
- **Confidence (0-5)**: How likely is the candidate to get an offer based on their qualifications?

**Instructions:**
1. Analyze the job description carefully
2. Compare against the candidate's profile
3. Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "scoreFit": 3.5,
  "scoreCompensation": 4.0,
  "scoreLocation": 5.0,
  "scoreGrowth": 4.5,
  "scoreConfidence": 3.0,
  "reasoning": "Brief 2-3 sentence explanation of the overall assessment"
}

**Important:** Return ONLY the JSON object. Do not include markdown formatting or code blocks.`

function buildScoringMessages(request: AIScoreRequest) {
  const profileSummary = formatUserProfile(request.userProfile)
  
  const userMessage = `**Candidate Profile:**
${profileSummary}

**Job Details:**
- Company: ${request.company}
- Role: ${request.jobTitle}
${request.salaryRange ? `- Salary Range: ${request.salaryRange}` : ''}

**Job Description:**
${request.jobDescription}

Please analyze this opportunity and provide quality scores.`

  return [
    { role: 'system', content: SCORING_PROMPT },
    { role: 'user', content: userMessage },
  ]
}

function formatUserProfile(profile: UserProfile): string {
  const parts: string[] = []
  
  if (profile.name) parts.push(`Name: ${profile.name}`)
  if (profile.currentRole) parts.push(`Current Role: ${profile.currentRole}`)
  if (profile.yearsExperience) parts.push(`Years Experience: ${profile.yearsExperience}`)
  if (profile.skills?.length) parts.push(`Skills: ${profile.skills.join(', ')}`)
  if (profile.preferredRoles?.length) parts.push(`Preferred Roles: ${profile.preferredRoles.join(', ')}`)
  if (profile.preferredLocation) parts.push(`Location Preference: ${profile.preferredLocation}`)
  if (profile.salaryExpectation) parts.push(`Salary Expectation: ${profile.salaryExpectation}`)
  if (profile.targetIndustries?.length) parts.push(`Target Industries: ${profile.targetIndustries.join(', ')}`)
  if (profile.careerGoals) parts.push(`Career Goals: ${profile.careerGoals}`)
  if (profile.dealBreakers?.length) parts.push(`Deal Breakers: ${profile.dealBreakers.join(', ')}`)
  if (profile.resumeText) parts.push(`\nResume:\n${profile.resumeText}`)
  
  return parts.join('\n')
}

function normalizeApiBaseUrl(baseUrl: string, defaultRoot: string): string {
  const raw = (baseUrl || defaultRoot).trim()
  const withoutTrailingSlash = raw.replace(/\/+$/, '')
  return withoutTrailingSlash.endsWith('/v1')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/v1`
}

function normalizeLmStudioBaseUrl(baseUrl: string): { url: string; nativeApi: boolean } {
  const raw = (baseUrl || 'http://localhost:1234').trim().replace(/\/+$/, '')
  if (raw.endsWith('/api/v1')) {
    return { url: raw, nativeApi: true }
  }

  return {
    url: raw.endsWith('/v1') ? raw : `${raw}/v1`,
    nativeApi: false,
  }
}

async function callOpenAI(config: AIConfig, messages: Array<{ role: string; content: string }>): Promise<string> {
  const baseUrl = normalizeApiBaseUrl(config.baseUrl || '', 'https://api.openai.com')
  const model = config.model || 'gpt-4o-mini'
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

async function callLMStudio(config: AIConfig, messages: Array<{ role: string; content: string }>): Promise<string> {
  const base = normalizeLmStudioBaseUrl(config.baseUrl || '')
  const model = config.model || 'local-model'
  const endpoint = base.nativeApi ? `${base.url}/chat` : `${base.url}/chat/completions`
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LM Studio API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

function parseScoreResponse(content: string): Omit<AIScoreResult, 'analyzedAt' | 'model' | 'provider'> {
  if (!content.trim()) {
    throw new Error('AI returned an empty response — the model may not be loaded or max_tokens was too low')
  }

  // Extract the first JSON object from the response, handling:
  // - bare JSON
  // - JSON wrapped in ```json ... ``` or ``` ... ```
  // - JSON embedded in prose ("Here are the scores: {...}")
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  
  let parsed: Record<string, unknown> | null = null
  
  // Try parsing the matched JSON
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    } catch {
      // JSON might be truncated; will try fallback parsing below
      parsed = null
    }
  }
  
  // Fallback: if JSON parsing fails, extract individual score fields with regex
  if (!parsed) {
    const extractScore = (name: string): number => {
      const pattern = new RegExp(`"${name}"\\s*:\\s*([0-9.]+)`)
      const match = content.match(pattern)
      return match ? Math.max(0, Math.min(5, Number(match[1]))) : 0
    }
    
    // If we have at least one valid score, build a partial result
    const scores = {
      scoreFit: extractScore('scoreFit'),
      scoreCompensation: extractScore('scoreCompensation'),
      scoreLocation: extractScore('scoreLocation'),
      scoreGrowth: extractScore('scoreGrowth'),
      scoreConfidence: extractScore('scoreConfidence'),
    }
    
    // If we extracted any scores (at least one non-zero), use them
    if (Object.values(scores).some((s) => s > 0)) {
      parsed = scores
    } else {
      throw new Error(`No valid JSON object found in AI response: ${content.slice(0, 200)}`)
    }
  }

  // Coerce to number: handles string scores (e.g. "3.5") returned by some models
  const toScore = (val: unknown): number => {
    const n = Number(val)
    return isNaN(n) ? 0 : Math.max(0, Math.min(5, n))
  }

  return {
    scoreFit: toScore(parsed.scoreFit),
    scoreCompensation: toScore(parsed.scoreCompensation),
    scoreLocation: toScore(parsed.scoreLocation),
    scoreGrowth: toScore(parsed.scoreGrowth),
    scoreConfidence: toScore(parsed.scoreConfidence),
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : 'No reasoning provided (response may have been truncated)',
  }
}

export async function scoreJobWithAI(
  request: AIScoreRequest,
  config: AIConfig,
): Promise<AIScoreResult> {
  if (config.provider === 'disabled') {
    throw new Error('AI scoring is disabled. Please configure an AI provider in settings.')
  }

  if (!config.apiKey && config.provider === 'openai') {
    throw new Error('OpenAI API key is required. Please configure it in settings.')
  }

  const messages = buildScoringMessages(request)
  
  let content: string
  let provider: AIProvider
  let model: string

  if (config.provider === 'openai') {
    content = await callOpenAI(config, messages)
    provider = 'openai'
    model = config.model || 'gpt-4o-mini'
  } else if (config.provider === 'lmstudio') {
    content = await callLMStudio(config, messages)
    provider = 'lmstudio'
    model = config.model || 'local-model'
  } else {
    throw new Error(`Unsupported AI provider: ${config.provider}`)
  }

  const scores = parseScoreResponse(content)

  return {
    ...scores,
    analyzedAt: new Date().toISOString(),
    model,
    provider,
  }
}

export function validateAIConfig(config: AIConfig): { valid: boolean; error?: string } {
  if (config.provider === 'disabled') {
    return { valid: true }
  }

  if (config.provider === 'openai' && !config.apiKey) {
    return { valid: false, error: 'OpenAI API key is required' }
  }

  if (config.provider === 'lmstudio' && !config.baseUrl) {
    return { valid: false, error: 'LM Studio base URL is required' }
  }

  return { valid: true }
}
