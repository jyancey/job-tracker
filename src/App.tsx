import { useEffect, useMemo, useRef, useState } from 'react'
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
import { useTableSelectionState } from './hooks/useTableSelectionState'
import { useSortAndPagination } from './hooks/useSortAndPagination'
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
import * as jobService from './services/jobService'

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
  const [showCompare, setShowCompare] = useState(false)
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

  // Handle job submission with optional AI scoring
  const handleSubmitJob = (event: React.FormEvent<HTMLFormElement>) => {
    const normalizedDraft = submitForm(event)
    if (!normalizedDraft) {
      return
    }

    let newJobId: string | null = editingId || null

    if (editingId) {
      setJobs((current) => jobService.updateJob(current, editingId, normalizedDraft))
    } else {
      setJobs((current) => {
        const updated = jobService.createJob(current, normalizedDraft)
        newJobId = updated[0].id
        return updated
      })
    }

    resetForm()

    // Trigger AI scoring if applicable
    triggerAiScoring(
      normalizedDraft.jobDescription ?? '',
      normalizedDraft.roleTitle,
      normalizedDraft.company,
      normalizedDraft.salaryRange,
      newJobId || '',
      setJobs,
    )
  }

  // Handle edit job
  const handleEditJob = (job: Job) => {
    startEdit(job)
  }

  // Handle remove job
  const handleRemoveJob = (id: string) => {
    removeJobHelper(id, setJobs)
  }

  // Handle quick move (status change)
  const handleQuickMoveJob = (id: string, nextStatus: string) => {
    handleQuickMove(id, nextStatus as any, setJobs)
  }

  // Selection handlers
  const toggleJobSelection = (id: string) => {
    selection.toggle(id)
  }

  const toggleSelectAllVisible = () => {
    if (visibleTableIds.length === 0) {
      return
    }
    selection.toggleAll(visibleTableIds, allVisibleSelected)
  }

  // Bulk delete handler
  const bulkDeleteSelected = () => {
    if (selectedVisibleIds.length === 0) return

    const hiddenSelectedCount = selection.selectedIds.size - selectedVisibleIds.length
    undo.pushState(jobs)
    setJobs((current) => jobService.deleteJobs(current, selectedVisibleIds))
    selection.removeMultiple(selectedVisibleIds)
    addNotification(
      `Deleted ${selectedVisibleIds.length} visible job(s). ${hiddenSelectedCount > 0 ? `${hiddenSelectedCount} hidden selection(s) kept.` : ''}`,
      'success',
    )
  }

  // Compare handler
  const handleCompare = () => {
    if (selection.selectedIds.size === 0) {
      addNotification('Select jobs to compare', 'info')
      return
    }
    setShowCompare(true)
  }

  const closeCompare = () => {
    setShowCompare(false)
  }

  // Get jobs for comparison
  const selectedJobs = useMemo(() => {
    return jobs.filter((job) => selection.selectedIds.has(job.id))
  }, [jobs, selection.selectedIds])

  // Undo handler
  const handleUndo = () => {
    const previous = undo.undo()
    if (previous) {
      setJobs(previous)
      addNotification('Undo successful', 'info')
    }
  }

  // Show only overdue jobs
  const showOverdueOnly = () => {
    view.updateView('table')
    filters.updateStatusFilter('Overdue Follow-ups')
  }

  const openViewOnly = (job: Job) => {
    view.openViewOnly(job)
  }

  const closeViewOnly = () => {
    view.closeViewOnly()
  }

  // Build table view context
  /* eslint-disable react-hooks/exhaustive-deps */
  const tableViewContextValue = useMemo(
    () => ({
      paginatedJobs: paginatedJobs,
      sortedJobs: recomputedSortedTableJobs,
      selectedIds: selection.selectedIds,
      selectedVisibleCount,
      allVisibleSelected,
      sortColumn,
      sortDirection,
      currentPage,
      totalPages,
      pageSize,
      onSort: handleSort,
      onToggleSelection: toggleJobSelection,
      onToggleSelectAll: toggleSelectAllVisible,
      onBulkDelete: bulkDeleteSelected,
      onCompare: handleCompare,
      onQuickMove: handleQuickMoveJob,
      onEdit: handleEditJob,
      onRemove: handleRemoveJob,
      onView: openViewOnly,
      onPageChange: setCurrentPage,
      onPageSizeChange: setPageSize,
      selectAllCheckboxRef,
    }),
    [
      paginatedJobs,
      recomputedSortedTableJobs,
      selection.selectedIds,
      selectedVisibleCount,
      allVisibleSelected,
      sortColumn,
      sortDirection,
      currentPage,
      totalPages,
      pageSize,
    ],
  )
  /* eslint-enable react-hooks/exhaustive-deps */

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
