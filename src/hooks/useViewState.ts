import { useCallback, useState } from 'react'
import type { Job } from '../domain'

export type View =
  | 'table'
  | 'kanban'
  | 'calendar'
  | 'dashboard'
  | 'analytics'
  | 'today'
  | 'thisWeek'
  | 'profile'
  | 'settings'

/**
 * Custom hook to manage view navigation and modal state
 * Handles what view is displayed and the currently viewed job
 *
 * Returns:
 * - view: Current active view
 * - setView: Change current view
 * - viewingJob: Job being viewed in modal (if any)
 * - openViewOnly: Open job detail modal
 * - closeViewOnly: Close job detail modal
 */

export function useViewState(initialView: View = 'dashboard') {
  const [view, setView] = useState<View>(initialView)
  const [viewingJob, setViewingJob] = useState<Job | null>(null)

  const openViewOnly = useCallback((job: Job) => {
    setViewingJob(job)
  }, [])

  const closeViewOnly = useCallback(() => {
    setViewingJob(null)
  }, [])

  const updateView = useCallback((newView: View) => {
    setView(newView)
  }, [])

  return {
    view,
    updateView,
    viewingJob,
    openViewOnly,
    closeViewOnly,
  }
}
