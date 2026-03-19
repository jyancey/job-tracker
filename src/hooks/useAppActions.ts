// Provides user action handlers for job operations, selection management, and view navigation.
import { useCallback } from 'react'
import type { Job, JobStatus } from '../domain'
import * as jobService from '../services/jobService'
import type { View } from './useViewState'

interface SelectionApi {
  selectedIds: Set<string>
  toggle: (id: string) => void
  toggleAll: (ids: string[], allSelected: boolean) => void
  removeMultiple: (ids: string[]) => void
}

interface UndoApi {
  pushState: (jobs: Job[]) => void
  undo: () => Job[] | undefined
}

interface UseAppActionsProps {
  jobs: Job[]
  setJobs: (updater: (jobs: Job[]) => Job[]) => void
  selection: SelectionApi
  visibleTableIds: string[]
  selectedVisibleIds: string[]
  allVisibleSelected: boolean
  undo: UndoApi
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
  removeJobHelper: (id: string, setJobs: (updater: (jobs: Job[]) => Job[]) => void) => void
  quickMoveHelper: (
    id: string,
    nextStatus: JobStatus,
    setJobs: (updater: (jobs: Job[]) => Job[]) => void,
  ) => void
  startEdit: (job: Job) => void
  openViewOnly: (job: Job) => void
  closeViewOnly: () => void
  updateView: (view: View) => void
  showOverdueFilter: () => void
}

export function useAppActions({
  jobs,
  setJobs,
  selection,
  visibleTableIds,
  selectedVisibleIds,
  allVisibleSelected,
  undo,
  addNotification,
  removeJobHelper,
  quickMoveHelper,
  startEdit,
  openViewOnly,
  closeViewOnly,
  updateView,
  showOverdueFilter,
}: UseAppActionsProps) {
  const handleEditJob = useCallback(
    (job: Job) => {
      startEdit(job)
    },
    [startEdit],
  )

  const handleRemoveJob = useCallback(
    (id: string) => {
      removeJobHelper(id, setJobs)
    },
    [removeJobHelper, setJobs],
  )

  const handleQuickMoveJob = useCallback(
    (id: string, nextStatus: JobStatus) => {
      quickMoveHelper(id, nextStatus, setJobs)
    },
    [quickMoveHelper, setJobs],
  )

  const toggleJobSelection = useCallback(
    (id: string) => {
      selection.toggle(id)
    },
    [selection],
  )

  const toggleSelectAllVisible = useCallback(() => {
    if (visibleTableIds.length === 0) {
      return
    }
    selection.toggleAll(visibleTableIds, allVisibleSelected)
  }, [visibleTableIds, allVisibleSelected, selection])

  const bulkDeleteSelected = useCallback(() => {
    if (selectedVisibleIds.length === 0) return

    const hiddenSelectedCount = selection.selectedIds.size - selectedVisibleIds.length
    undo.pushState(jobs)
    setJobs((current) => jobService.deleteJobs(current, selectedVisibleIds))
    selection.removeMultiple(selectedVisibleIds)
    addNotification(
      `Deleted ${selectedVisibleIds.length} visible job(s). ${hiddenSelectedCount > 0 ? `${hiddenSelectedCount} hidden selection(s) kept.` : ''}`,
      'success',
    )
  }, [selectedVisibleIds, selection, undo, jobs, setJobs, addNotification])

  const handleUndo = useCallback(() => {
    const previous = undo.undo()
    if (previous) {
      setJobs(() => previous)
      addNotification('Undo successful', 'info')
    }
  }, [undo, setJobs, addNotification])

  const showOverdueOnly = useCallback(() => {
    updateView('table')
    showOverdueFilter()
  }, [updateView, showOverdueFilter])

  return {
    handleEditJob,
    handleRemoveJob,
    handleQuickMoveJob,
    toggleJobSelection,
    toggleSelectAllVisible,
    bulkDeleteSelected,
    handleUndo,
    showOverdueOnly,
    openViewOnly,
    closeViewOnly,
  }
}
