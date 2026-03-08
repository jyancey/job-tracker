import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterToolbar, type FilterState } from './FilterToolbar'

function createState(overrides: Partial<FilterState> = {}): FilterState {
  return {
    statusFilter: 'All',
    showAdvancedFilters: false,
    query: '',
    dateRangeStart: '',
    dateRangeEnd: '',
    salaryRangeMin: '',
    salaryRangeMax: '',
    contactPersonFilter: '',
    ...overrides,
  }
}

describe('FilterToolbar', () => {
  afterEach(() => {
    cleanup()
  })

  it('calls onToggleAdvanced when More Filters is clicked', async () => {
    const user = userEvent.setup()
    const onToggleAdvanced = vi.fn()

    render(
      <FilterToolbar
        state={createState()}
        onDispatch={vi.fn()}
        onToggleAdvanced={onToggleAdvanced}
        onClearAdvanced={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'More Filters' }))

    expect(onToggleAdvanced).toHaveBeenCalledTimes(1)
  })

  it('dispatches status updates from status dropdown', async () => {
    const user = userEvent.setup()
    const onDispatch = vi.fn()

    const { container } = render(
      <FilterToolbar
        state={createState()}
        onDispatch={onDispatch}
        onToggleAdvanced={vi.fn()}
        onClearAdvanced={vi.fn()}
      />,
    )

    await user.selectOptions(within(container).getByRole('combobox'), 'Interview')

    expect(onDispatch).toHaveBeenCalledWith({ type: 'status', value: 'Interview' })
  })

  it('shows and handles clear overdue button when overdue filter is active', async () => {
    const user = userEvent.setup()
    const onDispatch = vi.fn()

    render(
      <FilterToolbar
        state={createState({ statusFilter: 'Overdue Follow-ups' })}
        onDispatch={onDispatch}
        onToggleAdvanced={vi.fn()}
        onClearAdvanced={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear Overdue Filter' }))

    expect(onDispatch).toHaveBeenCalledWith({ type: 'status', value: 'All' })
  })

  it('dispatches advanced filter changes and clear action', async () => {
    const user = userEvent.setup()
    const onDispatch = vi.fn()
    const onClearAdvanced = vi.fn()

    render(
      <FilterToolbar
        state={createState({ showAdvancedFilters: true })}
        onDispatch={onDispatch}
        onToggleAdvanced={vi.fn()}
        onClearAdvanced={onClearAdvanced}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Search company, role, or notes'), {
      target: { value: 'Acme' },
    })
    fireEvent.change(screen.getByPlaceholderText('From'), { target: { value: '2026-03-01' } })
    fireEvent.change(screen.getByPlaceholderText('To'), { target: { value: '2026-03-31' } })
    fireEvent.change(screen.getByPlaceholderText('Min salary'), { target: { value: '100000' } })
    fireEvent.change(screen.getByPlaceholderText('Max salary'), { target: { value: '150000' } })
    fireEvent.change(screen.getByPlaceholderText('Contact person'), { target: { value: 'Taylor' } })
    await user.click(screen.getByRole('button', { name: 'Clear Advanced' }))

    expect(onDispatch).toHaveBeenCalledWith({ type: 'query', value: 'Acme' })
    expect(onDispatch).toHaveBeenCalledWith({ type: 'dateStart', value: '2026-03-01' })
    expect(onDispatch).toHaveBeenCalledWith({ type: 'dateEnd', value: '2026-03-31' })
    expect(onDispatch).toHaveBeenCalledWith({ type: 'salaryMin', value: '100000' })
    expect(onDispatch).toHaveBeenCalledWith({ type: 'salaryMax', value: '150000' })
    expect(onDispatch).toHaveBeenCalledWith({ type: 'contact', value: 'Taylor' })
    expect(onClearAdvanced).toHaveBeenCalledTimes(1)
  })
})
