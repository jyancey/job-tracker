import type { Job } from '../domain'
import { exportToCsv, importFromCsv } from './csvParser'
import { exportToJson } from './jsonExport'
import { importFromJson } from './jsonTransfer'
import { mergeImportedJobs, type ImportMergeResult, type ImportMode } from './jobMerger'

export { exportToCsv, exportToJson, importFromCsv, importFromJson, mergeImportedJobs }
export type { ImportMergeResult, ImportMode }

export function importJobsFromFile(content: string, filename: string): Job[] {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.csv')) {
    return importFromCsv(content)
  }

  return importFromJson(content)
}