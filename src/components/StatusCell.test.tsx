import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusCell } from './StatusCell'
import type { JobStatus } from '../domain'

describe('StatusCell', () => {
  it('renders table cell with StatusSelect', () => {
    const { container } = render(
      <StatusCell
        value="Applied"
        onChange={vi.fn()}
        jobId="job-1"
      />,
    )

    const td = container.querySelector('td')
    expect(td).toBeTruthy()
  })

  it('renders StatusSelect with provided job status', () => {
    const { container } = render(
      <StatusCell
        value="Interview"
        onChange={vi.fn()}
        jobId="job-1"
      />,
    )

    const td = container.querySelector('td')
    const select = td?.querySelector('select') as HTMLSelectElement
    expect(select?.value).toBe('Interview')
  })

  it('calls onChange with jobId and new status when status changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    const { container } = render(
      <StatusCell
        value="Applied"
        onChange={onChange}
        jobId="job-123"
      />,
    )

    const select = container.querySelector('select') as HTMLSelectElement
    await user.selectOptions(select, 'Interview')

    expect(onChange).toHaveBeenCalledWith('job-123', 'Interview')
  })

  it('calls onChange with correct jobId', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    const { container } = render(
      <StatusCell
        value="Applied"
        onChange={onChange}
        jobId="job-abc-xyz"
      />,
    )

    const select = container.querySelector('select') as HTMLSelectElement
    await user.selectOptions(select, 'Rejected')

    expect(onChange).toHaveBeenCalledWith('job-abc-xyz', 'Rejected')
  })

  it('supports optional className prop', () => {
    const { container } = render(
      <StatusCell
        value="Applied"
        onChange={vi.fn()}
        jobId="job-1"
        className="custom-status-cell"
      />,
    )

    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.classList.contains('custom-status-cell')).toBe(true)
  })

  it('allows selecting all valid job statuses', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const statuses: JobStatus[] = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Withdrawn']

    for (const status of statuses) {
      const { unmount, container } = render(
        <StatusCell
          value="Applied"
          onChange={onChange}
          jobId="job-1"
        />,
      )

      const select = container.querySelector('select') as HTMLSelectElement
      await user.selectOptions(select, status)

      expect(onChange).toHaveBeenCalledWith('job-1', status)

      unmount()
      onChange.mockClear()
    }
  })
})

