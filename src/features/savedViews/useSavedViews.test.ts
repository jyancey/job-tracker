import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSavedViews } from './useSavedViews'
import type { FilterState } from '../../components/FilterToolbar'

const STORAGE_KEY = 'jobTracker.savedViews.v1'

function createFilters(overrides: Partial<FilterState> = {}): FilterState {
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

describe('useSavedViews', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads empty when nothing is stored', () => {
    const { result } = renderHook(() => useSavedViews())
    expect(result.current.savedViews).toEqual([])
  })

  it('saves a new view', () => {
    const { result } = renderHook(() => useSavedViews())

    act(() => {
      result.current.saveView({
        name: 'Interview Pipeline',
        filters: createFilters({ statusFilter: 'Interview' }),
        sortColumn: 'applicationDate',
        sortDirection: 'desc',
      })
    })

    expect(result.current.savedViews).toHaveLength(1)
    expect(result.current.savedViews[0].name).toBe('Interview Pipeline')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')).toHaveLength(1)
  })

  it('updates an existing view when id is provided', () => {
    const { result } = renderHook(() => useSavedViews())

    act(() => {
      result.current.saveView({
        name: 'Initial',
        filters: createFilters({ query: 'Acme' }),
        sortColumn: 'company',
        sortDirection: 'asc',
      })
    })

    const id = result.current.savedViews[0].id

    act(() => {
      result.current.saveView({
        id,
        name: 'Updated',
        filters: createFilters({ query: 'Globex' }),
        sortColumn: 'applicationDate',
        sortDirection: 'desc',
      })
    })

    expect(result.current.savedViews).toHaveLength(1)
    expect(result.current.savedViews[0].name).toBe('Updated')
    expect(result.current.savedViews[0].filters.query).toBe('Globex')
  })

  it('renames and deletes views', () => {
    const { result } = renderHook(() => useSavedViews())

    act(() => {
      result.current.saveView({
        name: 'To Rename',
        filters: createFilters(),
        sortColumn: 'applicationDate',
        sortDirection: 'desc',
      })
    })

    const id = result.current.savedViews[0].id

    act(() => {
      result.current.renameView(id, 'Renamed')
    })
    expect(result.current.savedViews[0].name).toBe('Renamed')

    act(() => {
      result.current.deleteView(id)
    })
    expect(result.current.savedViews).toHaveLength(0)
  })
})
