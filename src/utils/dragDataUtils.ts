import type { Job } from '../domain'

/**
 * Drag and drop data utilities for working with job data via DataTransfer API
 */

const DRAG_DATA_FORMAT = 'application/json'

/**
 * Serialize a job to drag data
 * @param job - Job object to serialize
 * @returns JSON string representation of job
 */
export function serializeJobData(job: Job): string {
  return JSON.stringify(job)
}

/**
 * Deserialize job from drag data
 * @param data - String data from dataTransfer.getData()
 * @returns Parsed job object or null if parse fails
 */
export function deserializeJobData(data: string): Job | null {
  try {
    return JSON.parse(data) as Job
  } catch (error) {
    console.error('Failed to parse dropped job data:', error)
    return null
  }
}

/**
 * Set job data on dataTransfer for drag start
 * @param event - DragEvent to set data on
 * @param job - Job object to transfer
 * @param effectAllowed - Drag effect (default: 'move')
 */
export function setJobDragData(
  event: React.DragEvent<HTMLElement>,
  job: Job,
  effectAllowed: DataTransfer['effectAllowed'] = 'move'
): void {
  event.dataTransfer.effectAllowed = effectAllowed
  event.dataTransfer.setData(DRAG_DATA_FORMAT, serializeJobData(job))
}

/**
 * Get job data from dataTransfer during drop
 * @param event - DragEvent to extract data from
 * @returns Parsed job or null if deserialization fails
 */
export function getJobDragData(event: React.DragEvent<HTMLElement>): Job | null {
  const data = event.dataTransfer.getData(DRAG_DATA_FORMAT)
  return deserializeJobData(data)
}
