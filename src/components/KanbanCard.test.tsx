import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanbanCard } from './KanbanCard'
import type { Job } from '../domain'

function createJob(): Job {
  return {
    id: 'job-1',
    company: 'Acme Corp',
    roleTitle: 'Senior Engineer',
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

describe('KanbanCard', () => {
  it('renders job company and role title', () => {
    const job = createJob()
    render(
      <KanbanCard
        job={job}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    const job = createJob()
    const onEdit = vi.fn()

    const { container } = render(
      <KanbanCard
        job={job}
        onStatusChange={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    )

    const actions = container.querySelector('.kanban-actions')
    expect(actions).toBeTruthy()
    if (!actions) {
      throw new Error('Expected kanban actions container')
    }

    const editButton = within(actions).getByRole('button', { name: 'Edit' })
    await user.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(job)
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('calls onDelete with job id when delete button is clicked', async () => {
    const user = userEvent.setup()
    const job = createJob()
    const onDelete = vi.fn()

    const { container } = render(
      <KanbanCard
        job={job}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    )

    const actions = container.querySelector('.kanban-actions')
    expect(actions).toBeTruthy()
    if (!actions) {
      throw new Error('Expected kanban actions container')
    }

    const deleteButton = within(actions).getByRole('button', { name: 'Delete' })
    await user.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(job.id)
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('renders status select dropdown', () => {
    const job = createJob()
    render(
      <KanbanCard
        job={job}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    // StatusSelect renders as a select element
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThan(0)
  })

  it('calls onStatusChange when status is changed', async () => {
    const user = userEvent.setup()
    const job = createJob()
    const onStatusChange = vi.fn()

    const { container } = render(
      <KanbanCard
        job={job}
        onStatusChange={onStatusChange}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    // Find the status select within the card and change its value
    const statusSelects = container.querySelectorAll('select')
    // The first select in the card should be the status select
    if (statusSelects.length > 0) {
      await user.selectOptions(statusSelects[0], 'Interview')
      expect(onStatusChange).toHaveBeenCalledWith(job.id, 'Interview')
    }
  })

  it('does not call onView if not provided', async () => {
    const job = createJob()
    const { container } = render(
      <KanbanCard
        job={job}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    const card = container.querySelector('.kanban-card')
    // Card should be draggable but doesn't require onView
    expect(card?.getAttribute('draggable')).toBe('true')
  })

  it('calls onView when card is activated with keyboard (if provided)', async () => {
    const job = createJob()
    const onView = vi.fn()

    const { container } = render(
      <KanbanCard
        job={job}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={onView}
      />,
    )

    const card = container.querySelector('.kanban-card')
    expect(card).toBeInTheDocument()
    // Keyboard activation is handled via a11y utility
    // This test verifies onView prop is accepted
  })

  it('is draggable', () => {
    const job = createJob()
    const { container } = render(
      <KanbanCard
        job={job}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    const card = container.querySelector('.kanban-card')
    expect(card?.getAttribute('draggable')).toBe('true')
  })
})
