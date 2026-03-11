import { useRef } from 'react'
import type { Job } from '../domain'
import { useJobSelection } from './useJobSelection'
import { useTableSelectionState } from './useTableSelectionState'

/**
 * Composes selection state for the app and current table page.
 */
export function useSelectionState(paginatedJobs: Job[]) {
  const selection = useJobSelection()
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
  const tableSelection = useTableSelectionState(
    paginatedJobs,
    selection.selectedIds,
    selectAllCheckboxRef,
  )

  return {
    selection,
    selectAllCheckboxRef,
    ...tableSelection,
  }
}