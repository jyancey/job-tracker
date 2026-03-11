import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Job, JobPriority } from '../../domain'
import { TodayView } from './TodayView'
import { ThisWeekView } from './ThisWeekView'

function createTestJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '1',
    company: 'Acme Corp',
    roleTitle: 'Senior Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: 'https://example.com/job1',
    atsUrl: '',
    salaryRange: '$100k-$150k',
    notes: 'Interested',
    contactPerson: 'John Doe',
    nextAction: 'Follow up with recruiter',
    nextActionDueDate: '2026-03-08',
    priority: 'High' as JobPriority,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-08T00:00:00Z',
    ...overrides,
  }
}

describe('TodayView', () => {
  const mockOnComplete = vi.fn()
  const mockOnSnooze = vi.fn()
  const mockOnPriorityChange = vi.fn()
  const mockOnQuickAddAction = vi.fn()
  const mockOnOpenJob = vi.fn()

  const defaultProps = {
    jobs: [],
    today: '2026-03-08',
    overdueCount: 0,
    onComplete: mockOnComplete,
    onSnooze: mockOnSnooze,
    onPriorityChange: mockOnPriorityChange,
    onQuickAddAction: mockOnQuickAddAction,
    onOpenJob: mockOnOpenJob,
  }

  it('renders header with title', () => {
    render(<TodayView {...defaultProps} />)
    expect(screen.getByText('Today Actions')).toBeInTheDocument()
  })

  it('renders overdue count in badge', () => {
    render(<TodayView {...defaultProps} overdueCount={3} />)
    expect(screen.getByText('Overdue: 3')).toBeInTheDocument()
  })

  it('renders empty state when no jobs', () => {
    const { container } = render(<TodayView {...defaultProps} jobs={[]} />)
    expect(container.textContent).toContain('No tasks due today')
  })

  it('renders TaskCard for each job', () => {
    const jobs = [createTestJob({ id: 'job1' }), createTestJob({ id: 'job2' })]
    const { container } = render(<TodayView {...defaultProps} jobs={jobs} />)
    // Check that task cards are rendered (they'll have task-card class)
    expect(container.querySelectorAll('.task-card')).toHaveLength(2)
  })

  it('renders zero overdue count', () => {
    const { container } = render(<TodayView {...defaultProps} overdueCount={0} />)
    expect(container.textContent).toContain('Overdue: 0')
  })

  it('applies correct CSS class to container', () => {
    const { container } = render(<TodayView {...defaultProps} />)
    expect(container.querySelector('.tasks-view')).toBeInTheDocument()
  })

  it('renders multiple jobs without duplicates', () => {
    const jobs = [
      createTestJob({ id: '1', company: 'Company A' }),
      createTestJob({ id: '2', company: 'Company B' }),
      createTestJob({ id: '3', company: 'Company C' }),
    ]
    const { container } = render(<TodayView {...defaultProps} jobs={jobs} />)
    expect(container.querySelectorAll('.task-card')).toHaveLength(3)
  })
})

describe('ThisWeekView', () => {
  const mockOnComplete = vi.fn()
  const mockOnSnooze = vi.fn()
  const mockOnPriorityChange = vi.fn()
  const mockOnQuickAddAction = vi.fn()
  const mockOnOpenJob = vi.fn()

  const defaultProps = {
    groupedJobs: [],
    today: '2026-03-08',
    onComplete: mockOnComplete,
    onSnooze: mockOnSnooze,
    onPriorityChange: mockOnPriorityChange,
    onQuickAddAction: mockOnQuickAddAction,
    onOpenJob: mockOnOpenJob,
  }

  it('renders header with title', () => {
    render(<ThisWeekView {...defaultProps} />)
    expect(screen.getByText('This Week Actions')).toBeInTheDocument()
  })

  it('renders empty state when no grouped jobs', () => {
    const { container } = render(<ThisWeekView {...defaultProps} groupedJobs={[]} />)
    expect(container.textContent).toContain('No tasks due in the next 7 days')
  })

  it('renders grouped jobs by date', () => {
    const groupedJobs: Array<[string, Job[]]> = [
      ['2026-03-08', [createTestJob({ id: '1', nextActionDueDate: '2026-03-08' })]],
      ['2026-03-09', [createTestJob({ id: '2', nextActionDueDate: '2026-03-09' })]],
    ]
    const { container } = render(<ThisWeekView {...defaultProps} groupedJobs={groupedJobs} />)
    expect(container.textContent).toContain('2026-03-08')
    expect(container.textContent).toContain('2026-03-09')
  })

  it('renders multiple jobs within a date group', () => {
    const jobs = [
      createTestJob({ id: 'a', company: 'Company A', nextActionDueDate: '2026-03-08' }),
      createTestJob({ id: 'b', company: 'Company B', nextActionDueDate: '2026-03-08' }),
    ]
    const groupedJobs: Array<[string, Job[]]> = [['2026-03-08', jobs]]
    const { container } = render(<ThisWeekView {...defaultProps} groupedJobs={groupedJobs} />)
    
    // Check that task cards are rendered
    expect(container.querySelectorAll('.task-card')).toHaveLength(2)
  })

  it('renders multiple date sections', () => {
    const groupedJobs: Array<[string, Job[]]> = [
      ['2026-03-08', [createTestJob({ id: '1', nextActionDueDate: '2026-03-08' })]],
      ['2026-03-09', [createTestJob({ id: '2', nextActionDueDate: '2026-03-09' })]],
      ['2026-03-10', [createTestJob({ id: '3', nextActionDueDate: '2026-03-10' })]],
    ]
    const { container } = render(<ThisWeekView {...defaultProps} groupedJobs={groupedJobs} />)

    // Verify all date sections render
    expect(container.textContent).toContain('2026-03-08')
    expect(container.textContent).toContain('2026-03-09')
    expect(container.textContent).toContain('2026-03-10')
    
    // Verify section structure
    const sections = container.querySelectorAll('.tasks-group')
    expect(sections).toHaveLength(3)
  })

  it('applies correct CSS classes', () => {
    const groupedJobs: Array<[string, Job[]]> = [
      ['2026-03-08', [createTestJob({ id: '1' })]],
    ]
    const { container } = render(<ThisWeekView {...defaultProps} groupedJobs={groupedJobs} />)
    expect(container.querySelector('.tasks-view')).toBeInTheDocument()
    expect(container.querySelector('.tasks-group')).toBeInTheDocument()
    expect(container.querySelector('.tasks-list')).toBeInTheDocument()
  })

  it('renders TaskCard components for each job', () => {
    const groupedJobs: Array<[string, Job[]]> = [
      [
        '2026-03-08',
        [
          createTestJob({ id: '1', company: 'Acme' }),
          createTestJob({ id: '2', company: 'Beta' }),
        ],
      ],
    ]
    const { container } = render(<ThisWeekView {...defaultProps} groupedJobs={groupedJobs} />)
    expect(container.querySelectorAll('.task-card')).toHaveLength(2)
  })

  it('preserves date order from grouped jobs', () => {
    const groupedJobs: Array<[string, Job[]]> = [
      ['2026-03-10', [createTestJob({ id: '3' })]],
      ['2026-03-08', [createTestJob({ id: '1' })]],
      ['2026-03-09', [createTestJob({ id: '2' })]],
    ]
    const { container } = render(<ThisWeekView {...defaultProps} groupedJobs={groupedJobs} />)
    const sections = container.querySelectorAll('.tasks-group')
    expect(sections).toHaveLength(3)
    // Verify order is maintained as provided
    expect(sections[0].textContent).toContain('2026-03-10')
    expect(sections[1].textContent).toContain('2026-03-08')
    expect(sections[2].textContent).toContain('2026-03-09')
  })
})
