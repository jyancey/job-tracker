import type { Job } from '../../domain'
import { mergeImportedJobs, type ImportMode, importFromJson } from '../../services/importExportService'

export interface BackupSnapshot {
  kind: 'job-tracker-backup'
  schemaVersion: 1
  createdAt: string
  jobs: Job[]
}

export interface RestoreImpact {
  inserted: number
  updated: number
  removed: number
  finalCount: number
}

export type RestoreMode = ImportMode

export function createBackupSnapshot(jobs: Job[]): BackupSnapshot {
  return {
    kind: 'job-tracker-backup',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    jobs: [...jobs],
  }
}

export function serializeBackup(snapshot: BackupSnapshot): string {
  return JSON.stringify(snapshot, null, 2)
}

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

export function applyRestore(currentJobs: Job[], incomingJobs: Job[], mode: RestoreMode): Job[] {
  if (mode === 'replace') {
    return [...incomingJobs]
  }

  return mergeImportedJobs(currentJobs, incomingJobs, mode).jobs
}

export function backupFilename(now = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
  return `job-tracker-backup-${stamp}.json`
}
