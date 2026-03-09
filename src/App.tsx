import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import type { Job, JobPriority } from './domain'
import {
  useJobFiltering,
  useJobSorting,
  useJobPagination,
} from './hooks/useJobFiltering'
import { useFilterState } from './hooks/useFilterState'
import { useJobSelection } from './hooks/useJobSelection'
import { useViewState } from './hooks/useViewState'
import { useUndoStack } from './hooks/useUndoStack'
import { useJobGrouping } from './hooks/useJobGrouping'
import { useJobForm } from './hooks/useJobForm'
import { useNotifications } from './hooks/useNotifications'
import { useJobPersistence } from './hooks/useJobPersistence'
import { useJobSubmission } from './hooks/useJobSubmission'
import { useCompareJobs } from './hooks/useCompareJobs'
import { useAppActions } from './hooks/useAppActions'
import { useTableSelectionState } from './hooks/useTableSelectionState'
import { useSortAndPagination } from './hooks/useSortAndPagination'
import { useTableViewContext } from './hooks/useTableViewContext'
import { useJobOperations } from './hooks/useJobOperations'
import { useImportExport } from './hooks/useImportExport'
import type { StatusFilter } from './types/filters'
import { AppShellView } from './views/AppShellView'
import { ErrorBoundary } from './components/ErrorBoundary'
import { getTodayString } from './utils/dateUtils'
import { countOverdueTasks, getThisWeekTasks, getTodayTasks, groupTasksByDueDate } from './features/tasks/taskFilters'
import * as jobService from './services/jobService'
import { useSavedViews } from './features/savedViews/useSavedViews'

function AppContent() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [activeSavedViewId, setActiveSavedViewId] = useState('')
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)

  // State management hooks
  const filters = useFilterState()
  const { savedViews, saveView, deleteView, renameView } = useSavedViews()
  const selection = useJobSelection()
  const view = useViewState()
  const undo = useUndoStack()
  const { notifications, addNotification, removeNotification } = useNotifications()
  const { saveStatus } = useJobPersistence(jobs, setJobs, addNotification)
  const { draft, editingId, updateDraft, resetForm, startEdit, submitForm } = useJobForm()

  // Data filtering and transformation
  const { filteredJobs, overdueCount } = useJobFiltering(jobs, filters.state)
  const sortedTableJobs = useJobSorting(filteredJobs, { sortColumn: 'applicationDate', sortDirection: 'desc' })
  const { totalPages: tempTotalPages } = useJobPagination(sortedTableJobs, {
    currentPage: 1,
    pageSize: 10,
  })

  // Sort and pagination state management
  const { sortColumn, sortDirection, currentPage, pageSize, handleSort, setSortColumn, setSortDirection, setCurrentPage, setPageSize } =
    useSortAndPagination({ totalPages: tempTotalPages })

  // Recompute paginated jobs with sort applied
  const recomputedSortedTableJobs = useJobSorting(filteredJobs, {
    sortColumn,
    sortDirection,
  })

  const { paginatedJobs, totalPages } = useJobPagination(recomputedSortedTableJobs, {
    currentPage,
    pageSize,
  })

  // Job operations (mutations, AI scoring)
  const { handleRemoveJob: removeJobHelper, handleQuickMove, triggerAiScoring } = useJobOperations({
    editingId,
    resetForm,
    viewingJob: view.viewingJob,
    closeViewOnly: view.closeViewOnly,
    addNotification,
  })

  // Import/Export operations
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

  // Grouping for other views
  const { byStatus, dueByDate } = useJobGrouping(jobs)
  const today = getTodayString()

  const todayTasks = useMemo(() => getTodayTasks(jobs, today), [jobs, today])
  const thisWeekTasks = useMemo(() => getThisWeekTasks(jobs, today), [jobs, today])
  const thisWeekGroupedTasks = useMemo(() => groupTasksByDueDate(thisWeekTasks), [thisWeekTasks])
  const taskOverdueCount = useMemo(() => countOverdueTasks(jobs, today), [jobs, today])

  // Table selection state
  const { visibleTableIds, selectedVisibleIds, selectedVisibleCount, allVisibleSelected } =
    useTableSelectionState(paginatedJobs, selection.selectedIds, selectAllCheckboxRef)

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [
    filters.state.query,
    filters.state.statusFilter,
    filters.state.dateRangeStart,
    filters.state.dateRangeEnd,
    filters.state.salaryRangeMin,
    filters.state.salaryRangeMax,
    filters.state.contactPersonFilter,
    setCurrentPage,
  ])

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

  const applySavedView = (id: string) => {
    if (!id) {
      setActiveSavedViewId('')
      return
    }

    const preset = savedViews.find((viewPreset) => viewPreset.id === id)
    if (!preset) {
      return
    }

    filters.updateFilter(preset.filters)
    setSortColumn(preset.sortColumn)
    setSortDirection(preset.sortDirection)
    setCurrentPage(1)
    view.updateView('table')
    setActiveSavedViewId(id)
    addNotification(`Applied saved view: ${preset.name}`, 'info')
  }

  const saveCurrentView = () => {
    const defaultName = activeSavedViewId
      ? savedViews.find((viewPreset) => viewPreset.id === activeSavedViewId)?.name ?? 'Saved View'
      : `Saved View ${savedViews.length + 1}`
    const name = window.prompt('Save current filters as:', defaultName)?.trim()
    if (!name) {
      return
    }

    const savedId = saveView({
      id: activeSavedViewId || undefined,
      name,
      filters: filters.state,
      sortColumn,
      sortDirection,
    })
    setActiveSavedViewId(savedId)
    addNotification('Saved current view', 'success')
  }

  const renameSavedView = () => {
    if (!activeSavedViewId) {
      return
    }

    const current = savedViews.find((viewPreset) => viewPreset.id === activeSavedViewId)
    if (!current) {
      return
    }

    const nextName = window.prompt('Rename saved view:', current.name)?.trim()
    if (!nextName) {
      return
    }

    renameView(activeSavedViewId, nextName)
    addNotification('Saved view renamed', 'success')
  }

  const deleteSavedView = () => {
    if (!activeSavedViewId) {
      return
    }

    const current = savedViews.find((viewPreset) => viewPreset.id === activeSavedViewId)
    if (!current) {
      return
    }

    const confirmed = window.confirm(`Delete saved view \"${current.name}\"?`)
    if (!confirmed) {
      return
    }

    deleteView(activeSavedViewId)
    setActiveSavedViewId('')
    addNotification('Saved view deleted', 'info')
  }

  const handleCompleteTask = (jobId: string) => {
    setJobs((current) => jobService.completeJobAction(current, jobId))
    addNotification('Task marked complete', 'success')
  }

  const handleSnoozeTask = (jobId: string, days: number) => {
    setJobs((current) => jobService.snoozeJobAction(current, jobId, days))
    addNotification(`Task snoozed by ${days} day(s)`, 'info')
  }

  const handleTaskPriorityChange = (jobId: string, priority: JobPriority) => {
    setJobs((current) => jobService.updateJobPriority(current, jobId, priority))
  }

  const handleQuickAddTaskAction = (jobId: string, action: string, dueDate: string) => {
    setJobs((current) => jobService.updateJobTaskAction(current, jobId, action, dueDate))
    addNotification('Task updated', 'success')
  }

  // Build table view context
  const tableViewContextValue = useTableViewContext({
    paginatedJobs,
    sortedJobs: recomputedSortedTableJobs,
    selectedIds: selection.selectedIds,
    selectedVisibleCount,
    allVisibleSelected,
    sortColumn,
    sortDirection,
    currentPage,
    totalPages,
    pageSize,
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

  return (
    <AppShellView
      view={view.view}
      updateView={view.updateView}
      viewingJob={view.viewingJob}
      closeViewOnly={closeViewOnly}
      openViewOnly={openViewOnly}
      jobs={jobs}
      setJobs={setJobs}
      notifications={notifications}
      removeNotification={removeNotification}
      importFileRef={importFileRef}
      handleImportFile={handleImportFile}
      addNotification={addNotification}
      overdueCount={overdueCount}
      showOverdueOnly={showOverdueOnly}
      saveStatus={saveStatus}
      editingId={editingId}
      draft={draft}
      updateDraft={updateDraft}
      handleSubmitJob={handleSubmitJob}
      resetForm={resetForm}
      handleExport={handleExport}
      handleImportClick={handleImportClick}
      importMode={importMode}
      setImportMode={setImportMode}
      canUndo={undo.canUndo}
      handleUndo={handleUndo}
      filtersState={filters.state}
      filterStatusFromAnalytics={filterStatusFromAnalytics}
      selectStuckJobFromAnalytics={selectStuckJobFromAnalytics}
      dispatchFilter={filters.dispatch}
      toggleAdvancedFilters={filters.toggleAdvancedFilters}
      clearAdvancedFilters={filters.clearAdvancedFilters}
      savedViews={savedViews.map((saved) => ({ id: saved.id, name: saved.name }))}
      activeSavedViewId={activeSavedViewId}
      applySavedView={applySavedView}
      saveCurrentView={saveCurrentView}
      renameSavedView={renameSavedView}
      deleteSavedView={deleteSavedView}
      tableViewContextValue={tableViewContextValue}
      showCompare={showCompare}
      selectedJobs={selectedJobs}
      closeCompare={closeCompare}
      byStatus={byStatus}
      handleQuickMoveJob={handleQuickMoveJob}
      handleEditJob={handleEditJob}
      handleRemoveJob={handleRemoveJob}
      dueByDate={dueByDate}
      today={today}
      todayTasks={todayTasks}
      thisWeekTaskGroups={thisWeekGroupedTasks}
      taskOverdueCount={taskOverdueCount}
      handleCompleteTask={handleCompleteTask}
      handleSnoozeTask={handleSnoozeTask}
      handleTaskPriorityChange={handleTaskPriorityChange}
      handleQuickAddTaskAction={handleQuickAddTaskAction}
    />
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
