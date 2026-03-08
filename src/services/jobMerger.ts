import type { Job } from '../domain'

export type ImportMode = 'append' | 'upsert' | 'replace'

export interface ImportMergeResult {
  jobs: Job[]
  inserted: number
  updated: number
}

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
