import { useState } from 'react'
import { createNotification, type Notification } from '../notifications'

export interface UseNotificationsResult {
  notifications: Notification[]
  addNotification: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void
  removeNotification: (id: string) => void
}

/**
 * Hook to manage application notifications/toasts
 */
export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([])

  function addNotification(
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration?: number,
  ): void {
    const notification = createNotification(message, type, duration)
    setNotifications((current) => [...current, notification])
  }

  function removeNotification(id: string): void {
    setNotifications((current) => current.filter((n) => n.id !== id))
  }

  return {
    notifications,
    addNotification,
    removeNotification,
  }
}
