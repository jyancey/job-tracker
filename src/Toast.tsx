import { useEffect } from 'react'
import type { Notification } from './notifications'
import './Toast.css'

interface ToastProps {
  notification: Notification
  onRemove: (id: string) => void
}

function Toast({ notification, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(notification.id)
    }, notification.duration)

    return () => clearTimeout(timer)
  }, [notification, onRemove])

  return (
    <div className={`toast toast-${notification.type}`}>
      <p>{notification.message}</p>
    </div>
  )
}

interface ToastContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export function ToastContainer({ notifications, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} onRemove={onRemove} />
      ))}
    </div>
  )
}
