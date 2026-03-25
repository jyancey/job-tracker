import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarView } from './CalendarView'
import type { Job } from '../domain'

function createJob(id: string, overrides: Partial<Job> = {}): Job {
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
    ...overrides,
  }
}

describe('CalendarView', () => {
  it('renders empty state when no due dates exist', () => {
    render(<CalendarView dueByDate={[]} />)

    expect(screen.getAllByText('No scheduled follow-ups yet.').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/\d{4}/).length).toBeGreaterThan(0)
  })

  it('renders jobs for matching calendar day and supports +more indicator', () => {
    const dueByDate: [string, Job[]][] = [
      [
        '2026-03-15',
        [
          createJob('1', { company: 'Acme' }),
          createJob('2', { company: 'Globex' }),
          createJob('3', { company: 'Initech' }),
        ],
      ],
    ]

    render(<CalendarView dueByDate={dueByDate} />)

    expect(screen.getAllByText('Acme').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Globex').length).toBeGreaterThan(0)
    expect(screen.queryByText('Initech')).not.toBeInTheDocument()
    expect(screen.getAllByText('+1 more').length).toBeGreaterThan(0)
  })

  it('navigates between months using arrows', async () => {
    const user = userEvent.setup()
    const dueByDate: [string, Job[]][] = [['2026-03-15', [createJob('1')]]]

    render(<CalendarView dueByDate={dueByDate} />)

    const before = screen.getAllByRole('heading', { level: 2 })[0].textContent
    const nextButton = screen.getAllByRole('button', { name: '→' })[0]
    await user.click(nextButton)

    const afterNext = screen.getAllByRole('heading', { level: 2 })[0].textContent
    expect(afterNext).not.toBe(before)

    const prevButton = screen.getAllByRole('button', { name: '←' })[0]
    await user.click(prevButton)

    const afterPrev = screen.getAllByRole('heading', { level: 2 })[0].textContent
    expect(afterPrev).toBe(before)
  })

  it('calls onView when clicking a calendar job entry', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    const job = createJob('1', { company: 'Acme', roleTitle: 'Backend Engineer' })

    const { container } = render(<CalendarView dueByDate={[['2026-03-15', [job]]]} onView={onView} />)

    const entry = container.querySelector('.calendar-job-entry') as HTMLElement
    await user.click(entry)

    expect(onView).toHaveBeenCalledWith(job)
  })
})
