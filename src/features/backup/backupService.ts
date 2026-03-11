import type { Job } from '../../domain'
import { mergeImportedJobs, type ImportMode, importFromJson } from '../../services/importExportService'

/**
 * A point-in-time snapshot of all jobs that can be stored and later restored.
 */
export interface BackupSnapshot {
  /** Literal discriminant used to identify backup files on import. */
  kind: 'job-tracker-backup'
  /** Schema version for forward-compatibility detection. Currently `1`. */
  schemaVersion: 1
  /** ISO timestamp for when this snapshot was created. */
  createdAt: string
  /** The jobs captured in this snapshot. */
  jobs: Job[]
}

/**
 * The projected change counts when a restore is applied, calculated before
 * any data is actually written. Used to render a restore-preview diff.
 */
export interface RestoreImpact {
  /** Number of jobs that will be newly added. */
  inserted: number
  /** Number of jobs that will be updated (merge mode only). */
  updated: number
  /** Number of jobs that will be removed from the current list (replace mode only). */
  removed: number
  /** Final job count after the restore completes. */
  finalCount: number
}

/** Determines how a restore operation handles the existing job list. Alias of {@link ImportMode}. */
export type RestoreMode = ImportMode

/**
 * Create a new backup snapshot from the current job list.
 *
 * @param jobs - The full current job list to capture.
 * @returns A {@link BackupSnapshot} stamped with the current timestamp.
 */
export function createBackupSnapshot(jobs: Job[]): BackupSnapshot {
  return {
    kind: 'job-tracker-backup',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    jobs: [...jobs],
  }
}

/**
 * Serialize a backup snapshot to a formatted JSON string.
 *
 * @param snapshot - The snapshot to serialize.
 * @returns A pretty-printed JSON string suitable for file download.
 */
export function serializeBackup(snapshot: BackupSnapshot): string {
  return JSON.stringify(snapshot, null, 2)
}

/**
 * Parse and validate a backup file string into a {@link BackupSnapshot}.
 *
 * Also accepts plain exported job arrays for backward compatibility with
 * pre-backup export files.
 *
 * @param content - Raw file content to parse.
 * @returns The parsed snapshot, or `null` if the content is invalid or unrecognized.
 */
export function parseBackup(content: string): BackupSnapshot | null {
  try {
    const parsed = JSON.parse(content) as Partial<BackupSnapshot>

    if (parsed.kind === 'job-tracker-backup' && parsed.schemaVersion === 1 && Array.isArray(parsed.jobs)) {
      const jobs = parsed.jobs.filter(
        (item): item is Job =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          typeof item.company === 'string' &&
          typeof item.roleTitle === 'string' &&
          typeof item.applicationDate === 'string' &&
          typeof item.status === 'string',
      )

      return {
        kind: 'job-tracker-backup',
        schemaVersion: 1,
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
        jobs,
      }
    }

    // Backward compatibility: allow plain exported jobs arrays.
    const jobs = importFromJson(content)
    if (jobs.length > 0) {
      return {
        kind: 'job-tracker-backup',
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        jobs,
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Calculate the projected impact of restoring a backup without applying any changes.
 *
 * Use this to render a diff preview before the user confirms the restore.
 *
 * @param currentJobs - The current list of jobs.
 * @param incomingJobs - The jobs from the backup being evaluated.
 * @param mode - How the restore would be applied.
 * @returns Counts for inserted, updated, and removed records, plus the expected final count.
 */
export function calculateRestoreImpact(currentJobs: Job[], incomingJobs: Job[], mode: RestoreMode): RestoreImpact {
  if (mode === 'replace') {
    const currentIds = new Set(currentJobs.map((job) => job.id))
    const incomingIds = new Set(incomingJobs.map((job) => job.id))
    let removed = 0
    currentIds.forEach((id) => {
      if (!incomingIds.has(id)) {
        removed += 1
      }
    })

    return {
      inserted: incomingJobs.length,
      updated: 0,
      removed,
      finalCount: incomingJobs.length,
    }
  }

  const merged = mergeImportedJobs(currentJobs, incomingJobs, mode)
  return {
    inserted: merged.inserted,
    updated: merged.updated,
    removed: 0,
    finalCount: merged.jobs.length,
  }
}

/**
 * Apply a restore operation and return the resulting job list.
 *
 * @param currentJobs - The current list of jobs.
 * @param incomingJobs - The jobs from the backup being restored.
 * @param mode - How the restore merges with the existing list.
 * @returns The new job list after applying the restore.
 */
export function applyRestore(currentJobs: Job[], incomingJobs: Job[], mode: RestoreMode): Job[] {
  if (mode === 'replace') {
    return [...incomingJobs]
  }

  return mergeImportedJobs(currentJobs, incomingJobs, mode).jobs
}

/**
 * Generate a timestamped filename for a backup download.
 *
 * @param now - The timestamp to use. Defaults to the current date/time.
 * @returns A filename in the form `job-tracker-backup-<timestamp>.json`.
 */
export function backupFilename(now = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
  return `job-tracker-backup-${stamp}.json`
}
