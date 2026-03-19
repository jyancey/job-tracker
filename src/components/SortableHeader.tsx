// Reusable table header cell with clickable sort indicator showing ascending/descending direction arrows.
import type { SortColumn, SortDirection } from '../hooks/useJobFiltering'

interface SortableHeaderProps {
  label: string
  column: SortColumn
  currentColumn: SortColumn
  currentDirection: SortDirection
  onSort: (column: SortColumn) => void
}

/**
 * Reusable sortable table header component
 * Displays column label with direction indicator and handles click to sort
 */
export function SortableHeader({
  label,
  column,
  currentColumn,
  currentDirection,
  onSort,
}: SortableHeaderProps) {
  const sortMarker = currentColumn === column ? (currentDirection === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <th className="sortable-header">
      <button type="button" onClick={() => onSort(column)}>
        {label}
        {sortMarker}
      </button>
    </th>
  )
}
