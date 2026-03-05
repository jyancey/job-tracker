import { useCallback, useState } from 'react'
import type { Job } from '../domain'

/**
 * Custom hook to manage undo/redo stack for job operations
 * Provides functionality to track job list history and restore previous states
 *
 * Returns:
 * - undoStack: Array of previous job states
 * - pushState: Add current jobs to undo stack
 * - undo: Restore previous job state
 * - canUndo: Whether undo is available
 */

export function useUndoStack() {
  const [undoStack, setUndoStack] = useState<Job[][]>([])

  const pushState = useCallback((jobs: Job[]) => {
    setUndoStack((current) => [...current, jobs])
  }, [])

  const undo = useCallback(() => {
    let previous: Job[] | undefined

    setUndoStack((current) => {
      const next = [...current]
      previous = next.pop()
      return next
    })

    return previous
  }, [])

  const canUndo = undoStack.length > 0

  return {
    undoStack,
    pushState,
    undo,
    canUndo,
  }
}
