import type { Job } from '../domain'
import type { StatusFilter } from '../types/filters'
import type { AppShellViewProps } from '../views/AppShellView'
import { useFilterState } from './useFilterState'
import { useViewState } from './useViewState'
import { useUndoStack } from './useUndoStack'
import { useJobForm } from './useJobForm'
import { useNotifications } from './useNotifications'
import { useJobSubmission } from './useJobSubmission'
import { useCompareJobs } from './useCompareJobs'
import { useAppActions } from './useAppActions'
import { useTableViewContext } from './useTableViewContext'
import { useJobOperations } from './useJobOperations'
import { useImportExport } from './useImportExport'
import { useSavedViews } from '../features/savedViews/useSavedViews'
import { useDebouncedValue } from './useDebouncedValue'
import { useAppState } from './useAppState'
import { useSelectionState } from './useSelectionState'
import { usePageReset } from './usePageReset'
import { useSavedViewActions } from './useSavedViewActions'
import { useTaskActions } from './useTaskActions'
import { useTablePipeline } from './useTablePipeline'
import { useTaskData } from './useTaskData'

/**
 * Composes all App-level state and actions into AppShellView props.
 */
export function useAppContentModel(): AppShellViewProps {
  const filters = useFilterState()
  const { savedViews, saveView, deleteView, renameView } = useSavedViews()
  const view = useViewState()
  const undo = useUndoStack()
  const { notifications, addNotification, removeNotification } = useNotifications()
  const { jobs, setJobs, activeSavedViewId, setActiveSavedViewId, saveStatus } = useAppState(addNotification)
  const { draft, editingId, updateDraft, resetForm, startEdit, submitForm } = useJobForm()
  const debouncedQuery = useDebouncedValue(filters.state.query, 300)

  const {
    filteredJobs,
    overdueCount,
    sortedJobs,
    paginatedJobs,
    totalPages,
    sortColumn,
    sortDirection,
    currentPage,
    pageSize,
    handleSort,
    setSortColumn,
    setSortDirection,
    setCurrentPage,
    setPageSize,
  } = useTablePipeline({
    jobs,
    filtersState: filters.state,
    debouncedQuery,
  })

  const { handleRemoveJob: removeJobHelper, handleQuickMove, triggerAiScoring } = useJobOperations({
    editingId,
    resetForm,
    viewingJob: view.viewingJob,
    closeViewOnly: view.closeViewOnly,
    addNotification,
  })

  const {
    selection,
    selectAllCheckboxRef,
    visibleTableIds,
    selectedVisibleIds,
    selectedVisibleCount,
    allVisibleSelected,
  } = useSelectionState(paginatedJobs)

  const {
    importFileRef,
    importMode,
    setImportMode,
    handleExport,
    handleImportClick,
    handleImportFile,
  } = useImportExport({
    jobs,
    setJobs,
    selection,
    undo,
    setCurrentPage,
    addNotification,
  })

  const {
    byStatus,
    dueByDate,
    today,
    todayTasks,
    thisWeekTaskGroups,
    taskOverdueCount,
  } = useTaskData(jobs)

  usePageReset(filters.state, setCurrentPage)

  const { handleSubmitJob } = useJobSubmission({
    editingId,
    submitForm,
    resetForm,
    setJobs,
    triggerAiScoring,
  })

  const {
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
  } = useAppActions({
    jobs,
    setJobs,
    selection,
    visibleTableIds,
    selectedVisibleIds,
    allVisibleSelected,
    undo,
    addNotification,
    removeJobHelper,
    quickMoveHelper: handleQuickMove,
    startEdit,
    openViewOnly: view.openViewOnly,
    closeViewOnly: view.closeViewOnly,
    updateView: view.updateView,
    showOverdueFilter: () => filters.updateStatusFilter('Overdue Follow-ups'),
  })

  const { showCompare, selectedJobs, handleCompare, closeCompare } = useCompareJobs({
    jobs,
    selectedIds: selection.selectedIds,
    addNotification,
  })

  const filterStatusFromAnalytics = (status: StatusFilter) => {
    filters.updateStatusFilter(status)
    view.updateView('table')
    setCurrentPage(1)
  }

  const selectStuckJobFromAnalytics = (job: Job) => {
    view.openViewOnly(job)
  }

  const { applySavedView, saveCurrentView, renameSavedView, deleteSavedView } = useSavedViewActions({
    activeSavedViewId,
    setActiveSavedViewId,
    savedViews,
    saveView,
    deleteView,
    renameView,
    filtersState: filters.state,
    updateFilter: filters.updateFilter,
    updateQuery: filters.updateQuery,
    sortColumn,
    sortDirection,
    setSortColumn,
    setSortDirection,
    setCurrentPage,
    updateView: view.updateView,
    addNotification,
  })

  const {
    handleCompleteTask,
    handleSnoozeTask,
    handleTaskPriorityChange,
    handleQuickAddTaskAction,
  } = useTaskActions({
    setJobs,
    addNotification,
  })

  const tableViewContextValue = useTableViewContext({
    paginatedJobs,
    sortedJobs,
    selectedIds: selection.selectedIds,
    selectedVisibleCount,
    allVisibleSelected,
    sortColumn,
    sortDirection,
    currentPage,
    totalPages,
    pageSize,
    searchQuery: debouncedQuery,
    handleSort,
    toggleJobSelection,
    toggleSelectAllVisible,
    bulkDeleteSelected,
    handleCompare,
    handleQuickMoveJob,
    handleEditJob,
    handleRemoveJob,
    openViewOnly,
    setCurrentPage,
    setPageSize,
    selectAllCheckboxRef,
  })

  return {
    view: view.view,
    updateView: view.updateView,
    viewingJob: view.viewingJob,
    closeViewOnly,
    openViewOnly,
    jobs,
    setJobs,
    notifications,
    removeNotification,
    importFileRef,
    handleImportFile,
    addNotification,
    overdueCount,
    showOverdueOnly,
    saveStatus,
    editingId,
    draft,
    updateDraft,
    handleSubmitJob,
    resetForm,
    handleExport,
    handleImportClick,
    importMode,
    setImportMode,
    canUndo: undo.canUndo,
    handleUndo,
    filtersState: filters.state,
    filterStatusFromAnalytics,
    selectStuckJobFromAnalytics,
    dispatchFilter: filters.dispatch,
    toggleAdvancedFilters: filters.toggleAdvancedFilters,
    clearAdvancedFilters: filters.clearAdvancedFilters,
    searchMatchesCount: filteredJobs.length,
    totalJobsCount: jobs.length,
    savedViews: savedViews.map((saved) => ({ id: saved.id, name: saved.name })),
    activeSavedViewId,
    applySavedView,
    saveCurrentView,
    renameSavedView,
    deleteSavedView,
    tableViewContextValue,
    showCompare,
    selectedJobs,
    closeCompare,
    byStatus,
    handleQuickMoveJob,
    handleEditJob,
    handleRemoveJob,
    dueByDate,
    today,
    todayTasks,
    thisWeekTaskGroups,
    taskOverdueCount,
    handleCompleteTask,
    handleSnoozeTask,
    handleTaskPriorityChange,
    handleQuickAddTaskAction,
    triggerAiScoring,
  }
}