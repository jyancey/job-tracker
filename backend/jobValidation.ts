/* @(#)jobValidation.ts - Validation logic for job objects
 *
 * This module provides functions to validate job objects and arrays of job 
 * objects to ensure they conform to the expected structure and data types.
 * It checks for required fields, valid status values, and proper date formats.
 */
const VALID_STATUSES = [
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
] as const

const REQUIRED_FIELDS = [
  'id',
  'company',
  'roleTitle',
  'applicationDate',
  'status',
  'jobUrl',
  'atsUrl',
  'salaryRange',
  'notes',
  'contactPerson',
  'nextAction',
  'nextActionDueDate',
  'createdAt',
  'updatedAt',
] as const

export interface JobValidationResult {
  valid: boolean
  error?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidIsoDate(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }

  try {
    const date = new Date(value)
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return false
    }
    const asIso = date.toISOString()
    const reparsed = new Date(asIso)
    return reparsed.getTime() === date.getTime()
  } catch {
    return false
  }
}

/**
 * Validates a job object to ensure it meets the required structure and data types.
 * @param job The job object to validate.
 * @returns A JobValidationResult indicating whether the job is valid and any errors.
 */
export function validateJob(job: unknown): JobValidationResult {
  if (!isRecord(job)) {
    return { valid: false, error: 'Job must be an object' }
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in job)) {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }

  if (typeof job.id !== 'string' || !job.id.trim()) {
    return { valid: false, error: 'id must be a non-empty string' }
  }
  if (typeof job.company !== 'string') {
    return { valid: false, error: 'company must be a string' }
  }
  if (typeof job.roleTitle !== 'string') {
    return { valid: false, error: 'roleTitle must be a string' }
  }
  if (typeof job.status !== 'string') {
    return { valid: false, error: 'status must be a string' }
  }

  if (!VALID_STATUSES.includes(job.status as (typeof VALID_STATUSES)[number])) {
    return {
      valid: false,
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    }
  }

  if (!isValidIsoDate(job.applicationDate)) {
    return { valid: false, error: 'applicationDate must be a valid ISO 8601 date' }
  }
  if (!isValidIsoDate(job.createdAt)) {
    return { valid: false, error: 'createdAt must be a valid ISO 8601 date' }
  }
  if (!isValidIsoDate(job.updatedAt)) {
    return { valid: false, error: 'updatedAt must be a valid ISO 8601 date' }
  }

  if (job.nextActionDueDate && !isValidIsoDate(job.nextActionDueDate)) {
    return {
      valid: false,
      error: 'nextActionDueDate must be a valid ISO 8601 date or empty string',
    }
  }

  return { valid: true }
}

/**
 * Validates an array of job objects to ensure each job meets the required structure and data types.
 * @param jobs The array of job objects to validate.
 * @returns A JobValidationResult indicating whether all jobs are valid and any errors.
 */
export function validateJobArray(jobs: unknown[]): JobValidationResult {
  if (!Array.isArray(jobs)) {
    return { valid: false, error: 'jobs must be an array' }
  }

  for (let i = 0; i < jobs.length; i++) {
    const result = validateJob(jobs[i])
    if (!result.valid) {
      return { valid: false, error: `Job at index ${i}: ${result.error}` }
    }
  }

  return { valid: true }
}