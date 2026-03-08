import { useEffect, useRef, useState } from 'react'
import './App.css'
import type { Job } from './domain'
import { KanbanBoard } from './components/KanbanBoard'
import { downloadStorageLogs } from './storage'
import { ToastContainer } from './components/Toast'
import { APP_VERSION, GIT_BRANCH } from './version'
import {
  useJobFiltering,
  useJobSorting,
  useJobPagination,
} from './hooks/useJobFiltering'
import { useFilterState } from './hooks/useFilterState'
import { useJobSelection } from './hooks/useJobSelection'
import { useViewState, type View } from './hooks/useViewState'
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
import { TableView } from './views/TableView'
import { CalendarView } from './views/CalendarView'
import { DashboardView } from './views/DashboardView'
import { AnalyticsView } from './views/AnalyticsView'
import { CompareView } from './views/CompareView'
import { ProfileView } from './views/ProfileView'
import { SettingsView } from './views/SettingsView'
import { TableViewProvider } from './views/table/TableViewContext'
import { JobForm } from './components/JobForm'
import { JobModal } from './components/JobModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FilterToolbar } from './components/FilterToolbar'

const VIEW_LABELS: Record<View, string> = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  kanban: 'Kanban',
  calendar: 'Calendar',
  table: 'All Jobs',
  profile: 'Profile',
  settings: 'Settings',
}

function AppContent() {
  const [jobs, setJobs] = useState<Job[]>([])
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)

  // State management hooks
  const filters = useFilterState()
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
  const { sortColumn, sortDirection, currentPage, pageSize, handleSort, setCurrentPage, setPageSize } =
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
    <div className="app-shell">
      <div className="version-badge" title={`Version ${APP_VERSION} on ${GIT_BRANCH}`}>
        {APP_VERSION}
      </div>
      <input
        ref={importFileRef}
        type="file"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />
      <ToastContainer notifications={notifications} onRemove={removeNotification} />

      {view.view === 'profile' ? (
        <ProfileView onClose={() => view.updateView('table')} />
      ) : view.view === 'settings' ? (
        <SettingsView
          onClose={() => view.updateView('table')}
          jobs={jobs}
          setJobs={setJobs}
          addNotification={addNotification}
        />
      ) : (
        <>
          <section className="top-grid">
            <header className="hero">
              <div className="hero-actions" role="group" aria-label="Profile and settings actions">
                <button
                  type="button"
                  className="small ghost"
                  onClick={() => view.updateView('profile')}
                  title="Open profile"
                >
                  Profile
                </button>
                <button
                  type="button"
                  className="small ghost"
                  onClick={() => view.updateView('settings')}
                  title="Open settings"
                >
                  Settings
                </button>
              </div>
              <div className="hero-bottom">
                <div className="hero-content">
                  <p className="eyebrow">Job Tracker</p>
                  <h1>Track your search like a pipeline, not a spreadsheet.</h1>
                  <p>
                    Local-only and private. Add opportunities, manage follow-ups, and monitor momentum from
                    one workspace.
                  </p>
                </div>
                <div className="hero-metrics">
                  <article>
                    <span>Total Jobs</span>
                    <strong>{jobs.length}</strong>
                  </article>
                  <article>
                    <span>Open Pipeline</span>
                    <strong>
                      {jobs.filter((job) => !['Rejected', 'Withdrawn'].includes(job.status)).length}
                    </strong>
                  </article>
                  <article>
                    <span>Overdue Follow-ups</span>
                    <strong>{overdueCount}</strong>
                    <button
                      type="button"
                      className="ghost small metric-action"
                      onClick={showOverdueOnly}
                    >
                      View list
                    </button>
                  </article>
                </div>
              </div>
            </header>

            <section className="panel form-panel">
              <div className="form-header">
                <div>
                  <h2>{editingId ? 'Edit Job' : 'Add Job'}</h2>
                  {saveStatus === 'pending' && <span className="save-status">Saving...</span>}
                </div>
                <div className="form-actions-top">
                  <button type="button" className="small" onClick={() => handleExport('json')}>
                    Export JSON
                  </button>
                  <button type="button" className="small" onClick={() => handleExport('csv')}>
                    Export CSV
                  </button>
                  <button type="button" className="small" onClick={handleImportClick}>
                    Import
                  </button>
                  <select
                    className="compact-select"
                    value={importMode}
                    onChange={(event) => setImportMode(event.target.value as any)}
                    title="Import behavior"
                  >
                    <option value="append">Import: Append</option>
                    <option value="upsert">Import: Upsert by ID</option>
                    <option value="replace">Import: Replace All</option>
                  </select>
                  <button type="button" className="small ghost" onClick={() => downloadStorageLogs()}>
                    Export DB Logs
                  </button>
                  {undo.canUndo && (
                    <button type="button" className="small" onClick={handleUndo}>
                      Undo
                    </button>
                  )}
                </div>
              </div>
              <JobForm
                draft={draft}
                editingId={editingId}
                onUpdateDraft={updateDraft}
                onSubmit={handleSubmitJob}
                onCancel={resetForm}
              />
            </section>
          </section>

          <main className="content-grid">
            <section className="panel views-panel">
              <div className="toolbar">
                <div className="view-tabs">
                  {(Object.keys(VIEW_LABELS) as View[])
                    .filter((key) => key !== 'profile' && key !== 'settings')
                    .map((key) => (
                      <button
                        key={key}
                        className={view.view === key ? 'active' : ''}
                        onClick={() => view.updateView(key)}
                        type="button"
                      >
                        {VIEW_LABELS[key]}
                      </button>
                    ))}
                </div>
                <FilterToolbar
                  state={filters.state}
                  onDispatch={filters.dispatch}
                  onToggleAdvanced={filters.toggleAdvancedFilters}
                  onClearAdvanced={filters.clearAdvancedFilters}
                />
              </div>

              {view.view === 'table' && (
                <>
                  <TableViewProvider value={tableViewContextValue}>
                    <TableView />
                  </TableViewProvider>
                  {showCompare && <CompareView jobs={selectedJobs} onClose={closeCompare} />}
                </>
              )}

              {view.view === 'kanban' && (
                <KanbanBoard
                  jobs={byStatus}
                  onStatusChange={handleQuickMoveJob}
                  onEdit={handleEditJob}
                  onDelete={handleRemoveJob}
                  onView={openViewOnly}
                />
              )}

              {view.view === 'calendar' && <CalendarView dueByDate={dueByDate} onView={openViewOnly} />}

              {view.view === 'dashboard' && <DashboardView byStatus={byStatus} />}

              {view.view === 'analytics' && <AnalyticsView jobs={jobs} />}
            </section>
          </main>

          {view.viewingJob && <JobModal job={view.viewingJob} onClose={closeViewOnly} />}
        </>
      )}
    </div>
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
