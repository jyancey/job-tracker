import { JOB_STATUSES } from '../domain'
import type { StatusFilter } from '../hooks/useJobFiltering'

interface FilterToolbarProps {
  statusFilter: StatusFilter
  showAdvancedFilters: boolean
  query: string
  dateRangeStart: string
  dateRangeEnd: string
  salaryRangeMin: string
  salaryRangeMax: string
  contactPersonFilter: string
  onStatusFilterChange: (filter: StatusFilter) => void
  onToggleAdvancedFilters: () => void
  onQueryChange: (query: string) => void
  onDateRangeStartChange: (date: string) => void
  onDateRangeEndChange: (date: string) => void
  onSalaryRangeMinChange: (min: string) => void
  onSalaryRangeMaxChange: (max: string) => void
  onContactPersonFilterChange: (contact: string) => void
  onClearAdvancedFilters: () => void
}

export function FilterToolbar({
  statusFilter,
  showAdvancedFilters,
  query,
  dateRangeStart,
  dateRangeEnd,
  salaryRangeMin,
  salaryRangeMax,
  contactPersonFilter,
  onStatusFilterChange,
  onToggleAdvancedFilters,
  onQueryChange,
  onDateRangeStartChange,
  onDateRangeEndChange,
  onSalaryRangeMinChange,
  onSalaryRangeMaxChange,
  onContactPersonFilterChange,
  onClearAdvancedFilters,
}: FilterToolbarProps) {
  return (
    <>
      <div className="quick-filters">
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
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
          onClick={onToggleAdvancedFilters}
        >
          {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
        </button>
        {statusFilter === 'Overdue Follow-ups' && (
          <button
            type="button"
            className="small ghost"
            onClick={() => onStatusFilterChange('All')}
          >
            Clear Overdue Filter
          </button>
        )}
      </div>

      {showAdvancedFilters && (
        <div className="advanced-filters">
          <input
            placeholder="Search company, role, or notes"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <input
            type="date"
            placeholder="From"
            value={dateRangeStart}
            onChange={(event) => onDateRangeStartChange(event.target.value)}
            title="Application date from"
          />
          <input
            type="date"
            placeholder="To"
            value={dateRangeEnd}
            onChange={(event) => onDateRangeEndChange(event.target.value)}
            title="Application date to"
          />
          <input
            type="number"
            placeholder="Min salary"
            value={salaryRangeMin}
            onChange={(event) => onSalaryRangeMinChange(event.target.value)}
          />
          <input
            type="number"
            placeholder="Max salary"
            value={salaryRangeMax}
            onChange={(event) => onSalaryRangeMaxChange(event.target.value)}
          />
          <input
            placeholder="Contact person"
            value={contactPersonFilter}
            onChange={(event) => onContactPersonFilterChange(event.target.value)}
          />
          <button type="button" className="small ghost" onClick={onClearAdvancedFilters}>
            Clear Advanced
          </button>
        </div>
      )}
    </>
  )
}
