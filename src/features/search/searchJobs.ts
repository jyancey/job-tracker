import type { Job } from '../../domain'

function normalize(value: string): string {
  return value.toLowerCase().trim()
}

function getSearchText(job: Job): string {
  return [
    job.company,
    job.roleTitle,
    job.notes,
    job.contactPerson,
    job.nextAction,
    job.salaryRange,
    job.status,
  ]
    .join(' ')
    .toLowerCase()
}

/**
 * Filter a list of jobs by a search query.
 *
 * Matches against a normalized concatenation of company, role, notes, contact,
 * next action, salary range, and status. All query tokens must match
 * (AND-based, case-insensitive, whitespace-tokenized).
 *
 * @param jobs - The full list of jobs to search.
 * @param query - The search string. Returns all jobs unchanged when empty.
 * @returns The subset of jobs matching every token in the query.
 */
export function searchJobs(jobs: Job[], query: string): Job[] {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) {
    return jobs
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  if (!tokens.length) {
    return jobs
  }

  return jobs.filter((job) => {
    const haystack = getSearchText(job)
    return tokens.every((token) => haystack.includes(token))
  })
}
