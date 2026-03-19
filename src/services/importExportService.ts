// Routes import/export operations to CSV or JSON handler based on file extension.
import type { Job } from '../domain'
import { exportToCsv, importFromCsv } from './csvParser'
import { exportToJson } from './jsonExport'
import { importFromJson } from './jsonTransfer'
import { mergeImportedJobs, type ImportMergeResult, type ImportMode } from './jobMerger'

export { exportToCsv, exportToJson, importFromCsv, importFromJson, mergeImportedJobs }
export type { ImportMergeResult, ImportMode }

/**
 * Parse jobs from a raw file string.
 *
 * Dispatches to the CSV importer for `.csv` files and to the JSON importer
 * for all other extensions.
 *
 * @param content - Raw text content of the uploaded file.
 * @param filename - Original filename, used to determine the parser.
 * @returns The parsed list of jobs.
 */
export function importJobsFromFile(content: string, filename: string): Job[] {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.csv')) {
    return importFromCsv(content)
  }

  return importFromJson(content)
}