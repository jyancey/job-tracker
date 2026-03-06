import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsView } from './SettingsView'

const mockFetchDatabaseInfo = vi.fn()
const mockCreateDatabase = vi.fn()
const mockTestDatabaseConnection = vi.fn()
const mockTestAIEndpoint = vi.fn()

vi.mock('../services/settingsService', () => ({
  fetchDatabaseInfo: () => mockFetchDatabaseInfo(),
  createDatabase: () => mockCreateDatabase(),
  testDatabaseConnection: () => mockTestDatabaseConnection(),
  testAIEndpoint: (config: unknown) => mockTestAIEndpoint(config),
}))

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
    render(<SettingsView onClose={() => {}} />)

    expect(screen.getByDisplayValue('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByDisplayValue('/tmp/job-tracker.sqlite')).toBeInTheDocument()
    })
  })

  it('runs create database action', async () => {
    const user = userEvent.setup()
    render(<SettingsView onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Create Database' }))

    await waitFor(() => {
      expect(mockCreateDatabase).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Database file created successfully.')).toBeInTheDocument()
    })
  })

  it('runs database test connection action', async () => {
    const user = userEvent.setup()
    render(<SettingsView onClose={() => {}} />)

    const dbSection = screen.getByText('Database Settings').closest('.settings-section')
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

    render(<SettingsView onClose={() => {}} />)

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

    render(<SettingsView onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByLabelText('database health status')).toHaveTextContent('DB Last Success:')
      expect(screen.getByLabelText('ai health status')).toHaveTextContent('AI Last Success:')
    })
  })
})
