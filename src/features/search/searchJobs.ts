/* #(@)searchJobs.ts - Multi-token AND-based search
 * 
 * Implements a search function that normalizes and tokenizes the query, 
 * then filters jobs by checking that every token is present in a concatenated
 * string of relevant job fields. This allows for flexible, case-insensitive
 * searching across multiple attributes of a job.
 * 
 * Copyright (c) 2026 John Yancey . All rights reserved.
 */
import type { Job } from '../../domain'

/**
 * Normalize a string by converting it to lowercase and trimming whitespace.
 *
 * @param value - The string to normalize.
 * @returns The normalized string.
 */
function normalize(value: string): string {
  return value.toLowerCase().trim()
}

/**
 * Get a concatenated string of all searchable fields of a job, normalized
 * to lowercase.
 *
 * @param job - The job object to extract search text from.
 * @returns A string containing all searchable fields of the job, concatenated
 *     and lowercased.
 */
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
