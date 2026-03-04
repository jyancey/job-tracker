export type NotificationType = 'success' | 'error' | 'info'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration: number
}

function generateId(): string {
  return `${Date.now()}-${Math.random()}`
}

export function createNotification(
  message: string,
  type: NotificationType = 'info',
  duration: number = 3000,
): Notification {
  return {
    id: generateId(),
    message,
    type,
    duration,
  }
}
