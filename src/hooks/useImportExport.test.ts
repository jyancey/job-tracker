import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Job } from '../domain'
import { useImportExport } from './useImportExport'

vi.mock('../services/importExportService', () => ({
  exportToCsv: vi.fn(() => 'a,b\n1,2'),
  exportToJson: vi.fn(() => '[{"id":"1"}]'),
  importJobsFromFile: vi.fn(() => []),
  mergeImportedJobs: vi.fn(() => ({ inserted: 0, updated: 0, jobs: [] })),
}))

vi.mock('../utils/downloadUtils', () => ({
  downloadFile: vi.fn(),
}))

vi.mock('../services/jobService', () => ({
  sortByApplicationDateDesc: vi.fn((a: Job, b: Job) => b.applicationDate.localeCompare(a.applicationDate)),
}))

import {
  exportToCsv,
  exportToJson,
  importJobsFromFile,
  mergeImportedJobs,
} from '../services/importExportService'
import { downloadFile } from '../utils/downloadUtils'


function createJob(id: string): Job {
  return {
    id,
    company: `Company ${id}`,
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  }
}

function setupHook(jobs: Job[] = [createJob('1')]) {
  const setJobs = vi.fn()
  const selection = { clear: vi.fn() }
  const undo = { pushState: vi.fn() }
  const setCurrentPage = vi.fn()
  const addNotification = vi.fn()

  const hook = renderHook(() =>
    useImportExport({
      jobs,
      setJobs,
      selection,
      undo,
      setCurrentPage,
      addNotification,
    }),
  )

  return {
    ...hook,
    setJobs,
    selection,
    undo,
    setCurrentPage,
    addNotification,
  }
}

describe('useImportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with append mode and file ref', () => {
    const { result } = setupHook()

    expect(result.current.importMode).toBe('append')
    expect(result.current.importFileRef).toBeDefined()
  })

  it('exports JSON and shows success notification', () => {
    const { result, addNotification } = setupHook([createJob('1'), createJob('2')])

    act(() => {
      result.current.handleExport('json')
    })

    expect(exportToJson).toHaveBeenCalled()
    expect(downloadFile).toHaveBeenCalled()
    expect(addNotification).toHaveBeenCalledWith('Exported 2 job(s) as JSON', 'success')
  })

  it('exports CSV and shows success notification', () => {
    const { result, addNotification } = setupHook([createJob('1')])

    act(() => {
      result.current.handleExport('csv')
    })

    expect(exportToCsv).toHaveBeenCalled()
    expect(downloadFile).toHaveBeenCalled()
    expect(addNotification).toHaveBeenCalledWith('Exported 1 job(s) as CSV', 'success')
  })

  it('handles export errors', () => {
    vi.mocked(exportToJson).mockImplementationOnce(() => {
      throw new Error('boom')
    })
    const { result, addNotification } = setupHook([createJob('1')])

    act(() => {
      result.current.handleExport('json')
    })

    expect(addNotification).toHaveBeenCalledWith('Export failed', 'error')
  })

  it('triggers file input click on handleImportClick', () => {
    const { result } = setupHook()
    const click = vi.fn()

    result.current.importFileRef.current = { click } as unknown as HTMLInputElement

    act(() => {
      result.current.handleImportClick()
    })

    expect(click).toHaveBeenCalledTimes(1)
  })

  it('does nothing when import invoked with no file', () => {
    const { result } = setupHook()

    act(() => {
      result.current.handleImportFile({
        target: { files: [] },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    expect(importJobsFromFile).not.toHaveBeenCalled()
    expect(mergeImportedJobs).not.toHaveBeenCalled()
  })

  it('reports error when imported file contains no valid jobs', () => {
    const { result, addNotification } = setupHook([createJob('1')])

    const file = new File(['irrelevant'], 'jobs.csv', { type: 'text/csv' })
    class MockFileReader {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null
      readAsText() {
        this.onload?.({ target: { result: 'csv-content' } } as unknown as ProgressEvent<FileReader>)
      }
    }

    vi.stubGlobal('FileReader', MockFileReader as unknown as typeof FileReader)

    act(() => {
      result.current.handleImportFile({
        target: { files: [file], value: 'jobs.csv' },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    expect(importJobsFromFile).toHaveBeenCalledWith('csv-content', 'jobs.csv')
    expect(addNotification).toHaveBeenCalledWith(
      'No valid jobs found in file. Expected CSV or JSON job rows.',
      'error',
    )
  })

  it('merges imported jobs and applies side effects on success', () => {
    const existing = [createJob('1')]
    const imported = [createJob('2')]
    const merged = [createJob('2'), createJob('1')]
    vi.mocked(importJobsFromFile).mockReturnValueOnce(imported)
    vi.mocked(mergeImportedJobs).mockReturnValueOnce({
      inserted: 1,
      updated: 0,
      jobs: merged,
    })

    const { result, setJobs, undo, selection, setCurrentPage, addNotification } = setupHook(existing)

    const file = new File(['irrelevant'], 'jobs.json', { type: 'application/json' })
    class MockFileReader {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null
      readAsText() {
        this.onload?.({ target: { result: '[{"id":"2"}]' } } as unknown as ProgressEvent<FileReader>)
      }
    }
    vi.stubGlobal('FileReader', MockFileReader as unknown as typeof FileReader)

    const input = { files: [file], value: 'jobs.json' }
    act(() => {
      result.current.handleImportFile({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    expect(undo.pushState).toHaveBeenCalledWith(existing)
    expect(setJobs).toHaveBeenCalled()
    expect(selection.clear).toHaveBeenCalled()
    expect(setCurrentPage).toHaveBeenCalledWith(1)
    expect(addNotification).toHaveBeenCalledWith('Import append: 1 inserted.', 'success')
    expect(input.value).toBe('')
  })

  it('handles import parsing errors', () => {
    vi.mocked(importJobsFromFile).mockImplementationOnce(() => {
      throw new Error('bad import')
    })

    const { result, addNotification } = setupHook([createJob('1')])

    const file = new File(['bad'], 'bad.csv', { type: 'text/csv' })
    class MockFileReader {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null
      readAsText() {
        this.onload?.({ target: { result: 'broken' } } as unknown as ProgressEvent<FileReader>)
      }
    }
    vi.stubGlobal('FileReader', MockFileReader as unknown as typeof FileReader)

    const input = { files: [file], value: 'bad.csv' }
    act(() => {
      result.current.handleImportFile({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>)
    })

    expect(addNotification).toHaveBeenCalledWith('Import failed', 'error')
    expect(input.value).toBe('')
  })
})
