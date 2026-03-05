/**
 * Accessibility utilities for keyboard interactions, ARIA patterns, and a11y helpers
 * Extracted from components to promote reuse across interactive elements
 */

/**
 * Check if a keyboard event is Enter or Space key
 * Used for button-like keyboard activation
 * @param event - Keyboard event
 * @returns true if key is Enter or Space
 */
export function isEnterOrSpace(event: React.KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' '
}

/**
 * Creates keyboard event handler for spacebar/enter to trigger a callback
 * Prevents default browser behavior and calls the callback
 * @param callback - Function to invoke on Enter/Space
 * @returns KeyboardEvent handler
 */
export function createKeyboardActivationHandler(
  callback: () => void
): (event: React.KeyboardEvent) => void {
  return (event: React.KeyboardEvent) => {
    if (isEnterOrSpace(event)) {
      event.preventDefault()
      callback()
    }
  }
}

/**
 * Standard keyboard props for any clickable element that should be keyboard accessible
 * Use with div/span that have role="button" and are clickable
 * @param callback - Function to invoke on click/keyboard activation
 * @param label - Aria-label or title for the element
 * @returns Object with onClick, onKeyDown, role, tabIndex, and title props
 */
export function createButtonKbdProps(
  callback: () => void,
  label?: string
): {
  onClick: () => void
  onKeyDown: (event: React.KeyboardEvent) => void
  role: string
  tabIndex: number
  title?: string
} {
  return {
    onClick: callback,
    onKeyDown: createKeyboardActivationHandler(callback),
    role: 'button',
    tabIndex: 0,
    ...(label && { title: label }),
  }
}

/**
 * Stop event propagation in a click handler
 * Useful for nested interactive elements (e.g., button inside card)
 * @param event - Click event to stop propagation
 */
export function stopPropagation(event: React.MouseEvent): void {
  event.stopPropagation()
}

/**
 * Combine multiple event handlers into a single handler
 * Useful for elements that need both their own handler and stop propagation
 * @param handlers - Event handlers to call in sequence
 * @returns Combined handler
 */
export function composeEventHandlers<T extends React.SyntheticEvent>(
  ...handlers: Array<(event: T) => void>
): (event: T) => void {
  return (event: T) => {
    handlers.forEach((handler) => handler(event))
  }
}
