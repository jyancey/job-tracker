import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePageReset } from './usePageReset'
import type { FilterState } from '../components/FilterToolbar'

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

describe('usePageReset', () => {
  it('resets to page one on mount', () => {
    const setCurrentPage = vi.fn()

    renderHook(() => usePageReset(createState(), setCurrentPage))

    expect(setCurrentPage).toHaveBeenCalledWith(1)
  })

  it('resets to page one when filter values change', () => {
    const setCurrentPage = vi.fn()
    const { rerender } = renderHook(
      ({ state }: { state: FilterState }) => usePageReset(state, setCurrentPage),
      { initialProps: { state: createState() } },
    )

    rerender({ state: createState({ query: 'Acme' }) })

    expect(setCurrentPage).toHaveBeenCalledTimes(2)
    expect(setCurrentPage).toHaveBeenLastCalledWith(1)
  })
})