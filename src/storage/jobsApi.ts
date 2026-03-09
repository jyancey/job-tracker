import type { Job } from '../domain'

const API_JOBS_ENDPOINT = '/api/jobs'

export function isApiUrlPatternError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes('did not match the expected pattern') || message.includes('failed to parse url')
}

export async function fetchJobs(): Promise<Job[]> {
  const response = await fetch(API_JOBS_ENDPOINT)
  if (!response.ok) {
    throw new Error(`load failed with status ${response.status}`)
  }

  const payload = (await response.json()) as { jobs?: Job[] }
  return Array.isArray(payload.jobs) ? payload.jobs : []
}

export async function persistJobs(jobs: Job[]): Promise<void> {
  const response = await fetch(API_JOBS_ENDPOINT, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobs }),
  })

  if (!response.ok) {
    throw new Error(`save failed with status ${response.status}`)
  }
}
