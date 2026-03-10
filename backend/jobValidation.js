const VALID_STATUSES = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Withdrawn']

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
]

function isValidIsoDate(value) {
  if (typeof value !== 'string') return false
  try {
    const date = new Date(value)
    // Check if it's a valid date and can be converted to ISO format
    // Don't require exact string matching as different sources may or may not include milliseconds
    if (!(date instanceof Date) || isNaN(date.getTime())) return false
    // Verify it's ISO format by checking the parsed result is equivalent
    const asIso = date.toISOString()
    const reparsed = new Date(asIso)
    return reparsed.getTime() === date.getTime()
  } catch {
    return false
  }
}

export function validateJob(job) {
  if (!job || typeof job !== 'object') {
    return { valid: false, error: 'Job must be an object' }
  }

  // Check all required fields exist
  for (const field of REQUIRED_FIELDS) {
    if (!(field in job)) {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }

  // Validate field types
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

  // Validate status enum
  if (!VALID_STATUSES.includes(job.status)) {
    return {
      valid: false,
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    }
  }

  // Validate ISO date strings
  if (!isValidIsoDate(job.applicationDate)) {
    return { valid: false, error: 'applicationDate must be a valid ISO 8601 date' }
  }
  if (!isValidIsoDate(job.createdAt)) {
    return { valid: false, error: 'createdAt must be a valid ISO 8601 date' }
  }
  if (!isValidIsoDate(job.updatedAt)) {
    return { valid: false, error: 'updatedAt must be a valid ISO 8601 date' }
  }

  // nextActionDueDate can be empty or valid ISO
  if (job.nextActionDueDate && !isValidIsoDate(job.nextActionDueDate)) {
    return { valid: false, error: 'nextActionDueDate must be a valid ISO 8601 date or empty string' }
  }

  return { valid: true }
}

export function validateJobArray(jobs) {
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
