import type { ChangeEvent, FormEvent, RefObject } from 'react'
import type { Job } from '../domain'
import type { View } from '../hooks/useViewState'
import type { ImportMode } from '../exportImport'
import type { FilterAction, FilterState } from '../components/FilterToolbar'
import type { StatusFilter } from '../types/filters'
import type { Notification } from '../notifications'
import type { TableViewContextValue } from './table/TableViewContext'
import { APP_VERSION, GIT_BRANCH } from '../version'
import { downloadStorageLogs } from '../storage'
import { ToastContainer } from '../components/Toast'
import { JobForm } from '../components/JobForm'
import { JobModal } from '../components/JobModal'
import { FilterToolbar } from '../components/FilterToolbar'
import { KanbanBoard } from '../components/KanbanBoard'
import { TableViewProvider } from './table/TableViewContext'
import { TableView } from './TableView'
import { CalendarView } from './CalendarView'
import { DashboardView } from './DashboardView'
import { AnalyticsView } from './AnalyticsView'
import { CompareView } from './CompareView'
import { ProfileView } from './ProfileView'
import { SettingsView } from './SettingsView'
import { TodayView } from '../features/tasks/TodayView'
import { ThisWeekView } from '../features/tasks/ThisWeekView'
import type { JobDraft, JobPriority, JobStatus } from '../domain'

const VIEW_LABELS: Record<View, string> = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  today: 'Today',
  thisWeek: 'This Week',
  kanban: 'Kanban',
  calendar: 'Calendar',
  table: 'All Jobs',
  profile: 'Profile',
  settings: 'Settings',
}

interface AppShellViewProps {
  view: View
  updateView: (view: View) => void
  viewingJob: Job | null
  closeViewOnly: () => void
  openViewOnly: (job: Job) => void
  jobs: Job[]
  setJobs: (updater: (jobs: Job[]) => Job[]) => void
  notifications: Notification[]
  removeNotification: (id: string) => void
  importFileRef: RefObject<HTMLInputElement | null>
  handleImportFile: (event: ChangeEvent<HTMLInputElement>) => void
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
  overdueCount: number
  showOverdueOnly: () => void
  saveStatus: 'idle' | 'pending'
  editingId: string | null
  draft: JobDraft
  updateDraft: <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => void
  handleSubmitJob: (event: FormEvent<HTMLFormElement>) => void
  resetForm: () => void
  handleExport: (format: 'json' | 'csv') => void
  handleImportClick: () => void
  importMode: ImportMode
  setImportMode: (mode: ImportMode) => void
  canUndo: boolean
  handleUndo: () => void
  filtersState: FilterState
  filterStatusFromAnalytics: (status: StatusFilter) => void
  selectStuckJobFromAnalytics: (job: Job) => void
  dispatchFilter: (action: FilterAction) => void
  toggleAdvancedFilters: () => void
  clearAdvancedFilters: () => void
  tableViewContextValue: TableViewContextValue
  showCompare: boolean
  selectedJobs: Job[]
  closeCompare: () => void
  byStatus: Map<JobStatus, Job[]>
  handleQuickMoveJob: (id: string, status: JobStatus) => void
  handleEditJob: (job: Job) => void
  handleRemoveJob: (id: string) => void
  dueByDate: [string, Job[]][]
  today: string
  todayTasks: Job[]
  thisWeekTaskGroups: [string, Job[]][]
  taskOverdueCount: number
  handleCompleteTask: (jobId: string) => void
  handleSnoozeTask: (jobId: string, days: number) => void
  handleTaskPriorityChange: (jobId: string, priority: JobPriority) => void
  handleQuickAddTaskAction: (jobId: string, action: string, dueDate: string) => void
}

export function AppShellView({
  view,
  updateView,
  viewingJob,
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
  canUndo,
  handleUndo,
  filtersState,
  filterStatusFromAnalytics,
  selectStuckJobFromAnalytics,
  dispatchFilter,
  toggleAdvancedFilters,
  clearAdvancedFilters,
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
}: AppShellViewProps) {
  return (
    <div className="app-shell">
      <div className="version-badge" title={`Version ${APP_VERSION} on ${GIT_BRANCH}`}>
        {APP_VERSION}
      </div>
      <input ref={importFileRef} type="file" onChange={handleImportFile} style={{ display: 'none' }} />
      <ToastContainer notifications={notifications} onRemove={removeNotification} />

      {view === 'profile' ? (
        <ProfileView onClose={() => updateView('table')} />
      ) : view === 'settings' ? (
        <SettingsView
          onClose={() => updateView('table')}
          jobs={jobs}
          setJobs={setJobs}
          addNotification={addNotification}
        />
      ) : (
        <>
          <section className="top-grid">
            <header className="hero">
              <div className="hero-actions" role="group" aria-label="Profile and settings actions">
                <button type="button" className="small ghost" onClick={() => updateView('profile')} title="Open profile">
                  Profile
                </button>
                <button
                  type="button"
                  className="small ghost"
                  onClick={() => updateView('settings')}
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
                  {canUndo && (
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
                        className={view === key ? 'active' : ''}
                        onClick={() => updateView(key)}
                        type="button"
                      >
                        {VIEW_LABELS[key]}
                        {key === 'today' && taskOverdueCount > 0 ? <span className="tab-badge">{taskOverdueCount}</span> : null}
                      </button>
                    ))}
                </div>
                <FilterToolbar
                  state={filtersState}
                  onDispatch={dispatchFilter}
                  onToggleAdvanced={toggleAdvancedFilters}
                  onClearAdvanced={clearAdvancedFilters}
                />
              </div>

              {view === 'table' && (
                <>
                  <TableViewProvider value={tableViewContextValue}>
                    <TableView />
                  </TableViewProvider>
                  {showCompare && <CompareView jobs={selectedJobs} onClose={closeCompare} />}
                </>
              )}

              {view === 'kanban' && (
                <KanbanBoard
                  jobs={byStatus}
                  onStatusChange={handleQuickMoveJob}
                  onEdit={handleEditJob}
                  onDelete={handleRemoveJob}
                  onView={openViewOnly}
                />
              )}

              {view === 'calendar' && <CalendarView dueByDate={dueByDate} onView={openViewOnly} />}
              {view === 'dashboard' && <DashboardView byStatus={byStatus} />}
              {view === 'analytics' && <AnalyticsView jobs={jobs} onFilterByStatus={filterStatusFromAnalytics} onSelectJob={selectStuckJobFromAnalytics} />}
              {view === 'today' && (
                <TodayView
                  jobs={todayTasks}
                  today={today}
                  overdueCount={taskOverdueCount}
                  onComplete={handleCompleteTask}
                  onSnooze={handleSnoozeTask}
                  onPriorityChange={handleTaskPriorityChange}
                  onQuickAddAction={handleQuickAddTaskAction}
                  onOpenJob={openViewOnly}
                />
              )}
              {view === 'thisWeek' && (
                <ThisWeekView
                  groupedJobs={thisWeekTaskGroups}
                  today={today}
                  onComplete={handleCompleteTask}
                  onSnooze={handleSnoozeTask}
                  onPriorityChange={handleTaskPriorityChange}
                  onQuickAddAction={handleQuickAddTaskAction}
                  onOpenJob={openViewOnly}
                />
              )}
            </section>
          </main>

          {viewingJob && <JobModal job={viewingJob} onClose={closeViewOnly} />}
        </>
      )}
    </div>
  )
}
