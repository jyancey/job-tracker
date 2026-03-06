import { useEffect, useMemo, type RefObject } from 'react'
import type { Job } from '../domain'

/**
 * Computes table selection state derived from the current page and selected ids.
 */
export function useTableSelectionState(
  paginatedJobs: Job[],
  selectedIds: Set<string>,
  selectAllCheckboxRef: RefObject<HTMLInputElement | null>,
) {
  const visibleTableIds = useMemo(() => paginatedJobs.map((job) => job.id), [paginatedJobs])
  const selectedVisibleIds = useMemo(
    () => visibleTableIds.filter((id) => selectedIds.has(id)),
    [visibleTableIds, selectedIds],
  )
  const selectedVisibleCount = selectedVisibleIds.length
  const allVisibleSelected = visibleTableIds.length > 0 && selectedVisibleCount === visibleTableIds.length
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someVisibleSelected
    }
  }, [selectAllCheckboxRef, someVisibleSelected])

  return {
    visibleTableIds,
    selectedVisibleIds,
    selectedVisibleCount,
    allVisibleSelected,
    someVisibleSelected,
  }
}
