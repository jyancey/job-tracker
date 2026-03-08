import { useCallback, useRef, useState } from 'react'
import type { Job } from '../domain'
import {
  exportToCsv,
  exportToJson,
  importJobsFromFile,
  mergeImportedJobs,
  type ImportMode,
} from '../exportImport'
import { downloadFile } from '../utils/downloadUtils'
import * as jobService from '../services/jobService'

interface UseImportExportProps {
  jobs: Job[]
  setJobs: (updater: (jobs: Job[]) => Job[]) => void
  selection: {
    clear: () => void
  }
  undo: {
    pushState: (jobs: Job[]) => void
  }
  setCurrentPage: (page: number) => void
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

/**
 * Encapsulates import/export state and handlers.
 * Manages file input reference, import mode, and all related file operations.
 */
export function useImportExport({
  jobs,
  setJobs,
  selection,
  undo,
  setCurrentPage,
  addNotification,
}: UseImportExportProps) {
  const [importMode, setImportMode] = useState<ImportMode>('append')
  const importFileRef = useRef<HTMLInputElement>(null)

  const handleExport = useCallback(
    (format: 'json' | 'csv') => {
      try {
        const content = format === 'json' ? exportToJson(jobs) : exportToCsv(jobs)
        const timestamp = new Date().toISOString().slice(0, 10)
        downloadFile(content, `job-tracker-${timestamp}.${format}`, `text/${format}`)
        addNotification(`Exported ${jobs.length} job(s) as ${format.toUpperCase()}`, 'success')
      } catch {
        addNotification('Export failed', 'error')
      }
    },
    [jobs, addNotification],
  )

  const handleImportClick = useCallback(() => {
    importFileRef.current?.click()
  }, [])

  const handleImportFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target
      const file = input.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const imported = importJobsFromFile(content, file.name)
          if (imported.length === 0) {
            addNotification(
              'No valid jobs found in file. Expected CSV or JSON job rows.',
              'error',
            )
            return
          }

          const merge = mergeImportedJobs(jobs, imported, importMode)
          undo.pushState(jobs)
          setJobs(() => merge.jobs.sort(jobService.sortByApplicationDateDesc))
          selection.clear()
          setCurrentPage(1)
          addNotification(
            `Import ${importMode}: ${merge.inserted} inserted${merge.updated ? `, ${merge.updated} updated` : ''}.`,
            'success',
          )
        } catch {
          addNotification('Import failed', 'error')
        } finally {
          // Allow picking the same file again without changing its name.
          input.value = ''
        }
      }
      reader.readAsText(file)
    },
    [jobs, importMode, undo, selection, setJobs, setCurrentPage, addNotification],
  )

  return {
    importMode,
    setImportMode,
    importFileRef,
    handleExport,
    handleImportClick,
    handleImportFile,
  }
}
