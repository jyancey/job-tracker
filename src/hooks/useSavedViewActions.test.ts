import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { FilterState } from '../components/FilterToolbar'
import type { SavedView } from '../features/savedViews/useSavedViews'
import { useSavedViewActions } from './useSavedViewActions'

const baseFilters: FilterState = {
  statusFilter: 'All',
  showAdvancedFilters: false,
  query: '',
  dateRangeStart: '',
  dateRangeEnd: '',
  salaryRangeMin: '',
  salaryRangeMax: '',
  contactPersonFilter: '',
}

function makeSavedView(overrides: Partial<SavedView> = {}): SavedView {
  return {
    id: 'view-1',
    name: 'Applied Jobs',
    filters: {
      ...baseFilters,
      statusFilter: 'Applied',
    },
    sortColumn: 'company',
    sortDirection: 'asc',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

function setup(overrides: Partial<Parameters<typeof useSavedViewActions>[0]> = {}) {
  const setActiveSavedViewId = vi.fn()
  const saveView = vi.fn().mockReturnValue('new-id')
  const deleteView = vi.fn()
  const renameView = vi.fn()
  const updateFilter = vi.fn()
  const updateQuery = vi.fn()
  const setSortColumn = vi.fn()
  const setSortDirection = vi.fn()
  const setCurrentPage = vi.fn()
  const updateView = vi.fn()
  const addNotification = vi.fn()

  const props = {
    activeSavedViewId: '',
    setActiveSavedViewId,
    savedViews: [makeSavedView()],
    saveView,
    deleteView,
    renameView,
    filtersState: baseFilters,
    updateFilter,
    updateQuery,
    sortColumn: 'applicationDate' as const,
    sortDirection: 'desc' as const,
    setSortColumn,
    setSortDirection,
    setCurrentPage,
    updateView,
    addNotification,
    ...overrides,
  }

  const hook = renderHook(() => useSavedViewActions(props))

  return {
    hook,
    props,
    setActiveSavedViewId,
    saveView,
    deleteView,
    renameView,
    updateFilter,
    updateQuery,
    setSortColumn,
    setSortDirection,
    setCurrentPage,
    updateView,
    addNotification,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useSavedViewActions', () => {
  it('clears active view and search query when applying empty saved view id', () => {
    const { hook, setActiveSavedViewId, updateQuery } = setup()

    act(() => {
      hook.result.current.applySavedView('')
    })

    expect(setActiveSavedViewId).toHaveBeenCalledWith('')
    expect(updateQuery).toHaveBeenCalledWith('')
  })

  it('does nothing when applying unknown saved view id', () => {
    const { hook, updateFilter, setSortColumn, setSortDirection } = setup()

    act(() => {
      hook.result.current.applySavedView('missing')
    })

    expect(updateFilter).not.toHaveBeenCalled()
    expect(setSortColumn).not.toHaveBeenCalled()
    expect(setSortDirection).not.toHaveBeenCalled()
  })

  it('applies saved view filters, sort, paging, view switch, and notification', () => {
    const saved = makeSavedView({ id: 'saved-2', name: 'Interview Pipeline', sortColumn: 'status', sortDirection: 'desc' })
    const {
      hook,
      updateFilter,
      setSortColumn,
      setSortDirection,
      setCurrentPage,
      updateView,
      setActiveSavedViewId,
      addNotification,
    } = setup({ savedViews: [saved] })

    act(() => {
      hook.result.current.applySavedView('saved-2')
    })

    expect(updateFilter).toHaveBeenCalledWith(saved.filters)
    expect(setSortColumn).toHaveBeenCalledWith('status')
    expect(setSortDirection).toHaveBeenCalledWith('desc')
    expect(setCurrentPage).toHaveBeenCalledWith(1)
    expect(updateView).toHaveBeenCalledWith('table')
    expect(setActiveSavedViewId).toHaveBeenCalledWith('saved-2')
    expect(addNotification).toHaveBeenCalledWith('Applied saved view: Interview Pipeline', 'info')
  })

  it('skips save when prompt is cancelled', () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null)
    const { hook, saveView } = setup()

    act(() => {
      hook.result.current.saveCurrentView()
    })

    expect(saveView).not.toHaveBeenCalled()
  })

  it('saves a new view with generated default name when no active id', () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(' My View ')
    const { hook, saveView, setActiveSavedViewId, addNotification } = setup({
      savedViews: [makeSavedView({ id: 'v1' }), makeSavedView({ id: 'v2' })],
      activeSavedViewId: '',
    })

    act(() => {
      hook.result.current.saveCurrentView()
    })

    expect(promptSpy).toHaveBeenCalledWith('Save current filters as:', 'Saved View 3')
    expect(saveView).toHaveBeenCalledWith(expect.objectContaining({
      id: undefined,
      name: 'My View',
      filters: baseFilters,
      sortColumn: 'applicationDate',
      sortDirection: 'desc',
    }))
    expect(setActiveSavedViewId).toHaveBeenCalledWith('new-id')
    expect(addNotification).toHaveBeenCalledWith('Saved current view', 'success')
  })

  it('saves over active view using current saved name as prompt default', () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Renamed Active View')
    const active = makeSavedView({ id: 'active-1', name: 'Active Name' })
    const { hook, saveView } = setup({ activeSavedViewId: 'active-1', savedViews: [active] })

    act(() => {
      hook.result.current.saveCurrentView()
    })

    expect(promptSpy).toHaveBeenCalledWith('Save current filters as:', 'Active Name')
    expect(saveView).toHaveBeenCalledWith(expect.objectContaining({
      id: 'active-1',
      name: 'Renamed Active View',
    }))
  })

  it('renames active saved view when prompt returns value', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('New Name')
    const { hook, renameView, addNotification } = setup({ activeSavedViewId: 'view-1' })

    act(() => {
      hook.result.current.renameSavedView()
    })

    expect(renameView).toHaveBeenCalledWith('view-1', 'New Name')
    expect(addNotification).toHaveBeenCalledWith('Saved view renamed', 'success')
  })

  it('does not rename when no active saved view exists', () => {
    const { hook, renameView } = setup({ activeSavedViewId: '' })

    act(() => {
      hook.result.current.renameSavedView()
    })

    expect(renameView).not.toHaveBeenCalled()
  })

  it('does not delete when user cancels confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { hook, deleteView, setActiveSavedViewId } = setup({ activeSavedViewId: 'view-1' })

    act(() => {
      hook.result.current.deleteSavedView()
    })

    expect(deleteView).not.toHaveBeenCalled()
    expect(setActiveSavedViewId).not.toHaveBeenCalled()
  })

  it('deletes active saved view after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { hook, deleteView, setActiveSavedViewId, addNotification } = setup({ activeSavedViewId: 'view-1' })

    act(() => {
      hook.result.current.deleteSavedView()
    })

    expect(deleteView).toHaveBeenCalledWith('view-1')
    expect(setActiveSavedViewId).toHaveBeenCalledWith('')
    expect(addNotification).toHaveBeenCalledWith('Saved view deleted', 'info')
  })
})
