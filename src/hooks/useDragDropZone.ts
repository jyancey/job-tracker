import { useState, useCallback } from 'react'
import type { JobStatus } from '../domain'
import { getJobDragData } from '../utils/dragDataUtils'

interface UseDragDropZoneResult {
  isDragOver: boolean
  handleDragOver: (event: React.DragEvent<HTMLElement>) => void
  handleDragLeave: (event: React.DragEvent<HTMLElement>) => void
  handleDrop: (event: React.DragEvent<HTMLElement>) => void
}

/**
 * Hook for managing drag-over visual state in a drop zone
 * Handles dragover/dragleave/drop events for job kanban columns
 * @param status - Target JobStatus for this drop zone
 * @param onStatusChange - Callback when job is dropped (if status differs)
 * @returns Object with state and handlers for drop zone element
 */
export function useDragDropZone(
  status: JobStatus,
  onStatusChange: (jobId: string, newStatus: JobStatus) => void
): UseDragDropZoneResult {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    // Only set to false if we're leaving the column itself, not a child
    if (event.currentTarget === event.target) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault()
      setIsDragOver(false)

      const job = getJobDragData(event)
      if (job && job.status !== status) {
        onStatusChange(job.id, status)
      }
    },
    [status, onStatusChange]
  )

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
