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
