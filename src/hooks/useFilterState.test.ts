import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilterState } from './useFilterState'

describe('useFilterState', () => {
  it('initializes with default empty filter state', () => {
    const { result } = renderHook(() => useFilterState())

    expect(result.current.state.query).toBe('')
    expect(result.current.state.statusFilter).toBe('All')
    expect(result.current.state.dateRangeStart).toBe('')
    expect(result.current.state.dateRangeEnd).toBe('')
    expect(result.current.state.salaryRangeMin).toBe('')
    expect(result.current.state.salaryRangeMax).toBe('')
    expect(result.current.state.contactPersonFilter).toBe('')
    expect(result.current.state.showAdvancedFilters).toBe(false)
  })

  describe('updateQuery', () => {
    it('updates search query', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateQuery('Google')
      })

      expect(result.current.state.query).toBe('Google')
    })

    it('handles empty string', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateQuery('test')
        result.current.updateQuery('')
      })

      expect(result.current.state.query).toBe('')
    })
  })

  describe('updateStatusFilter', () => {
    it('updates status filter', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateStatusFilter('Applied')
      })

      expect(result.current.state.statusFilter).toBe('Applied')
    })

    it('handles Overdue Follow-ups filter', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateStatusFilter('Overdue Follow-ups')
      })

      expect(result.current.state.statusFilter).toBe('Overdue Follow-ups')
    })
  })

  describe('updateDateRange', () => {
    it('updates date range start and end', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateDateRange('2026-03-01', '2026-03-31')
      })

      expect(result.current.state.dateRangeStart).toBe('2026-03-01')
      expect(result.current.state.dateRangeEnd).toBe('2026-03-31')
    })

    it('allows partial date ranges', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateDateRange('2026-03-01', '')
      })

      expect(result.current.state.dateRangeStart).toBe('2026-03-01')
      expect(result.current.state.dateRangeEnd).toBe('')
    })
  })

  describe('updateSalaryRange', () => {
    it('updates salary range min and max', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateSalaryRange('100000', '150000')
      })

      expect(result.current.state.salaryRangeMin).toBe('100000')
      expect(result.current.state.salaryRangeMax).toBe('150000')
    })

    it('allows clearing salary range', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateSalaryRange('100', '200')
        result.current.updateSalaryRange('', '')
      })

      expect(result.current.state.salaryRangeMin).toBe('')
      expect(result.current.state.salaryRangeMax).toBe('')
    })
  })

  describe('updateContactPersonFilter', () => {
    it('updates contact person filter', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateContactPersonFilter('John Doe')
      })

      expect(result.current.state.contactPersonFilter).toBe('John Doe')
    })
  })

  describe('toggleAdvancedFilters', () => {
    it('toggles advanced filters visibility', () => {
      const { result } = renderHook(() => useFilterState())

      expect(result.current.state.showAdvancedFilters).toBe(false)

      act(() => {
        result.current.toggleAdvancedFilters()
      })

      expect(result.current.state.showAdvancedFilters).toBe(true)

      act(() => {
        result.current.toggleAdvancedFilters()
      })

      expect(result.current.state.showAdvancedFilters).toBe(false)
    })
  })

  describe('clearAdvancedFilters', () => {
    it('clears all advanced filters', () => {
      const { result } = renderHook(() => useFilterState())

      // Set all filters
      act(() => {
        result.current.updateQuery('Google')
        result.current.updateDateRange('2026-01-01', '2026-12-31')
        result.current.updateSalaryRange('100000', '150000')
        result.current.updateContactPersonFilter('Jane Smith')
      })

      // Clear advanced filters
      act(() => {
        result.current.clearAdvancedFilters()
      })

      // Query should NOT be cleared (it's not an advanced filter)
      expect(result.current.state.query).toBe('Google')
      expect(result.current.state.dateRangeStart).toBe('')
      expect(result.current.state.dateRangeEnd).toBe('')
      expect(result.current.state.salaryRangeMin).toBe('')
      expect(result.current.state.salaryRangeMax).toBe('')
      expect(result.current.state.contactPersonFilter).toBe('')
    })

    it('preserves status filter when clearing', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateStatusFilter('Applied')
        result.current.updateQuery('test')
        result.current.clearAdvancedFilters()
      })

      expect(result.current.state.statusFilter).toBe('Applied')
    })
  })

  describe('dispatch', () => {
    it('handles query action', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.dispatch({ type: 'query', value: 'Software Engineer' })
      })

      expect(result.current.state.query).toBe('Software Engineer')
    })

    it('handles status action', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.dispatch({ type: 'status', value: 'Interview' })
      })

      expect(result.current.state.statusFilter).toBe('Interview')
    })

    it('handles dateStart action', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.dispatch({ type: 'dateStart', value: '2026-01-01' })
      })

      expect(result.current.state.dateRangeStart).toBe('2026-01-01')
    })

    it('handles dateEnd action', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.dispatch({ type: 'dateEnd', value: '2026-12-31' })
      })

      expect(result.current.state.dateRangeEnd).toBe('2026-12-31')
    })

    it('handles salaryMin action', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.dispatch({ type: 'salaryMin', value: '120000' })
      })

      expect(result.current.state.salaryRangeMin).toBe('120000')
    })

    it('handles salaryMax action', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.dispatch({ type: 'salaryMax', value: '180000' })
      })

      expect(result.current.state.salaryRangeMax).toBe('180000')
    })

    it('handles contact action', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.dispatch({ type: 'contact', value: 'recruiter@company.com' })
      })

      expect(result.current.state.contactPersonFilter).toBe('recruiter@company.com')
    })

    it('handles multiple dispatch calls', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.dispatch({ type: 'query', value: 'Backend' })
        result.current.dispatch({ type: 'status', value: 'Applied' })
        result.current.dispatch({ type: 'salaryMin', value: '100000' })
      })

      expect(result.current.state.query).toBe('Backend')
      expect(result.current.state.statusFilter).toBe('Applied')
      expect(result.current.state.salaryRangeMin).toBe('100000')
    })
  })

  describe('updateFilter', () => {
    it('updates any filter field by key', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateFilter({ query: 'DevOps Engineer' })
        result.current.updateFilter({ statusFilter: 'Offer' })
        result.current.updateFilter({ salaryRangeMin: '140000' })
      })

      expect(result.current.state.query).toBe('DevOps Engineer')
      expect(result.current.state.statusFilter).toBe('Offer')
      expect(result.current.state.salaryRangeMin).toBe('140000')
    })

    it('can update multiple fields at once', () => {
      const { result } = renderHook(() => useFilterState())

      act(() => {
        result.current.updateFilter({
          query: 'Engineer',
          statusFilter: 'Interview',
          salaryRangeMin: '120000',
        })
      })

      expect(result.current.state.query).toBe('Engineer')
      expect(result.current.state.statusFilter).toBe('Interview')
      expect(result.current.state.salaryRangeMin).toBe('120000')
    })
  })
})
