/** Visual style variant for a {@link Notification}. */
export type NotificationType = 'success' | 'error' | 'info'

/**
 * A transient UI notification displayed in the toast stack.
 */
export interface Notification {
  /** Unique identifier for this notification instance. */
  id: string
  /** The message to display in the toast. */
  message: string
  /** Visual style variant. */
  type: NotificationType
  /** How long the notification should remain visible, in milliseconds. */
  duration: number
}

function generateId(): string {
  return `${Date.now()}-${Math.random()}`
}

/**
 * Create a new {@link Notification} with a generated ID.
 *
 * @param message - The message to display.
 * @param type - Visual style variant. Defaults to `'info'`.
 * @param duration - Display duration in milliseconds. Defaults to `3000`.
 * @returns A new notification ready to be added to the notification stack.
 */
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
