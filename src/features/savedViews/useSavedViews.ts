import { useCallback, useEffect, useState } from 'react'
import type { FilterState } from '../../components/FilterToolbar'
import type { SortColumn, SortDirection } from '../../types/filters'

const SAVED_VIEWS_STORAGE_KEY = 'jobTracker.savedViews.v1'

export interface SavedView {
  id: string
  name: string
  filters: FilterState
  sortColumn: SortColumn
  sortDirection: SortDirection
  createdAt: string
  updatedAt: string
}

interface SaveSavedViewInput {
  id?: string
  name: string
  filters: FilterState
  sortColumn: SortColumn
  sortDirection: SortDirection
}

function loadSavedViewsFromStorage(): SavedView[] {
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item): item is SavedView =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.filters === 'object' &&
        item.filters !== null &&
        typeof item.sortColumn === 'string' &&
        typeof item.sortDirection === 'string' &&
        typeof item.createdAt === 'string' &&
        typeof item.updatedAt === 'string',
    )
  } catch {
    return []
  }
}

function persistSavedViews(views: SavedView[]): void {
  localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(views))
}

export function useSavedViews() {
  const [savedViews, setSavedViews] = useState<SavedView[]>([])

  useEffect(() => {
    setSavedViews(loadSavedViewsFromStorage())
  }, [])

  useEffect(() => {
    persistSavedViews(savedViews)
  }, [savedViews])

  const saveView = useCallback((input: SaveSavedViewInput): string => {
    const now = new Date().toISOString()
    const nextId = input.id ?? crypto.randomUUID()

    setSavedViews((prev) => {
      if (input.id) {
        return prev.map((view) =>
          view.id === input.id
            ? {
                ...view,
                name: input.name,
                filters: input.filters,
                sortColumn: input.sortColumn,
                sortDirection: input.sortDirection,
                updatedAt: now,
              }
            : view,
        )
      }

      const next: SavedView = {
        id: nextId,
        name: input.name,
        filters: input.filters,
        sortColumn: input.sortColumn,
        sortDirection: input.sortDirection,
        createdAt: now,
        updatedAt: now,
      }
      return [...prev, next]
    })
    return nextId
  }, [])

  const deleteView = useCallback((id: string) => {
    setSavedViews((prev) => prev.filter((view) => view.id !== id))
  }, [])

  const renameView = useCallback((id: string, name: string) => {
    const now = new Date().toISOString()
    setSavedViews((prev) =>
      prev.map((view) =>
        view.id === id
          ? {
              ...view,
              name,
              updatedAt: now,
            }
          : view,
      ),
    )
  }, [])

  return {
    savedViews,
    saveView,
    deleteView,
    renameView,
  }
}
