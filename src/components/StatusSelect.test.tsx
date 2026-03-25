import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusSelect } from './StatusSelect'

describe('StatusSelect', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders with current value selected', () => {
    const onChange = vi.fn()
    render(<StatusSelect value="Applied" onChange={onChange} placeholder={false} />)

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('Applied')
  })

  it('shows all job statuses as options', () => {
    const onChange = vi.fn()
    render(<StatusSelect value="Applied" onChange={onChange} placeholder={false} />)

    expect(screen.getByRole('option', { name: 'Applied' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Phone Screen' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Interview' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Offer' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Rejected' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Withdrawn' })).toBeInTheDocument()
  })

  it('calls onChange when value is changed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StatusSelect value="Applied" onChange={onChange} placeholder={false} />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'Interview')

    expect(onChange).toHaveBeenCalledWith('Interview')
  })

  it('shows placeholder when provided', () => {
    const onChange = vi.fn()
    render(<StatusSelect value="" onChange={onChange} placeholder="Select status" />)

    expect(screen.getByRole('option', { name: 'Select status' })).toBeInTheDocument()
  })

  it('uses default placeholder when not specified', () => {
    const onChange = vi.fn()
    render(<StatusSelect value="" onChange={onChange} />)

    expect(screen.getByRole('option', { name: 'Select status' })).toBeInTheDocument()
  })

  it('hides placeholder when placeholder is false', () => {
    const onChange = vi.fn()
    render(<StatusSelect value="Applied" onChange={onChange} placeholder={false} />)

    expect(screen.queryByText('Select status')).not.toBeInTheDocument()
  })

  it('shows "All statuses" option when showAllStatus is true', () => {
    const onChange = vi.fn()
    render(<StatusSelect value="All" onChange={onChange} showAllStatus placeholder={false} />)

    expect(screen.getByRole('option', { name: 'All statuses' })).toBeInTheDocument()
  })

  it('shows "Overdue Follow-ups" option when showOverdueFilter is true', () => {
    const onChange = vi.fn()
    render(
      <StatusSelect
        value="Overdue Follow-ups"
        onChange={onChange}
        showOverdueFilter
        placeholder={false}
      />
    )

    expect(screen.getByRole('option', { name: 'Overdue Follow-ups' })).toBeInTheDocument()
  })

  it('shows both filter options when both flags are true', () => {
    const onChange = vi.fn()
    render(
      <StatusSelect
        value="All"
        onChange={onChange}
        showAllStatus
        showOverdueFilter
        placeholder={false}
      />
    )

    expect(screen.getByRole('option', { name: 'All statuses' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Overdue Follow-ups' })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const onChange = vi.fn()
    render(
      <StatusSelect value="Applied" onChange={onChange} className="custom-class" placeholder={false} />
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('custom-class')
  })

  it('handles disabled state', () => {
    const onChange = vi.fn()
    render(<StatusSelect value="Applied" onChange={onChange} disabled placeholder={false} />)

    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('calls onClick handler when provided', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onClick = vi.fn()
    render(
      <StatusSelect value="Applied" onChange={onChange} onClick={onClick} placeholder={false} />
    )

    const select = screen.getByRole('combobox')
    await user.click(select)

    expect(onClick).toHaveBeenCalled()
  })

  it('works in filter mode with all options', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StatusSelect
        value="All"
        onChange={onChange}
        showAllStatus
        showOverdueFilter
        placeholder={false}
      />
    )

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'Applied')

    expect(onChange).toHaveBeenCalledWith('Applied')
  })

  it('works in job form mode without filter options', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<StatusSelect value="Wishlist" onChange={onChange} placeholder={false} />)

    expect(screen.queryByRole('option', { name: 'All statuses' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Overdue Follow-ups' })).not.toBeInTheDocument()

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'Applied')

    expect(onChange).toHaveBeenCalledWith('Applied')
  })
})
