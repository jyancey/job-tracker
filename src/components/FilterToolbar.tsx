import type { StatusFilter } from '../hooks/useJobFiltering'
import { StatusSelect } from './StatusSelect'

/**
 * Filter change actions using discriminated union pattern
 * Enables type-safe filter updates with single callback
 */
export type FilterAction =
  | { type: 'query'; value: string }
  | { type: 'status'; value: StatusFilter }
  | { type: 'dateStart'; value: string }
  | { type: 'dateEnd'; value: string }
  | { type: 'salaryMin'; value: string }
  | { type: 'salaryMax'; value: string }
  | { type: 'contact'; value: string }

export interface FilterState {
  statusFilter: StatusFilter
  showAdvancedFilters: boolean
  query: string
  dateRangeStart: string
  dateRangeEnd: string
  salaryRangeMin: string
  salaryRangeMax: string
  contactPersonFilter: string
}

interface FilterToolbarProps {
  state: FilterState
  onDispatch: (action: FilterAction) => void
  onToggleAdvanced: () => void
  onClearAdvanced: () => void
  searchMatchesCount: number
  totalJobsCount: number
  savedViews: Array<{ id: string; name: string }>
  activeSavedViewId: string
  onApplySavedView: (id: string) => void
  onSaveCurrentView: () => void
  onRenameSavedView: () => void
  onDeleteSavedView: () => void
}

export function FilterToolbar({
  state,
  onDispatch,
  onToggleAdvanced,
  onClearAdvanced,
  searchMatchesCount,
  totalJobsCount,
  savedViews,
  activeSavedViewId,
  onApplySavedView,
  onSaveCurrentView,
  onRenameSavedView,
  onDeleteSavedView,
}: FilterToolbarProps) {
  return (
    <>
      <div className="quick-filters">
        <input
          aria-label="Search jobs"
          placeholder="Search company, role, notes, contact..."
          value={state.query}
          onChange={(event) => onDispatch({ type: 'query', value: event.target.value })}
        />
        <span className="search-match-count">{searchMatchesCount}/{totalJobsCount} matches</span>
        {state.query && (
          <button
            type="button"
            className="small ghost"
            onClick={() => onDispatch({ type: 'query', value: '' })}
          >
            Clear Search
          </button>
        )}
        <StatusSelect
          value={state.statusFilter}
          onChange={(value) => onDispatch({ type: 'status', value: value as StatusFilter })}
          placeholder={false}
          showAllStatus
          showOverdueFilter
        />
        <button
          type="button"
          className="small ghost"
          onClick={onToggleAdvanced}
        >
          {state.showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
        </button>
        {state.statusFilter === 'Overdue Follow-ups' && (
          <button
            type="button"
            className="small ghost"
            onClick={() => onDispatch({ type: 'status', value: 'All' })}
          >
            Clear Overdue Filter
          </button>
        )}
        <select
          value={activeSavedViewId}
          onChange={(event) => onApplySavedView(event.target.value)}
          aria-label="Saved views"
        >
          <option value="">Saved views</option>
          {savedViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
        <button type="button" className="small ghost" onClick={onSaveCurrentView}>
          Save View
        </button>
        <button
          type="button"
          className="small ghost"
          onClick={onRenameSavedView}
          disabled={!activeSavedViewId}
        >
          Rename
        </button>
        <button
          type="button"
          className="small ghost"
          onClick={onDeleteSavedView}
          disabled={!activeSavedViewId}
        >
          Delete View
        </button>
      </div>

      {state.showAdvancedFilters && (
        <div className="advanced-filters">
          <input
            type="date"
            placeholder="From"
            value={state.dateRangeStart}
            onChange={(event) => onDispatch({ type: 'dateStart', value: event.target.value })}
            title="Application date from"
          />
          <input
            type="date"
            placeholder="To"
            value={state.dateRangeEnd}
            onChange={(event) => onDispatch({ type: 'dateEnd', value: event.target.value })}
            title="Application date to"
          />
          <input
            type="number"
            placeholder="Min salary"
            value={state.salaryRangeMin}
            onChange={(event) => onDispatch({ type: 'salaryMin', value: event.target.value })}
          />
          <input
            type="number"
            placeholder="Max salary"
            value={state.salaryRangeMax}
            onChange={(event) => onDispatch({ type: 'salaryMax', value: event.target.value })}
          />
          <input
            placeholder="Contact person"
            value={state.contactPersonFilter}
            onChange={(event) => onDispatch({ type: 'contact', value: event.target.value })}
          />
          <button type="button" className="small ghost" onClick={onClearAdvanced}>
            Clear Advanced
          </button>
        </div>
      )}
    </>
  )
}
