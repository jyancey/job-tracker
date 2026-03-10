import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { loadJobs, saveJobs } from './storage'

vi.mock('./storage', () => ({
  downloadStorageLogs: vi.fn(),
  loadJobs: vi.fn(),
  saveJobs: vi.fn(),
}))

const mockedLoadJobs = vi.mocked(loadJobs)
const mockedSaveJobs = vi.mocked(saveJobs)

async function addJob(input: {
  company: string
  role: string
  date: string
  status?: string
  nextAction?: string
}): Promise<void> {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /^add job$/i }))

  const modal = await screen.findByRole('heading', { name: /^add job$/i })
  const formScope = modal.closest('.job-form-modal')
  if (!formScope) {
    throw new Error('Missing job form modal')
  }

  const scoped = within(formScope)
  await user.clear(scoped.getByLabelText(/company \*/i))
  await user.type(scoped.getByLabelText(/company \*/i), input.company)

  await user.clear(scoped.getByLabelText(/role title \*/i))
  await user.type(scoped.getByLabelText(/role title \*/i), input.role)

  await user.clear(scoped.getByLabelText(/application date \*/i))
  await user.type(scoped.getByLabelText(/application date \*/i), input.date)

  if (input.status) {
    await user.selectOptions(scoped.getByLabelText(/^status$/i), input.status)
  }

  if (input.nextAction) {
    await user.type(scoped.getByLabelText(/next action$/i), input.nextAction)
  }

  await user.click(scoped.getByRole('button', { name: /^add job$/i }))
}

function metricValue(label: string): string {
  const card = screen.getByText(label).closest('article')
  if (!card) {
    throw new Error(`Missing metric card: ${label}`)
  }

  return within(card).getByText(/\d+/).textContent ?? ''
}

async function openAllJobsView(): Promise<void> {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'All Jobs' }))
}

function storedJob(input: {
  id: string
  company: string
  roleTitle: string
  applicationDate: string
  status: 'Wishlist' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn'
}): Record<string, string> {
  const now = '2026-03-01T00:00:00.000Z'
  return {
    id: input.id,
    company: input.company,
    roleTitle: input.roleTitle,
    applicationDate: input.applicationDate,
    status: input.status,
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: now,
    updatedAt: now,
  }
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockedLoadJobs.mockImplementation(async () => {
      const raw = localStorage.getItem('__app_test_jobs__')
      return {
        jobs: raw ? JSON.parse(raw) : [],
        didLoad: true,
      }
    })
    mockedSaveJobs.mockImplementation(async (jobs: unknown[]) => {
      localStorage.setItem('__app_test_jobs__', JSON.stringify(jobs))
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('adds a job and updates metrics', async () => {
    render(<App />)

    await addJob({
      company: 'Acme Labs',
      role: 'Product Designer',
      date: '2026-03-04',
      nextAction: 'Send recruiter follow-up',
    })

    await openAllJobsView()

    expect(screen.getByText('Acme Labs')).toBeInTheDocument()
    expect(screen.getByText('Product Designer')).toBeInTheDocument()
    expect(metricValue('Total Jobs')).toBe('1')
    expect(metricValue('In Pipeline')).toBe('1')
  })

  it('filters, edits, and deletes jobs', async () => {
    render(<App />)
    const user = userEvent.setup()

    await addJob({
      company: 'Northstar',
      role: 'Frontend Engineer',
      date: '2026-03-01',
      status: 'Applied',
    })

    await addJob({
      company: 'Brightpath',
      role: 'UX Researcher',
      date: '2026-03-02',
      status: 'Rejected',
    })

    await openAllJobsView()

    await user.selectOptions(screen.getByDisplayValue('All statuses'), 'Rejected')
    expect(screen.queryByText('Northstar')).not.toBeInTheDocument()
    expect(screen.getByText('Brightpath')).toBeInTheDocument()

    const brightpathRow = screen.getByText('Brightpath').closest('tr')
    if (!brightpathRow) {
      throw new Error('Missing Brightpath row')
    }

    await user.click(within(brightpathRow).getByRole('button', { name: 'Edit' }))
    const editTitle = await screen.findByRole('heading', { name: /^edit job$/i })
    const editModal = editTitle.closest('.job-form-modal')
    if (!editModal) {
      throw new Error('Missing edit job modal')
    }
    const editScope = within(editModal)
    await user.clear(editScope.getByLabelText(/company \*/i))
    await user.type(editScope.getByLabelText(/company \*/i), 'Brightpath Labs')
    await user.click(editScope.getByRole('button', { name: /save changes/i }))

    expect(screen.getByText('Brightpath Labs')).toBeInTheDocument()

    const updatedRow = screen.getByText('Brightpath Labs').closest('tr')
    if (!updatedRow) {
      throw new Error('Missing updated row')
    }

    await user.click(within(updatedRow).getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('Brightpath Labs')).not.toBeInTheDocument()
    expect(metricValue('Total Jobs')).toBe('1')
  })

  it('supports pagination controls in table view', async () => {
    const seededJobs = Array.from({ length: 12 }, (_, index) => {
      const n = index + 1
      return storedJob({
        id: `seed-${n}`,
        company: `Company ${n}`,
        roleTitle: `Role ${n}`,
        applicationDate: `2026-03-${String(n).padStart(2, '0')}`,
        status: 'Applied',
      })
    })
    localStorage.setItem('__app_test_jobs__', JSON.stringify(seededJobs))

    render(<App />)
    const user = userEvent.setup()

    await openAllJobsView()

    await screen.findByText('Company 12')
    await user.selectOptions(screen.getByLabelText(/rows/i), '5')

    expect(screen.getByText('Page 1 of 3 (12 results)')).toBeInTheDocument()
    expect(screen.getByText('Company 12')).toBeInTheDocument()
    expect(screen.queryByText('Company 1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByText('Page 2 of 3 (12 results)')).toBeInTheDocument()
    expect(screen.getByText('Company 7')).toBeInTheDocument()
    expect(screen.queryByText('Company 12')).not.toBeInTheDocument()
  })

  it('deletes only selected rows visible on current filter/page', async () => {
    localStorage.setItem(
      '__app_test_jobs__',
      JSON.stringify([
        storedJob({
          id: 'seed-rejected',
          company: 'Visible Rejected',
          roleTitle: 'Role A',
          applicationDate: '2026-03-01',
          status: 'Rejected',
        }),
        storedJob({
          id: 'seed-applied',
          company: 'Hidden Applied',
          roleTitle: 'Role B',
          applicationDate: '2026-03-02',
          status: 'Applied',
        }),
      ]),
    )

    render(<App />)
    const user = userEvent.setup()

    await openAllJobsView()

    await screen.findByText('Visible Rejected')
    const rejectedRow = screen.getByText('Visible Rejected').closest('tr')
    const appliedRow = screen.getByText('Hidden Applied').closest('tr')
    if (!rejectedRow || !appliedRow) {
      throw new Error('Missing rows for selection test')
    }

    await user.click(within(rejectedRow).getByRole('checkbox'))
    await user.click(within(appliedRow).getByRole('checkbox'))

    await user.selectOptions(screen.getByDisplayValue('All statuses'), 'Rejected')

    expect(screen.getByText('1 selected on page (1 selected on other pages/filters)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete Selected on Page' }))

    expect(screen.queryByText('Visible Rejected')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByDisplayValue('Rejected'), 'All')
    expect(screen.getByText('Hidden Applied')).toBeInTheDocument()
  })

  it('does not autosave when initial storage load fails', async () => {
    mockedLoadJobs.mockResolvedValueOnce({ jobs: [], didLoad: false })

    render(<App />)

    await screen.findByText('Storage is unavailable. Existing jobs were not loaded.')
    expect(mockedSaveJobs).not.toHaveBeenCalled()
  })
})
