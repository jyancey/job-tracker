import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { Job } from '../domain'
import { loadJobs, saveJobs } from '../storage'
import * as jobService from '../services/jobService'

/**
 * Handles initial storage hydration and autosave persistence for jobs.
 */
export function useJobPersistence(
  jobs: Job[],
  setJobs: Dispatch<SetStateAction<Job[]>>,
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void,
) {
  const [isStorageHydrated, setIsStorageHydrated] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending'>('idle')
  const saveRequestIdRef = useRef(0)
  const notifyRef = useRef(addNotification)

  useEffect(() => {
    notifyRef.current = addNotification
  }, [addNotification])

  useEffect(() => {
    let isDisposed = false

    async function hydrateFromStorage(): Promise<void> {
      const result = await loadJobs()
      if (isDisposed) {
        return
      }

      setJobs(result.jobs.sort(jobService.sortByApplicationDateDesc))
      setIsStorageHydrated(result.didLoad)

      if (!result.didLoad) {
        notifyRef.current('Storage is unavailable. Existing jobs were not loaded.', 'error')
      }
    }

    void hydrateFromStorage()

    return () => {
      isDisposed = true
    }
  }, [setJobs])

  useEffect(() => {
    if (!isStorageHydrated) {
      return
    }

    const requestId = saveRequestIdRef.current + 1
    saveRequestIdRef.current = requestId
    let isCancelled = false

    setSaveStatus('pending')

    async function persistJobs(): Promise<void> {
      try {
        await saveJobs(jobs)
      } catch {
        if (!isCancelled) {
          notifyRef.current('Autosave failed. Your latest changes are not yet persisted.', 'error')
        }
      } finally {
        if (!isCancelled && requestId === saveRequestIdRef.current) {
          setSaveStatus('idle')
        }
      }
    }

    void persistJobs()

    return () => {
      isCancelled = true
    }
  }, [jobs, isStorageHydrated])

  return {
    isStorageHydrated,
    saveStatus,
  }
}
