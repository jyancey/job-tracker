import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsView } from './SettingsView'
import type { Job, JobStatus } from '../domain'

const mockFetchDatabaseInfo = vi.fn()
const mockCreateDatabase = vi.fn()
const mockTestDatabaseConnection = vi.fn()
const mockTestAIEndpoint = vi.fn()
const mockDownloadJsonFile = vi.fn()

vi.mock('../services/settingsService', () => ({
  fetchDatabaseInfo: () => mockFetchDatabaseInfo(),
  createDatabase: () => mockCreateDatabase(),
  testDatabaseConnection: () => mockTestDatabaseConnection(),
  testAIEndpoint: (config: unknown) => mockTestAIEndpoint(config),
}))

vi.mock('../utils/downloadUtils', () => ({
  downloadJsonFile: (...args: unknown[]) => mockDownloadJsonFile(...args),
}))

function makeJob(overrides: Partial<Job> = {}): Job {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    company: 'Acme',
    roleTitle: 'Engineer',
    applicationDate: now,
    status: 'Applied' as JobStatus,
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function renderSettings(props?: Partial<ComponentProps<typeof SettingsView>>) {
  const jobs = [makeJob({ id: 'job-1' })]
  const setJobs = vi.fn()
  const addNotification = vi.fn()

  const utils = render(
    <SettingsView
      onClose={() => {}}
      jobs={jobs}
      setJobs={setJobs}
      addNotification={addNotification}
      {...props}
    />,
  )

  return { jobs, setJobs, addNotification, ...utils }
}

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockFetchDatabaseInfo.mockResolvedValue({
      provider: 'sqlite',
      dbPath: '/tmp/job-tracker.sqlite',
      exists: true,
    })
    mockCreateDatabase.mockResolvedValue({
      created: true,
      dbPath: '/tmp/job-tracker.sqlite',
      exists: true,
    })
    mockTestDatabaseConnection.mockResolvedValue({
      ok: true,
      dbPath: '/tmp/job-tracker.sqlite',
    })
    mockTestAIEndpoint.mockResolvedValue({
      ok: true,
      message: 'Connected to OpenAI endpoint',
      latencyMs: 42,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('loads and displays database info', async () => {
    renderSettings()

    expect(screen.getByDisplayValue('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByDisplayValue('/tmp/job-tracker.sqlite')).toBeInTheDocument()
    })
  })

  it('runs create database action', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole('button', { name: 'Create Database' }))

    await waitFor(() => {
      expect(mockCreateDatabase).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Database file created successfully.')).toBeInTheDocument()
    })
  })

  it('runs database test connection action', async () => {
    const user = userEvent.setup()
    renderSettings()

    const dbSection = screen.getByText('Database Settings').closest('.settings-section') as HTMLElement | null
    if (!dbSection) {
      throw new Error('Database settings section not found')
    }

    await user.click(within(dbSection).getByRole('button', { name: 'Test Connection' }))

    await waitFor(() => {
      expect(mockTestDatabaseConnection).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Database connection successful.')).toBeInTheDocument()
      expect(localStorage.getItem('job-tracker-settings-db-last-success')).toBeTruthy()
    })
  })

  it('runs AI endpoint test action', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'job-tracker-ai-config',
      JSON.stringify({ provider: 'openai', apiKey: 'sk-test', baseUrl: '', model: 'gpt-4o-mini' }),
    )

    renderSettings()

    await user.click(screen.getByRole('button', { name: 'Test AI Endpoint' }))

    await waitFor(() => {
      expect(mockTestAIEndpoint).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Connected to OpenAI endpoint (42 ms)')).toBeInTheDocument()
      expect(localStorage.getItem('job-tracker-settings-ai-last-success')).toBeTruthy()
    })
  })

  it('shows persisted health timestamps on load', async () => {
    localStorage.setItem('job-tracker-settings-db-last-success', '2026-03-06T12:00:00.000Z')
    localStorage.setItem('job-tracker-settings-ai-last-success', '2026-03-06T13:00:00.000Z')

    renderSettings()

    await waitFor(() => {
      expect(screen.getByLabelText('database health status')).toHaveTextContent('DB Last Success:')
      expect(screen.getByLabelText('ai health status')).toHaveTextContent('AI Last Success:')
    })
  })

  it('downloads backup snapshot', async () => {
    const user = userEvent.setup()
    const { addNotification } = renderSettings()

    await user.click(screen.getByRole('button', { name: 'Download Backup Snapshot' }))

    expect(mockDownloadJsonFile).toHaveBeenCalledTimes(1)
    expect(addNotification).toHaveBeenCalledWith('Backup created for 1 jobs', 'success')
  })

  it('loads restore file, previews impact, and applies restore', async () => {
    const user = userEvent.setup()
    const incoming = [makeJob({ id: 'job-2', company: 'NewCo' })]

    class MockFileReader {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null
      readAsText() {
        this.onload?.(
          {
            target: {
              result: JSON.stringify({
                kind: 'job-tracker-backup',
                schemaVersion: 1,
                createdAt: '2026-03-08T00:00:00.000Z',
                jobs: incoming,
              }),
            },
          } as unknown as ProgressEvent<FileReader>,
        )
      }
    }

    vi.stubGlobal('FileReader', MockFileReader as unknown as typeof FileReader)

    const { container, jobs, setJobs, addNotification } = renderSettings()
    const restoreInput = container.querySelector('input[type="file"][accept=".json,application/json"]')
    if (!restoreInput) {
      throw new Error('Restore input not found')
    }

    fireEvent.change(restoreInput, {
      target: {
        files: [new File(['backup'], 'backup.json', { type: 'application/json' })],
      },
    })

    await waitFor(() => {
      expect(screen.getByLabelText('restore impact preview')).toHaveTextContent('Final total: 2 jobs.')
    })

    await user.click(screen.getByRole('button', { name: 'Apply Restore' }))

    expect(setJobs).toHaveBeenCalledTimes(1)
    const updater = setJobs.mock.calls[0][0] as (value: Job[]) => Job[]
    expect(updater(jobs)).toHaveLength(2)
    expect(addNotification).toHaveBeenCalledWith('Backup restore applied successfully', 'success')
  })
})
