import { JOB_STATUSES } from '../domain'
import type { StatusFilter } from '../hooks/useJobFiltering'

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
}

export function FilterToolbar({
  state,
  onDispatch,
  onToggleAdvanced,
  onClearAdvanced,
}: FilterToolbarProps) {
  return (
    <>
      <div className="quick-filters">
        <select
          value={state.statusFilter}
          onChange={(event) => onDispatch({ type: 'status', value: event.target.value as StatusFilter })}
        >
          <option value="All">All statuses</option>
          <option value="Overdue Follow-ups">Overdue Follow-ups</option>
          {JOB_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
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
      </div>

      {state.showAdvancedFilters && (
        <div className="advanced-filters">
          <input
            placeholder="Search company, role, or notes"
            value={state.query}
            onChange={(event) => onDispatch({ type: 'query', value: event.target.value })}
          />
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
