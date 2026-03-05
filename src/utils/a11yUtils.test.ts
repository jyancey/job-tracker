import { describe, it, expect, vi } from 'vitest'
import {
  isEnterOrSpace,
  createKeyboardActivationHandler,
  createButtonKbdProps,
  stopPropagation,
  composeEventHandlers,
} from './a11yUtils'

describe('a11yUtils', () => {
  describe('isEnterOrSpace', () => {
    it('returns true for Enter key', () => {
      const event = { key: 'Enter' } as React.KeyboardEvent
      expect(isEnterOrSpace(event)).toBe(true)
    })

    it('returns true for Space key', () => {
      const event = { key: ' ' } as React.KeyboardEvent
      expect(isEnterOrSpace(event)).toBe(true)
    })

    it('returns false for other keys', () => {
      expect(isEnterOrSpace({ key: 'Tab' } as React.KeyboardEvent)).toBe(false)
      expect(isEnterOrSpace({ key: 'Escape' } as React.KeyboardEvent)).toBe(false)
      expect(isEnterOrSpace({ key: 'a' } as React.KeyboardEvent)).toBe(false)
      expect(isEnterOrSpace({ key: 'ArrowDown' } as React.KeyboardEvent)).toBe(false)
    })
  })

  describe('createKeyboardActivationHandler', () => {
    it('calls callback when Enter is pressed', () => {
      const callback = vi.fn()
      const handler = createKeyboardActivationHandler(callback)
      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent

      handler(event)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('calls callback when Space is pressed', () => {
      const callback = vi.fn()
      const handler = createKeyboardActivationHandler(callback)
      const event = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent

      handler(event)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('does not call callback for other keys', () => {
      const callback = vi.fn()
      const handler = createKeyboardActivationHandler(callback)
      const event = {
        key: 'Tab',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent

      handler(event)

      expect(callback).not.toHaveBeenCalled()
      expect(event.preventDefault).not.toHaveBeenCalled()
    })
  })

  describe('createButtonKbdProps', () => {
    it('returns all required button props', () => {
      const callback = vi.fn()
      const props = createButtonKbdProps(callback, 'Click me')

      expect(props).toHaveProperty('onClick')
      expect(props).toHaveProperty('onKeyDown')
      expect(props).toHaveProperty('role')
      expect(props).toHaveProperty('tabIndex')
      expect(props).toHaveProperty('title')

      expect(props.role).toBe('button')
      expect(props.tabIndex).toBe(0)
      expect(props.title).toBe('Click me')
    })

    it('onClick calls the callback', () => {
      const callback = vi.fn()
      const props = createButtonKbdProps(callback)

      props.onClick()

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('onKeyDown handles Enter and Space', () => {
      const callback = vi.fn()
      const props = createButtonKbdProps(callback)

      const enterEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent
      props.onKeyDown(enterEvent)
      expect(callback).toHaveBeenCalledTimes(1)

      const spaceEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent
      props.onKeyDown(spaceEvent)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('omits title when label is not provided', () => {
      const callback = vi.fn()
      const props = createButtonKbdProps(callback)

      expect(props).not.toHaveProperty('title')
    })

    it('includes title when label is provided', () => {
      const callback = vi.fn()
      const props = createButtonKbdProps(callback, 'Test label')

      expect(props.title).toBe('Test label')
    })
  })

  describe('stopPropagation', () => {
    it('calls stopPropagation on the event', () => {
      const event = {
        stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent

      stopPropagation(event)

      expect(event.stopPropagation).toHaveBeenCalledTimes(1)
    })
  })

  describe('composeEventHandlers', () => {
    it('calls all handlers in sequence', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      const composed = composeEventHandlers(handler1, handler2, handler3)
      const event = {} as React.SyntheticEvent

      composed(event)

      expect(handler1).toHaveBeenCalledWith(event)
      expect(handler2).toHaveBeenCalledWith(event)
      expect(handler3).toHaveBeenCalledWith(event)
    })

    it('calls handlers in the correct order', () => {
      const callOrder: number[] = []
      const handler1 = vi.fn(() => callOrder.push(1))
      const handler2 = vi.fn(() => callOrder.push(2))
      const handler3 = vi.fn(() => callOrder.push(3))

      const composed = composeEventHandlers(handler1, handler2, handler3)
      composed({} as React.SyntheticEvent)

      expect(callOrder).toEqual([1, 2, 3])
    })

    it('works with empty handler list', () => {
      const composed = composeEventHandlers()
      expect(() => composed({} as React.SyntheticEvent)).not.toThrow()
    })

    it('works with single handler', () => {
      const handler = vi.fn()
      const composed = composeEventHandlers(handler)
      const event = {} as React.SyntheticEvent

      composed(event)

      expect(handler).toHaveBeenCalledWith(event)
    })
  })
})
