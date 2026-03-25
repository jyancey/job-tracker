import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders pagination info with page numbers', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalResults={45}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Page 2 of 5 (45 results)')).toBeTruthy()
  })

  it('renders Previous button disabled on first page', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    const buttons = container.querySelectorAll('button')
    const previousBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Previous'),
    )
    expect((previousBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('renders Previous button enabled on non-first page', () => {
    const { container } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    const buttons = container.querySelectorAll('button')
    const previousBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Previous'),
    )
    expect((previousBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('renders Next button disabled on last page', () => {
    const { container } = render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    const buttons = container.querySelectorAll('button')
    const nextBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Next') && !btn.textContent?.includes('Previous'),
    )
    expect((nextBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('renders Next button enabled on non-last page', () => {
    const { container } = render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    const buttons = container.querySelectorAll('button')
    const nextBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Next') && !btn.textContent?.includes('Previous'),
    )
    expect((nextBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls onPageChange with previous page when Previous clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    const { container } = render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    )

    const buttons = container.querySelectorAll('button')
    const previousBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Previous'),
    )
    await user.click(previousBtn as HTMLButtonElement)

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with next page when Next clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    const { container } = render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    )

    const buttons = container.querySelectorAll('button')
    const nextBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Next') && !btn.textContent?.includes('Previous'),
    )
    await user.click(nextBtn as HTMLButtonElement)

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('renders page size select with default options', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    const select = screen.getAllByRole('combobox')[0]
    expect(select).toBeTruthy()
    expect(select).toHaveValue('10')
  })

  it('renders page size select with custom options', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalResults={50}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        pageSizeOptions={[15, 25, 50]}
      />,
    )

    const select = container.querySelector('select')
    expect((select as HTMLSelectElement).value).toBe('25')
  })

  it('calls onPageSizeChange when page size selected', async () => {
    const user = userEvent.setup()
    const onPageSizeChange = vi.fn()
    const onPageChange = vi.fn()

    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 50]}
      />,
    )

    const select = container.querySelector('select') as HTMLSelectElement
    await user.selectOptions(select, '20')

    expect(onPageSizeChange).toHaveBeenCalledWith(20)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('returns null when hideWhenEmpty is true and totalResults is 0', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={0}
        totalResults={0}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        hideWhenEmpty={true}
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders even when totalResults is 0 and hideWhenEmpty is false', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={0}
        totalResults={0}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        hideWhenEmpty={false}
      />,
    )

    expect(screen.getByText('Page 1 of 0 (0 results)')).toBeTruthy()
  })

  it('prevents Previous button from going below page 1', async () => {
    const onPageChange = vi.fn()

    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    )

    const buttons = container.querySelectorAll('button')
    const previousBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Previous'),
    )
    // Button should be disabled, but if clicked, it should call with Math.max(1, 0)
    expect((previousBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('prevents Next button from exceeding totalPages', async () => {
    const onPageChange = vi.fn()

    const { container } = render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalResults={50}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    )

    const buttons = container.querySelectorAll('button')
    const nextBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Next') && !btn.textContent?.includes('Previous'),
    )
    // Button should be disabled, but if clicked, it should call with Math.min(5, 6)
    expect((nextBtn as HTMLButtonElement).disabled).toBe(true)
  })
})
