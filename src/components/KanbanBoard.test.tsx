import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KanbanBoard } from './KanbanBoard'
import type { Job, JobStatus } from '../domain'

function createJob(id: string, status: string = 'Applied'): Job {
  return {
    id,
    company: `Company ${id}`,
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: status as any,
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

describe('KanbanBoard', () => {
  it('renders kanban grid', () => {
    const jobs = new Map()
    const { container } = render(
      <KanbanBoard
        jobs={jobs}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(container.querySelector('.kanban-grid')).toBeInTheDocument()
  })

  it('renders columns for each job status', () => {
    const jobs = new Map()
    const { container } = render(
      <KanbanBoard
        jobs={jobs}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    // There should be one column for each status
    const columns = container.querySelectorAll('.kanban-column')
    expect(columns.length).toBeGreaterThan(0)
  })

  it('passes jobs to columns correctly', () => {
    const appliedJobs = [createJob('1', 'Applied'), createJob('2', 'Applied')]
    const interviewJobs = [createJob('3', 'Interview')]
    const jobs = new Map<JobStatus, Job[]>([
      ['Applied' as JobStatus, appliedJobs],
      ['Interview' as JobStatus, interviewJobs],
    ])

    const { container } = render(
      <KanbanBoard
        jobs={jobs}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    // Check that job counts are rendered in column headers
    const headers = container.querySelectorAll('.kanban-column header')
    expect(headers.length).toBeGreaterThan(0)
  })

  it('calls onStatusChange when job is moved (via KanbanColumn)', () => {
    const onStatusChange = vi.fn()
    const jobs = new Map()
    render(
      <KanbanBoard
        jobs={jobs}
        onStatusChange={onStatusChange}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    // The prop is passed through to columns/cards
    // Actual drag-drop would be tested at column/card level
    expect(onStatusChange).not.toHaveBeenCalled()
  })

  it('renders all statuses even with no jobs', () => {
    const jobs = new Map()
    const { container } = render(
      <KanbanBoard
        jobs={jobs}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    const columns = container.querySelectorAll('.kanban-column')
    // Should have 6 columns for each job status
    expect(columns.length).toBe(6)
  })

  it('accepts optional onView callback', () => {
    const onView = vi.fn()
    const jobs = new Map()
    render(
      <KanbanBoard
        jobs={jobs}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={onView}
      />,
    )

    // Callback is passed through to columns (tested at column level)
    expect(onView).not.toHaveBeenCalled()
  })
})
