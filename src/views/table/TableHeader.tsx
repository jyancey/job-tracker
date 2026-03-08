import { SortableHeader } from '../../components/SortableHeader'
import { useTableViewContext } from './TableViewContext'

export function TableHeader() {
  const { sortColumn, sortDirection, onSort, allVisibleSelected, onToggleSelectAll, selectAllCheckboxRef } =
    useTableViewContext()

  return (
    <thead>
      <tr>
        <th style={{ width: '40px' }}>
          <input
            ref={selectAllCheckboxRef}
            type="checkbox"
            checked={allVisibleSelected}
            onChange={onToggleSelectAll}
            aria-label="Select all visible jobs"
          />
        </th>
        <SortableHeader
          label="Company"
          column="company"
          currentColumn={sortColumn}
          currentDirection={sortDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Role"
          column="roleTitle"
          currentColumn={sortColumn}
          currentDirection={sortDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Status"
          column="status"
          currentColumn={sortColumn}
          currentDirection={sortDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Score"
          column="score"
          currentColumn={sortColumn}
          currentDirection={sortDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Applied"
          column="applicationDate"
          currentColumn={sortColumn}
          currentDirection={sortDirection}
          onSort={onSort}
        />
        <SortableHeader
          label="Next Action"
          column="nextActionDueDate"
          currentColumn={sortColumn}
          currentDirection={sortDirection}
          onSort={onSort}
        />
        <th>Actions</th>
      </tr>
    </thead>
  )
}
