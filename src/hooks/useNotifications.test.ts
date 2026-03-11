import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotifications } from './useNotifications'

describe('useNotifications', () => {
  it('initializes with empty notifications array', () => {
    const { result } = renderHook(() => useNotifications())

    expect(result.current.notifications).toEqual([])
  })

  it('adds a notification with message and type', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('Test message', 'success')
    })

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].message).toBe('Test message')
    expect(result.current.notifications[0].type).toBe('success')
  })

  it('generates unique IDs for each notification', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('Message 1', 'info')
      result.current.addNotification('Message 2', 'error')
      result.current.addNotification('Message 3', 'success')
    })

    const ids = result.current.notifications.map((n) => n.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('uses default type of info when not specified', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('Test message')
    })

    expect(result.current.notifications[0].type).toBe('info')
  })

  it('uses default duration of 3000ms when not specified', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('Test message', 'info')
    })

    expect(result.current.notifications[0].duration).toBe(3000)
  })

  it('uses custom duration when specified', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('Test message', 'error', 5000)
    })

    expect(result.current.notifications[0].duration).toBe(5000)
  })

  it('removes notification by ID', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('Message 1', 'info')
      result.current.addNotification('Message 2', 'error')
    })

    expect(result.current.notifications).toHaveLength(2)
    const idToRemove = result.current.notifications[0].id

    act(() => {
      result.current.removeNotification(idToRemove)
    })

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].id).not.toBe(idToRemove)
  })

  it('handles removing non-existent notification gracefully', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('Message', 'info')
    })

    expect(() => {
      act(() => {
        result.current.removeNotification('non-existent-id')
      })
    }).not.toThrow()

    expect(result.current.notifications).toHaveLength(1)
  })

  it('supports rapid successive notifications', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.addNotification(`Message ${i}`, 'info')
      }
    })

    expect(result.current.notifications).toHaveLength(5)
  })

  it('clears all notifications when removeNotification called multiple times', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('Message 1', 'info')
      result.current.addNotification('Message 2', 'error')
      result.current.addNotification('Message 3', 'success')
    })

    expect(result.current.notifications).toHaveLength(3)

    act(() => {
      for (const notification of result.current.notifications) {
        result.current.removeNotification(notification.id)
      }
    })

    expect(result.current.notifications).toHaveLength(0)
  })

  it('maintains notification order', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('First', 'info')
      result.current.addNotification('Second', 'error')
      result.current.addNotification('Third', 'success')
    })

    expect(result.current.notifications[0].message).toBe('First')
    expect(result.current.notifications[1].message).toBe('Second')
    expect(result.current.notifications[2].message).toBe('Third')
  })

  it('supports different notification types', () => {
    const { result } = renderHook(() => useNotifications())

    act(() => {
      result.current.addNotification('Info notification', 'info')
      result.current.addNotification('Error notification', 'error')
      result.current.addNotification('Success notification', 'success')
    })

    expect(result.current.notifications[0].type).toBe('info')
    expect(result.current.notifications[1].type).toBe('error')
    expect(result.current.notifications[2].type).toBe('success')
  })
})
