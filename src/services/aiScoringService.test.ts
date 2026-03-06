import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scoreJobWithAI } from './aiScoringService'
import type { AIScoreRequest } from '../types/ai'

const mockRequest: AIScoreRequest = {
  jobDescription: 'Senior frontend role with React and TypeScript',
  jobTitle: 'Senior Frontend Engineer',
  company: 'Acme',
  salaryRange: '$150k-$180k',
  userProfile: {
    skills: ['React', 'TypeScript'],
  },
}

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
