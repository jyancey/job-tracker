import { useCallback } from 'react'
import type { FilterState } from '../components/FilterToolbar'
import type { SavedView } from '../features/savedViews/useSavedViews'
import type { View } from './useViewState'
import type { SortColumn, SortDirection } from '../types/filters'

interface UseSavedViewActionsProps {
  activeSavedViewId: string
  setActiveSavedViewId: (id: string) => void
  savedViews: SavedView[]
  saveView: (input: {
    id?: string
    name: string
    filters: FilterState
    sortColumn: SortColumn
    sortDirection: SortDirection
  }) => string
  deleteView: (id: string) => void
  renameView: (id: string, name: string) => void
  filtersState: FilterState
  updateFilter: (next: FilterState) => void
  updateQuery: (query: string) => void
  sortColumn: SortColumn
  sortDirection: SortDirection
  setSortColumn: (column: SortColumn) => void
  setSortDirection: (direction: SortDirection) => void
  setCurrentPage: (page: number) => void
  updateView: (view: View) => void
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

/**
 * Encapsulates saved-view apply/save/rename/delete flows and side effects.
 */
export function useSavedViewActions({
  activeSavedViewId,
  setActiveSavedViewId,
  savedViews,
  saveView,
  deleteView,
  renameView,
  filtersState,
  updateFilter,
  updateQuery,
  sortColumn,
  sortDirection,
  setSortColumn,
  setSortDirection,
  setCurrentPage,
  updateView,
  addNotification,
}: UseSavedViewActionsProps) {
  const applySavedView = useCallback((id: string) => {
    if (!id) {
      setActiveSavedViewId('')
      updateQuery('')
      return
    }

    const preset = savedViews.find((viewPreset) => viewPreset.id === id)
    if (!preset) {
      return
    }

    updateFilter(preset.filters)
    setSortColumn(preset.sortColumn)
    setSortDirection(preset.sortDirection)
    setCurrentPage(1)
    updateView('table')
    setActiveSavedViewId(id)
    addNotification(`Applied saved view: ${preset.name}`, 'info')
  }, [addNotification, savedViews, setActiveSavedViewId, setCurrentPage, setSortColumn, setSortDirection, updateFilter, updateQuery, updateView])

  const saveCurrentView = useCallback(() => {
    const defaultName = activeSavedViewId
      ? savedViews.find((viewPreset) => viewPreset.id === activeSavedViewId)?.name ?? 'Saved View'
      : `Saved View ${savedViews.length + 1}`
    const name = window.prompt('Save current filters as:', defaultName)?.trim()
    if (!name) {
      return
    }

    const savedId = saveView({
      id: activeSavedViewId || undefined,
      name,
      filters: filtersState,
      sortColumn,
      sortDirection,
    })
    setActiveSavedViewId(savedId)
    addNotification('Saved current view', 'success')
  }, [activeSavedViewId, addNotification, filtersState, saveView, savedViews, setActiveSavedViewId, sortColumn, sortDirection])

  const renameSavedViewAction = useCallback(() => {
    if (!activeSavedViewId) {
      return
    }

    const current = savedViews.find((viewPreset) => viewPreset.id === activeSavedViewId)
    if (!current) {
      return
    }

    const nextName = window.prompt('Rename saved view:', current.name)?.trim()
    if (!nextName) {
      return
    }

    renameView(activeSavedViewId, nextName)
    addNotification('Saved view renamed', 'success')
  }, [activeSavedViewId, addNotification, renameView, savedViews])

  const deleteSavedViewAction = useCallback(() => {
    if (!activeSavedViewId) {
      return
    }

    const current = savedViews.find((viewPreset) => viewPreset.id === activeSavedViewId)
    if (!current) {
      return
    }

    const confirmed = window.confirm(`Delete saved view "${current.name}"?`)
    if (!confirmed) {
      return
    }

    deleteView(activeSavedViewId)
    setActiveSavedViewId('')
    addNotification('Saved view deleted', 'info')
  }, [activeSavedViewId, addNotification, deleteView, savedViews, setActiveSavedViewId])

  return {
    applySavedView,
    saveCurrentView,
    renameSavedView: renameSavedViewAction,
    deleteSavedView: deleteSavedViewAction,
  }
}