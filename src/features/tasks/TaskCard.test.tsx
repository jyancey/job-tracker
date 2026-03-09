import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Job } from '../../domain'
import { TaskCard } from './TaskCard'

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    company: 'Acme',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: 'Send follow-up',
    nextActionDueDate: '2026-03-08',
    priority: 'Medium',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('TaskCard', () => {
  it('calls task action handlers', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const onSnooze = vi.fn()
    const onPriorityChange = vi.fn()
    const onQuickAddAction = vi.fn()
    const onOpenJob = vi.fn()

    render(
      <TaskCard
        job={createJob()}
        today="2026-03-08"
        onComplete={onComplete}
        onSnooze={onSnooze}
        onPriorityChange={onPriorityChange}
        onQuickAddAction={onQuickAddAction}
        onOpenJob={onOpenJob}
      />,
    )

    await user.click(screen.getByRole('button', { name: /complete/i }))
    expect(onComplete).toHaveBeenCalledWith('job-1')

    await user.click(screen.getByRole('button', { name: /snooze 3d/i }))
    expect(onSnooze).toHaveBeenCalledWith('job-1', 3)

    await user.selectOptions(screen.getByLabelText(/priority/i), 'High')
    expect(onPriorityChange).toHaveBeenCalledWith('job-1', 'High')

    await user.clear(screen.getByPlaceholderText(/quick update action/i))
    await user.type(screen.getByPlaceholderText(/quick update action/i), 'Prep interview notes')
    await user.clear(screen.getByLabelText(/quick action due date/i))
    await user.type(screen.getByLabelText(/quick action due date/i), '2026-03-10')
    await user.click(screen.getByRole('button', { name: /save task/i }))

    expect(onQuickAddAction).toHaveBeenCalledWith('job-1', 'Prep interview notes', '2026-03-10')

    await user.click(screen.getByRole('button', { name: /acme - engineer/i }))
    expect(onOpenJob).toHaveBeenCalled()
  })
})
