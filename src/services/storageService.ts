// Loads jobs from backend API with automatic fallback to localStorage when API is unavailable.
import type { Job } from '../domain'
import {
  clearStorageLogs,
  downloadStorageLogs,
  getStorageLogText,
  logStorageError,
  logStorageInfo,
  setStorageDebugLogging,
} from '../storage/storageLogger'
import { readFallbackJobs, writeFallbackJobs } from '../storage/fallbackStorage'
import { fetchJobs, isApiUrlPatternError, persistJobs } from './apiClient'

export { clearStorageLogs, downloadStorageLogs, getStorageLogText, setStorageDebugLogging }

/**
 * The result of a {@link loadJobs} call.
 */
export interface LoadJobsResult {
  /** The loaded jobs. Empty when loading failed. */
  jobs: Job[]
  /**
   * `true` if the load attempt succeeded (via API or localStorage fallback).
   * `false` on an unrecoverable error.
   */
  didLoad: boolean
}

/**
 * Load jobs from the backend API, falling back to localStorage when the API is unavailable.
 *
 * Both the API success path and the local fallback path are treated as successful
 * loads. Only an unrecoverable error returns `didLoad: false`.
 *
 * @returns The loaded jobs and a flag indicating whether the load succeeded.
 */
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

/**
 * Persist jobs via the backend API, falling back to localStorage when the API is unavailable.
 *
 * Throws only on an unrecoverable write failure (not when the fallback path succeeds).
 *
 * @param jobs - The complete set of jobs to persist.
 * @throws When the backend write fails and no fallback path is available.
 */
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