import { useCallback, useState } from 'react'

/**
 * Custom hook to manage job selection state
 * Consolidates selection logic into a reusable, testable hook
 *
 * Returns:
 * - selectedIds: Set of selected job IDs
 * - toggle: Toggle selection for a specific job
 * - toggleAll: Toggle all jobs in a provided list
 * - clear: Clear all selections
 * - addMultiple: Add multiple jobs to selection
 * - removeMultiple: Remove multiple jobs from selection
 */

export function useJobSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback((ids: string[], allSelected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      if (allSelected) {
        // Deselect all provided ids
        for (const id of ids) {
          next.delete(id)
        }
      } else {
        // Select all provided ids
        for (const id of ids) {
          next.add(id)
        }
      }

      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const addMultiple = useCallback((ids: string[]) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      for (const id of ids) {
        next.add(id)
      }
      return next
    })
  }, [])

  const removeMultiple = useCallback((ids: string[]) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      for (const id of ids) {
        next.delete(id)
      }
      return next
    })
  }, [])

  return {
    selectedIds,
    toggle,
    toggleAll,
    clear,
    addMultiple,
    removeMultiple,
  }
}
