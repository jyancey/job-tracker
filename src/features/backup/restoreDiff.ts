// Computes detailed job diffs comparing backup vs current state with field-level change tracking.
import type { Job } from '../../domain'
import type { RestoreMode } from './backupService'

export type ChangeType = 'added' | 'removed' | 'updated' | 'unchanged'

export interface FieldChange {
  field: string
  oldValue: Job[keyof Job]
  newValue: Job[keyof Job]
}

export interface JobDiff {
  id: string
  changeType: ChangeType
  company: string
  roleTitle: string
  fieldChanges: FieldChange[]
}

export interface RestoreDiff {
  changes: JobDiff[]
  summary: {
    added: number
    removed: number
    updated: number
    unchanged: number
  }
}

const COMPARABLE_FIELDS: (keyof Job)[] = [
  'company',
  'roleTitle',
  'status',
  'applicationDate',
  'jobUrl',
  'atsUrl',
  'salaryRange',
  'notes',
  'contactPerson',
  'nextAction',
  'nextActionDueDate',
  'jobDescription',
  'jobDescriptionSource',
  'scoreFit',
  'scoreCompensation',
  'scoreLocation',
  'scoreGrowth',
  'scoreConfidence',
  'aiScoredAt',
  'aiModel',
  'aiReasoning',
]

function compareJobFields(currentJob: Job, incomingJob: Job): FieldChange[] {
  const changes: FieldChange[] = []

  for (const field of COMPARABLE_FIELDS) {
    const oldValue = currentJob[field]
    const newValue = incomingJob[field]

    // Deep equality check for simple types
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field,
        oldValue,
        newValue,
      })
    }
  }

  return changes
}

export function calculateRestoreDiff(currentJobs: Job[], incomingJobs: Job[], mode: RestoreMode): RestoreDiff {
  const currentMap = new Map(currentJobs.map((job) => [job.id, job]))
  const incomingMap = new Map(incomingJobs.map((job) => [job.id, job]))
  const changes: JobDiff[] = []

  let added = 0
  let removed = 0
  let updated = 0
  let unchanged = 0

  if (mode === 'replace') {
    // In replace mode, all current jobs not in incoming are removed
    for (const currentJob of currentJobs) {
      if (!incomingMap.has(currentJob.id)) {
        changes.push({
          id: currentJob.id,
          changeType: 'removed',
          company: currentJob.company,
          roleTitle: currentJob.roleTitle,
          fieldChanges: [],
        })
        removed += 1
      }
    }

    // All incoming jobs are either added or updated
    for (const incomingJob of incomingJobs) {
      const currentJob = currentMap.get(incomingJob.id)
      if (!currentJob) {
        changes.push({
          id: incomingJob.id,
          changeType: 'added',
          company: incomingJob.company,
          roleTitle: incomingJob.roleTitle,
          fieldChanges: [],
        })
        added += 1
      } else {
        const fieldChanges = compareJobFields(currentJob, incomingJob)
        if (fieldChanges.length > 0) {
          changes.push({
            id: incomingJob.id,
            changeType: 'updated',
            company: incomingJob.company,
            roleTitle: incomingJob.roleTitle,
            fieldChanges,
          })
          updated += 1
        } else {
          changes.push({
            id: incomingJob.id,
            changeType: 'unchanged',
            company: incomingJob.company,
            roleTitle: incomingJob.roleTitle,
            fieldChanges: [],
          })
          unchanged += 1
        }
      }
    }
  } else {
    // In append/upsert mode, no jobs are removed
    for (const incomingJob of incomingJobs) {
      const currentJob = currentMap.get(incomingJob.id)
      if (!currentJob) {
        changes.push({
          id: incomingJob.id,
          changeType: 'added',
          company: incomingJob.company,
          roleTitle: incomingJob.roleTitle,
          fieldChanges: [],
        })
        added += 1
      } else {
        const fieldChanges = compareJobFields(currentJob, incomingJob)
        if (mode === 'upsert' && fieldChanges.length > 0) {
          changes.push({
            id: incomingJob.id,
            changeType: 'updated',
            company: incomingJob.company,
            roleTitle: incomingJob.roleTitle,
            fieldChanges,
          })
          updated += 1
        } else {
          changes.push({
            id: incomingJob.id,
            changeType: 'unchanged',
            company: incomingJob.company,
            roleTitle: incomingJob.roleTitle,
            fieldChanges: [],
          })
          unchanged += 1
        }
      }
    }

    // In append mode, existing jobs that aren't in incoming remain unchanged
    if (mode === 'append') {
      for (const currentJob of currentJobs) {
        if (!incomingMap.has(currentJob.id)) {
          unchanged += currentJobs.length - incomingJobs.length
          break
        }
      }
    }
  }

  // Sort: removed first, then updated, then added, then unchanged
  const sortOrder: Record<ChangeType, number> = { removed: 0, updated: 1, added: 2, unchanged: 3 }
  changes.sort((a, b) => sortOrder[a.changeType] - sortOrder[b.changeType])

  return {
    changes,
    summary: {
      added,
      removed,
      updated,
      unchanged,
    },
  }
}

export function formatFieldName(field: string): string {
  // Convert camelCase to Title Case
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

export function formatFieldValue(value: Job[keyof Job] | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '(empty)'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'string') {
    return value.length > 100 ? value.substring(0, 100) + '...' : value
  }
  return JSON.stringify(value)
}
