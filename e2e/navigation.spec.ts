import { expect, test } from '@playwright/test'
import { resetAppState } from './helpers'

test.describe('View navigation', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page)
  })

  test('navigates across dashboard, analytics, calendar, and kanban views', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Dashboard' })).toHaveClass(/active/)
    await expect(page.locator('.dashboard-grid h3', { hasText: 'Wishlist' })).toBeVisible()

    await page.getByRole('button', { name: 'Analytics' }).click()
    await expect(page.getByRole('heading', { name: 'Pipeline Analytics' })).toBeVisible()

    await page.getByRole('button', { name: 'Calendar' }).click()
    await expect(page.locator('.calendar-view')).toBeVisible()

    await page.getByRole('button', { name: 'Kanban' }).click()
    await expect(page.locator('.kanban-grid')).toBeVisible()

    await page.getByRole('button', { name: 'All Jobs' }).click()
    await expect(page.locator('.table-wrap')).toBeVisible()
  })
})
