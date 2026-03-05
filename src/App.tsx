import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  JOB_STATUSES,
  type Job,
  type JobStatus,
} from './domain'
import { KanbanBoard } from './KanbanBoard'
import { downloadStorageLogs, loadJobs, saveJobs } from './storage'
import { ToastContainer } from './Toast'
import {
  downloadFile,
  exportToCsv,
  exportToJson,
  importJobsFromFile,
  mergeImportedJobs,
  type ImportMode,
} from './exportImport'
import { APP_VERSION } from './version'
import { formatDate, isOverdueFollowUp, getTodayString } from './utils/dateUtils'
import {
  useJobFiltering,
  useJobSorting,
  useJobPagination,
  type StatusFilter,
  type SortColumn,
  type SortDirection,
} from './hooks/useJobFiltering'
import { useJobGrouping } from './hooks/useJobGrouping'
import { useJobForm } from './hooks/useJobForm'
import { useNotifications } from './hooks/useNotifications'
import { TableView } from './views/TableView'
import { CalendarView } from './views/CalendarView'
import { DashboardView } from './views/DashboardView'
import { JobForm } from './components/JobForm'
import { JobModal } from './components/JobModal'
import { FilterToolbar } from './components/FilterToolbar'
import * as jobService from './services/jobService'

type View = 'table' | 'kanban' | 'calendar' | 'dashboard'

const VIEW_LABELS: Record<View, string> = {
  table: 'All Jobs',
  kanban: 'Kanban',
  calendar: 'Calendar',
  dashboard: 'Dashboard',
}

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [view, setView] = useState<View>('table')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [viewingJob, setViewingJob] = useState<Job | null>(null)
  const [isStorageHydrated, setIsStorageHydrated] = useState(false)

  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending'>('idle')
  const [undoStack, setUndoStack] = useState<Job[][]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [salaryRangeMin, setSalaryRangeMin] = useState('')
  const [salaryRangeMax, setSalaryRangeMax] = useState('')
  const [contactPersonFilter, setContactPersonFilter] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('applicationDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [importMode, setImportMode] = useState<ImportMode>('append')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const importFileRef = useRef<HTMLInputElement>(null)
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
  const saveRequestIdRef = useRef(0)

  // Use notifications hook
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Use job form hook
  const { draft, editingId, draftExists, updateDraft, resetForm, startEdit, submitForm } =
    useJobForm(setJobs, addNotification)

  useEffect(() => {
    let isDisposed = false

    async function hydrateFromStorage(): Promise<void> {
      const result = await loadJobs()
      if (isDisposed) {
        return
      }

      setJobs(result.jobs.sort(sortByApplicationDateDesc))
      setIsStorageHydrated(result.didLoad)

      if (!result.didLoad) {
        setNotifications((current) => [
          ...current,
          createNotification('Storage is unavailable. Existing jobs were not loaded.', 'error'),
        ])
      }
    }

    void hydrateFromStorage()

    return () => {
      isDisposed = true
    }
  }, [])

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
          setNotifications((current) => [
            ...current,
            createNotification('Autosave failed. Your latest changes are not yet persisted.', 'error'),
          ])
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

  // Use filtering hooks
  const { filteredJobs, overdueCount } = useJobFiltering(jobs, {
    query,
    statusFilter,
    dateRangeStart,
    dateRangeEnd,
    salaryRangeMin,
    salaryRangeMax,
    contactPersonFilter,
  })

  // Use sorting hook
  const sortedTableJobs = useJobSorting(filteredJobs, {
    sortColumn,
    sortDirection,
  })

  // Use pagination hook
  const { paginatedJobs: paginatedTableJobs, totalPages } = useJobPagination(sortedTableJobs, {
    currentPage,
    pageSize,
  })

  // Use grouping hooks
  const { byStatus, dueByDate } = useJobGrouping(jobs)

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const visibleTableIds = useMemo(() => paginatedTableJobs.map((job) => job.id), [paginatedTableJobs])
  const selectedVisibleIds = useMemo(
    () => visibleTableIds.filter((id) => selectedIds.has(id)),
    [visibleTableIds, selectedIds],
  )
  const selectedVisibleCount = useMemo(
    () => selectedVisibleIds.length,
    [selectedVisibleIds],
  )
  const allVisibleSelected = visibleTableIds.length > 0 && selectedVisibleCount === visibleTableIds.length
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someVisibleSelected
    }
  }, [someVisibleSelected])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, statusFilter, dateRangeStart, dateRangeEnd, salaryRangeMin, salaryRangeMax, contactPersonFilter])

  function handleSubmitJob(event: React.FormEvent<HTMLFormElement>): void {
    const normalizedDraft = submitForm(event)
    if (!normalizedDraft) {
      return
    }

    if (editingId) {
      setJobs((current) => jobService.updateJob(current, editingId, normalizedDraft))
    } else {
      setJobs((current) => jobService.createJob(current, normalizedDraft))
    }
    resetForm()
  }

  function handleEditJob(job: Job): void {
    startEdit(job)
  }

  function handleRemoveJob(id: string): void {
    setJobs((current) => jobService.deleteJob(current, id))
    if (editingId === id) {
      resetForm()
    }
    if (viewingJob?.id === id) {
      setViewingJob(null)
    }
  }

  function handleQuickMove(id: string, nextStatus: JobStatus): void {
    setJobs((current) => jobService.updateJobStatus(current, id, nextStatus))
  }

  function toggleJobSelection(id: string): void {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAllVisible(): void {
    if (visibleTableIds.length === 0) {
      return
    }

    setSelectedIds((current) => {
      const next = new Set(current)

      if (allVisibleSelected) {
        for (const id of visibleTableIds) {
          next.delete(id)
        }
      } else {
        for (const id of visibleTableIds) {
          next.add(id)
        }
      }

      return next
    })
  }

  function bulkDeleteSelected(): void {
    if (selectedVisibleIds.length === 0) return

    const hiddenSelectedCount = selectedIds.size - selectedVisibleIds.length
    setUndoStack((current) => [...current, jobs])
    setJobs((current) => jobService.deleteJobs(current, selectedVisibleIds))
    setSelectedIds((current) => {
      const next = new Set(current)
      for (const id of selectedVisibleIds) {
        next.delete(id)
      }
      return next
    })
    addNotification(
      `Deleted ${selectedVisibleIds.length} visible job(s). ${hiddenSelectedCount > 0 ? `${hiddenSelectedCount} hidden selection(s) kept.` : ''}`,
      'success',
    )
  }

  function undo(): void {
    if (undoStack.length === 0) return

    setUndoStack((current) => {
      const next = [...current]
      const previous = next.pop()
      if (previous) {
        setJobs(previous)
      }
      return next
    })
    addNotification('Undo successful', 'info')
  }

  function handleExport(format: 'json' | 'csv'): void {
    try {
      const content = format === 'json' ? exportToJson(jobs) : exportToCsv(jobs)
      const timestamp = new Date().toISOString().slice(0, 10)
      downloadFile(content, `job-tracker-${timestamp}.${format}`, `text/${format}`)
      addNotification(`Exported ${jobs.length} job(s) as ${format.toUpperCase()}`, 'success')
    } catch {
      addNotification('Export failed', 'error')
    }
  }

  function handleImportClick(): void {
    importFileRef.current?.click()
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>): void {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const imported = importJobsFromFile(content, file.name)
        if (imported.length === 0) {
          addNotification('No valid jobs found in file. Expected CSV or JSON job rows.', 'error')
          return
        }

        const merge = mergeImportedJobs(jobs, imported, importMode)
        setUndoStack((current) => [...current, jobs])
        setJobs(merge.jobs.sort(sortByApplicationDateDesc))
        setSelectedIds(new Set())
        setCurrentPage(1)
        addNotification(
          `Import ${importMode}: ${merge.inserted} inserted${merge.updated ? `, ${merge.updated} updated` : ''}.`,
          'success',
        )
      } catch {
        addNotification('Import failed', 'error')
      } finally {
        // Allow picking the same file again without changing its name.
        input.value = ''
      }
    }
    reader.readAsText(file)
  }

  function showOverdueOnly(): void {
    setView('table')
    setStatusFilter('Overdue Follow-ups')
  }

  function openViewOnly(job: Job): void {
    setViewingJob(job)
  }

  function closeViewOnly(): void {
    setViewingJob(null)
  }

  function clearAdvancedFilters(): void {
    setQuery('')
    setDateRangeStart('')
    setDateRangeEnd('')
    setSalaryRangeMin('')
    setSalaryRangeMax('')
    setContactPersonFilter('')
  }

  function handleSort(column: SortColumn): void {
    if (sortColumn === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortColumn(column)
    setSortDirection(column === 'applicationDate' || column === 'nextActionDueDate' ? 'desc' : 'asc')
  }

  return (
    <div className="app-shell">
      <input
        ref={importFileRef}
        type="file"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />
      <ToastContainer notifications={notifications} onRemove={removeNotification} />
      <section className="top-grid">
        <header className="hero">
          <img src="/job-tracker.png" alt="Job Tracker Logo" className="hero-logo" />
          <div className="hero-bottom">
            <div className="hero-content">
              <p className="eyebrow">Job Tracker</p>
              <h1>Track your search like a pipeline, not a spreadsheet.</h1>
              <p>
                Local-only and private. Add opportunities, manage follow-ups, and monitor momentum from one
                workspace.
              </p>
            </div>
            <div className="hero-metrics">
              <article>
                <span>Total Jobs</span>
                <strong>{jobs.length}</strong>
              </article>
              <article>
                <span>Open Pipeline</span>
                <strong>{jobs.filter((job) => !['Rejected', 'Withdrawn'].includes(job.status)).length}</strong>
              </article>
              <article>
                <span>Overdue Follow-ups</span>
                <strong>{overdueCount}</strong>
                <button type="button" className="ghost small metric-action" onClick={showOverdueOnly}>
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
                onChange={(event) => setImportMode(event.target.value as ImportMode)}
                title="Import behavior"
              >
                <option value="append">Import: Append</option>
                <option value="upsert">Import: Upsert by ID</option>
                <option value="replace">Import: Replace All</option>
              </select>
              <button type="button" className="small ghost" onClick={() => downloadStorageLogs()}>
                Export DB Logs
              </button>
              {undoStack.length > 0 && (
                <button type="button" className="small" onClick={undo}>
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
              {(Object.keys(VIEW_LABELS) as View[]).map((key) => (
                <button
                  key={key}
                  className={view === key ? 'active' : ''}
                  onClick={() => setView(key)}
                  type="button"
                >
                  {VIEW_LABELS[key]}
                </button>
              ))}
            </div>
            <FilterToolbar
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              showAdvancedFilters={showAdvancedFilters}
              onToggleAdvancedFilters={() => setShowAdvancedFilters((current) => !current)}
              query={query}
              onQueryChange={setQuery}
              dateRangeStart={dateRangeStart}
              onDateRangeStartChange={setDateRangeStart}
              dateRangeEnd={dateRangeEnd}
              onDateRangeEndChange={setDateRangeEnd}
              salaryRangeMin={salaryRangeMin}
              onSalaryRangeMinChange={setSalaryRangeMin}
              salaryRangeMax={salaryRangeMax}
              onSalaryRangeMaxChange={setSalaryRangeMax}
              contactPersonFilter={contactPersonFilter}
              onContactPersonFilterChange={setContactPersonFilter}
              onClearAdvancedFilters={clearAdvancedFilters}
            />
          </div>

          {view === 'table' && (
            <TableView
              paginatedJobs={paginatedTableJobs}
              sortedJobs={sortedTableJobs}
              selectedIds={selectedIds}
              selectedVisibleCount={selectedVisibleCount}
              allVisibleSelected={allVisibleSelected}
              someVisibleSelected={someVisibleSelected}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onSort={handleSort}
              onToggleSelection={toggleJobSelection}
              onToggleSelectAll={toggleSelectAllVisible}
              onBulkDelete={bulkDeleteSelected}
              onQuickMove={handleQuickMove}
              onEdit={handleEditJob}
              onRemove={handleRemoveJob}
              onView={openViewOnly}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              selectAllCheckboxRef={selectAllCheckboxRef}
            />
          )}

          {view === 'kanban' && (
            <KanbanBoard
              jobs={byStatus}
              onStatusChange={handleQuickMove}
              onEdit={handleEditJob}
              onDelete={handleRemoveJob}
            />
          )}

          {view === 'calendar' && <CalendarView dueByDate={dueByDate} />}

          {view === 'dashboard' && <DashboardView byStatus={byStatus} />}
        </section>
      </main>

      {viewingJob && <JobModal job={viewingJob} onClose={closeViewOnly} />}

      <footer className="app-footer">
        <span>Job Tracker {APP_VERSION}</span>
      </footer>
    </div>
  )
}

export default App
