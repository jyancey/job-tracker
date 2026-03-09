import type { Job } from './domain'
import {
  clearStorageLogs,
  downloadStorageLogs,
  getStorageLogText,
  logStorageError,
  logStorageInfo,
  setStorageDebugLogging,
} from './storage/storageLogger'
import { readFallbackJobs, writeFallbackJobs } from './storage/fallbackStorage'
import { fetchJobs, isApiUrlPatternError, persistJobs } from './storage/jobsApi'

export { clearStorageLogs, downloadStorageLogs, getStorageLogText, setStorageDebugLogging }

export interface LoadJobsResult {
  jobs: Job[]
  didLoad: boolean
}

export async function loadJobs(): Promise<LoadJobsResult> {
  const startedAt = performance.now()
  try {
    const jobs = await fetchJobs()

    logStorageInfo('loaded jobs', {
      count: jobs.length,
      durationMs: Math.round(performance.now() - startedAt),
    })
    return {
      jobs,
      didLoad: true,
    }
  } catch (error) {
    if (isApiUrlPatternError(error)) {
      const jobs = readFallbackJobs()
      logStorageInfo('loaded jobs from local fallback', {
        count: jobs.length,
        durationMs: Math.round(performance.now() - startedAt),
      })
      return {
        jobs,
        didLoad: true,
      }
    }

    logStorageError('failed to load jobs', error)
    return {
      jobs: [],
      didLoad: false,
    }
  }
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  const startedAt = performance.now()
  logStorageInfo('saving jobs', { count: jobs.length })

  try {
    await persistJobs(jobs)

    logStorageInfo('saved jobs', {
      count: jobs.length,
      durationMs: Math.round(performance.now() - startedAt),
    })
  } catch (error) {
    if (isApiUrlPatternError(error)) {
      writeFallbackJobs(jobs)
      logStorageInfo('saved jobs to local fallback', {
        count: jobs.length,
        durationMs: Math.round(performance.now() - startedAt),
      })
      return
    }

    logStorageError('failed to save jobs', error)
    throw error
  }
}
