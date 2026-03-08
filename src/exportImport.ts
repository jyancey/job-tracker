import type { Job } from './domain'
import { exportToCsv, importFromCsv } from './services/csvParser'
import { exportToJson, importFromJson } from './services/jsonTransfer'
import { mergeImportedJobs, type ImportMergeResult, type ImportMode } from './services/jobMerger'

export { exportToCsv, exportToJson, importFromCsv, importFromJson, mergeImportedJobs }
export type { ImportMergeResult, ImportMode }

export function importJobsFromFile(content: string, filename: string): Job[] {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.csv')) {
    return importFromCsv(content)
  }

  return importFromJson(content)
}
