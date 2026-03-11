import { useMemo } from 'react'
import './App.css'
import type { Job } from './domain'
import {
  useJobFiltering,
  useJobSorting,
  useJobPagination,
} from './hooks/useJobFiltering'
import { useFilterState } from './hooks/useFilterState'
import { useViewState } from './hooks/useViewState'
import { useUndoStack } from './hooks/useUndoStack'
import { useJobGrouping } from './hooks/useJobGrouping'
import { useJobForm } from './hooks/useJobForm'
import { useNotifications } from './hooks/useNotifications'
import { useJobSubmission } from './hooks/useJobSubmission'
import { useCompareJobs } from './hooks/useCompareJobs'
import { useAppActions } from './hooks/useAppActions'
import { useSortAndPagination } from './hooks/useSortAndPagination'
import { useTableViewContext } from './hooks/useTableViewContext'
import { useJobOperations } from './hooks/useJobOperations'
import { useImportExport } from './hooks/useImportExport'
import type { StatusFilter } from './types/filters'
import { AppShellView } from './views/AppShellView'
import { ErrorBoundary } from './components/ErrorBoundary'
import { getTodayString } from './utils/dateUtils'
import { countOverdueTasks, getThisWeekTasks, getTodayTasks, groupTasksByDueDate } from './features/tasks/taskFilters'
import { useSavedViews } from './features/savedViews/useSavedViews'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useAppState } from './hooks/useAppState'
import { useSelectionState } from './hooks/useSelectionState'
import { usePageReset } from './hooks/usePageReset'
import { useSavedViewActions } from './hooks/useSavedViewActions'
import { useTaskActions } from './hooks/useTaskActions'

function AppContent() {
  // State management hooks
  const filters = useFilterState()
  const { savedViews, saveView, deleteView, renameView } = useSavedViews()
  const view = useViewState()
  const undo = useUndoStack()
  const { notifications, addNotification, removeNotification } = useNotifications()
  const { jobs, setJobs, activeSavedViewId, setActiveSavedViewId, saveStatus } = useAppState(addNotification)
  const { draft, editingId, updateDraft, resetForm, startEdit, submitForm } = useJobForm()
  const debouncedQuery = useDebouncedValue(filters.state.query, 300)

  // Data filtering and transformation
  const { filteredJobs, overdueCount } = useJobFiltering(jobs, {
    ...filters.state,
    query: debouncedQuery,
  })
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

  // Table selection state
  const {
    selection,
    selectAllCheckboxRef,
    visibleTableIds,
    selectedVisibleIds,
    selectedVisibleCount,
    allVisibleSelected,
  } = useSelectionState(paginatedJobs)

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

  // Reset page on filter changes
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
      searchMatchesCount={filteredJobs.length}
      totalJobsCount={jobs.length}
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
      triggerAiScoring={triggerAiScoring}
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
