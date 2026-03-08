import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortableHeader } from './SortableHeader'
import type { SortColumn, SortDirection } from '../hooks/useJobFiltering'

describe('SortableHeader', () => {
  it('renders header with label', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Company"
              column="company"
              currentColumn="company"
              currentDirection="asc"
              onSort={vi.fn()}
            />
          </tr>
        </thead>
      </table>,
    )

    expect(screen.getByText(/Company/)).toBeTruthy()
  })

  it('displays ascending arrow when column is active with asc direction', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Company"
              column="company"
              currentColumn="company"
              currentDirection="asc"
              onSort={vi.fn()}
            />
          </tr>
        </thead>
      </table>,
    )

    expect(screen.getAllByText('Company ↑')[0]).toBeTruthy()
  })

  it('displays descending arrow when column is active with desc direction', () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Company"
              column="company"
              currentColumn="company"
              currentDirection="desc"
              onSort={vi.fn()}
            />
          </tr>
        </thead>
      </table>,
    )

    expect(screen.getByText('Company ↓')).toBeTruthy()
  })

  it('does not display sort arrow when column is not active', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Company"
              column="company"
              currentColumn="roleTitle"
              currentDirection="asc"
              onSort={vi.fn()}
            />
          </tr>
        </thead>
      </table>,
    )

    const button = container.querySelector('button')
    // Should have only the label, no arrow
    expect(button?.textContent?.trim()).toBe('Company')
  })

  it('calls onSort with column when header is clicked', async () => {
    const user = userEvent.setup()
    const onSort = vi.fn()

    const { container } = render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Company"
              column="company"
              currentColumn="company"
              currentDirection="asc"
              onSort={onSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const button = container.querySelector('button')
    button && (await user.click(button))

    expect(onSort).toHaveBeenCalledWith('company')
    expect(onSort).toHaveBeenCalledTimes(1)
  })

  it('works with different sort columns', async () => {
    const user = userEvent.setup()
    const onSort = vi.fn()

    const sortColumns: SortColumn[] = ['company', 'roleTitle', 'applicationDate', 'status']

    for (const col of sortColumns) {
      const { unmount, container } = render(
        <table>
          <thead>
            <tr>
              <SortableHeader
                label={col}
                column={col}
                currentColumn={col}
                currentDirection="asc"
                onSort={onSort}
              />
            </tr>
          </thead>
        </table>,
      )

      const button = container.querySelector('button')
      button && (await user.click(button))

      expect(onSort).toHaveBeenCalledWith(col)

      unmount()
      onSort.mockClear()
    }
  })

  it('renders as table header cell', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Company"
              column="company"
              currentColumn="company"
              currentDirection="asc"
              onSort={vi.fn()}
            />
          </tr>
        </thead>
      </table>,
    )

    const th = container.querySelector('th')
    expect(th).toBeTruthy()
    expect(th?.classList.contains('sortable-header')).toBe(true)
  })

  it('toggles between asc and desc when same column clicked', async () => {
    const user = userEvent.setup()
    const onSort = vi.fn()

    const { rerender, container } = render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Company"
              column="company"
              currentColumn="company"
              currentDirection="asc"
              onSort={onSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const button = container.querySelector('button')
    button && (await user.click(button))
    expect(onSort).toHaveBeenCalledWith('company')

    // Simulate direction toggle by re-rendering with new direction
    rerender(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Company"
              column="company"
              currentColumn="company"
              currentDirection="desc"
              onSort={onSort}
            />
          </tr>
        </thead>
      </table>,
    )

    const updatedButton = container.querySelector('button')
    expect(updatedButton?.textContent).toContain('↓')
  })
})
