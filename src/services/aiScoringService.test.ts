/* #(@)aiScoringService.test.ts - Tests for AI scoring service
 *
 * This test suite verifies the functionality of the AI scoring service,
 * which is responsible for sending job descriptions and user profiles to
 * an AI provider and parsing the resulting scores. The tests cover endpoint
 * normalization for different LM Studio configurations, as well as robust
 * response parsing to handle various formats that the AI might return. By
 * ensuring that the service correctly constructs API requests and accurately
 * extracts scoring information from responses, we can maintain a reliable
 * and user-friendly AI integration in the job application tracker.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scoreJobWithAI } from './aiScoringService'
import type { AIScoreRequest } from '../types/ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scoreJobWithAI } from './aiScoringService'
import type { AIScoreRequest } from '../types/ai'

/**
 * Tests for the AI scoring service, focusing on endpoint normalization for LM Studio configurations and robust response parsing to handle various AI response formats. The tests ensure that the service correctly constructs API requests based on different base URL configurations and can accurately extract scoring information from responses that may include JSON wrapped in code blocks or embedded in prose. This helps maintain a reliable integration with AI providers and ensures that users receive accurate job scoring based on their profiles and job descriptions.
 */
const mockRequest: AIScoreRequest = {
  jobDescription: 'Senior frontend role with React and TypeScript',
  jobTitle: 'Senior Frontend Engineer',
  company: 'Acme',
  salaryRange: '$150k-$180k',
  userProfile: {
    skills: ['React', 'TypeScript'],
  },
}

/**
 * Mocks an AI response for testing purposes. The response includes a JSON
 * object with scoring information wrapped in the expected structure returned
 * by the AI provider. This allows us to test the response parsing logic of
 * the AI scoring service without making actual API calls to an AI provider,
 * ensuring that our tests are fast and reliable.
 * @returns {Response} A mocked AI response.
 */
function mockAiResponse() {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              scoreFit: 4,
              scoreCompensation: 4,
              scoreLocation: 3,
              scoreGrowth: 4,
              scoreConfidence: 3,
              reasoning: 'Good fit based on stack and experience.',
            }),
          },
        },
      ],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

describe('aiScoringService endpoint normalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('uses /v1/chat/completions when LM Studio base URL has no /v1', async () => {
    const fetchMock = vi.fn(async () => mockAiResponse())
    vi.stubGlobal('fetch', fetchMock)

    await scoreJobWithAI(mockRequest, {
      provider: 'lmstudio',
      apiKey: '',
      baseUrl: 'http://localhost:1234',
      model: 'local-model',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:1234/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('does not duplicate /v1 when LM Studio base URL already includes it', async () => {
    const fetchMock = vi.fn(async () => mockAiResponse())
    vi.stubGlobal('fetch', fetchMock)

    await scoreJobWithAI(mockRequest, {
      provider: 'lmstudio',
      apiKey: '',
      baseUrl: 'http://localhost:1234/v1',
      model: 'local-model',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:1234/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('uses /api/v1/chat when LM Studio native API base URL is configured', async () => {
    const fetchMock = vi.fn(async () => mockAiResponse())
    vi.stubGlobal('fetch', fetchMock)

    await scoreJobWithAI(mockRequest, {
      provider: 'lmstudio',
      apiKey: '',
      baseUrl: 'http://localhost:1234/api/v1',
      model: 'local-model',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:1234/api/v1/chat',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

/**
 * Tests for the AI scoring service response parsing, ensuring that the service
 * can handle various formats of AI responses, including clean JSON, JSON
 * wrapped in code blocks, and JSON embedded in prose. The tests also verify
 * that string scores are correctly parsed as numbers and that scores are
 * clamped to the expected range. Additionally, the tests check that
 * descriptive errors are thrown when the AI response is empty or does not
 * contain valid JSON, helping to maintain robustness and reliability in the
 * AI integration.
 * 
 * By simulating different response scenarios, we can ensure that the AI
 * scoring service is resilient to variations in how AI providers may format
 * their responses, ultimately providing a better user experience when users
 * receive their job scores and reasoning.
 * 
 */
describe('aiScoringService response parsing', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const baseConfig = { provider: 'lmstudio' as const, apiKey: '', baseUrl: 'http://localhost:1234', model: 'local-model' }

  function mockContent(content: string) {
    return vi.fn(async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
  }

  const validJson = JSON.stringify({
    scoreFit: 4, scoreCompensation: 3, scoreLocation: 5, scoreGrowth: 4, scoreConfidence: 3,
    reasoning: 'Good fit.',
  })

  it('parses clean JSON response', async () => {
    vi.stubGlobal('fetch', mockContent(validJson))
    const result = await scoreJobWithAI(mockRequest, baseConfig)
    expect(result.scoreFit).toBe(4)
    expect(result.reasoning).toBe('Good fit.')
  })

  it('parses JSON wrapped in ```json code block', async () => {
    vi.stubGlobal('fetch', mockContent('```json\n' + validJson + '\n```'))
    const result = await scoreJobWithAI(mockRequest, baseConfig)
    expect(result.scoreFit).toBe(4)
  })

  it('parses JSON embedded in prose', async () => {
    vi.stubGlobal('fetch', mockContent('Here are the scores:\n' + validJson + '\nLet me know if you have questions.'))
    const result = await scoreJobWithAI(mockRequest, baseConfig)
    expect(result.scoreFit).toBe(4)
  })

  it('handles string scores returned by some models', async () => {
    const stringJson = JSON.stringify({
      scoreFit: '4', scoreCompensation: '3.5', scoreLocation: '5', scoreGrowth: '4', scoreConfidence: '3',
      reasoning: 'Good fit.',
    })
    vi.stubGlobal('fetch', mockContent(stringJson))
    const result = await scoreJobWithAI(mockRequest, baseConfig)
    expect(result.scoreFit).toBe(4)
    expect(result.scoreCompensation).toBe(3.5)
  })

  it('clamps scores to 0-5 range', async () => {
    const outOfRangeJson = JSON.stringify({
      scoreFit: 10, scoreCompensation: -2, scoreLocation: 5, scoreGrowth: 4, scoreConfidence: 3,
      reasoning: 'test',
    })
    vi.stubGlobal('fetch', mockContent(outOfRangeJson))
    const result = await scoreJobWithAI(mockRequest, baseConfig)
    expect(result.scoreFit).toBe(5)
    expect(result.scoreCompensation).toBe(0)
  })

  it('throws a descriptive error on empty response', async () => {
    vi.stubGlobal('fetch', mockContent(''))
    await expect(scoreJobWithAI(mockRequest, baseConfig)).rejects.toThrow('AI returned an empty response')
  })

  it('throws a descriptive error when response contains no JSON', async () => {
    vi.stubGlobal('fetch', mockContent('Sorry, I cannot score this job.'))
    await expect(scoreJobWithAI(mockRequest, baseConfig)).rejects.toThrow('No valid JSON object found in AI response')
  })

  it('extracts scores from truncated/incomplete JSON (fallback parsing)', async () => {
    // Simulate a truncated response like the LM Studio gpt-oss model returned
    const truncatedJson = '{"scoreFit":4.5,"scoreCompensation":4.0,"scoreLocation":5.0,"scoreGrowth":4.5,"scoreConfidence":3.5,"reasoning":"John\'s 35‑year leadership in large SaaS and DevOps environments aligns strongly with JFrog\'s VP role, though his'
    vi.stubGlobal('fetch', mockContent(truncatedJson))
    const result = await scoreJobWithAI(mockRequest, baseConfig)
    // Verify we extracted the scores even though the JSON was incomplete
    expect(result.scoreFit).toBe(4.5)
    expect(result.scoreCompensation).toBe(4.0)
    expect(result.scoreLocation).toBe(5.0)
    expect(result.scoreGrowth).toBe(4.5)
    expect(result.scoreConfidence).toBe(3.5)
    expect(result.reasoning).toContain('truncated')
  })
})
