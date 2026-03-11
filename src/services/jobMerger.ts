import type { Job } from '../domain'

/**
 * How an import batch should be merged into the existing job list.
 *
 * - `'append'` — Add all incoming jobs after the existing list.
 * - `'upsert'` — Update matching jobs by `id`; insert new ones.
 * - `'replace'` — Replace the entire existing list with the incoming batch.
 */
export type ImportMode = 'append' | 'upsert' | 'replace'

/**
 * The outcome of a {@link mergeImportedJobs} operation.
 */
export interface ImportMergeResult {
  /** The merged result set. */
  jobs: Job[]
  /** Number of jobs that were newly added. */
  inserted: number
  /** Number of jobs that were updated in-place (upsert mode only). */
  updated: number
}

/**
 * Merge an imported batch of jobs into the existing list using the specified mode.
 *
 * @param existing - The current list of jobs.
 * @param imported - The incoming batch of jobs from the import operation.
 * @param mode - How conflicts and new entries should be handled.
 * @returns The merged result set plus counts for inserted and updated records.
 */
export function mergeImportedJobs(existing: Job[], imported: Job[], mode: ImportMode): ImportMergeResult {
  if (mode === 'replace') {
    return {
      jobs: [...imported],
      inserted: imported.length,
      updated: 0,
    }
  }

  if (mode === 'append') {
    return {
      jobs: [...existing, ...imported],
      inserted: imported.length,
      updated: 0,
    }
  }

  const merged = new Map(existing.map((job) => [job.id, job]))
  let inserted = 0
  let updated = 0

  for (const importedJob of imported) {
    if (merged.has(importedJob.id)) {
      updated += 1
    } else {
      inserted += 1
    }
    merged.set(importedJob.id, importedJob)
  }

  return {
    jobs: [...merged.values()],
    inserted,
    updated,
  }
}
