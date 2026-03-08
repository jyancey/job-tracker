import { useTableViewContext } from './TableViewContext'

export function TableBulkActions() {
  const { selectedIds, selectedVisibleCount, onCompare, onBulkDelete } = useTableViewContext()

  if (selectedIds.size === 0) {
    return null
  }

  return (
    <div className="bulk-actions">
      <span>
        {selectedVisibleCount} selected on page
        {selectedIds.size > selectedVisibleCount
          ? ` (${selectedIds.size - selectedVisibleCount} selected on other pages/filters)`
          : ''}
      </span>
      <button type="button" onClick={onCompare}>
        Compare Selected ({selectedIds.size})
      </button>
      <button type="button" className="danger" onClick={onBulkDelete} disabled={selectedVisibleCount === 0}>
        Delete Selected on Page
      </button>
    </div>
  )
}
