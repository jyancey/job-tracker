import { useState } from 'react'
import type { Job } from '../domain'
import { useJobPersistence } from './useJobPersistence'

/**
 * Manages top-level application state that backs the shell experience.
 */
export function useAppState(
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void,
) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [activeSavedViewId, setActiveSavedViewId] = useState('')
  const { saveStatus } = useJobPersistence(jobs, setJobs, addNotification)

  return {
    jobs,
    setJobs,
    activeSavedViewId,
    setActiveSavedViewId,
    saveStatus,
  }
}