import { expect, test } from '@playwright/test'
import { addJob, resetAppState } from './helpers'

test.describe('Analytics drill-down', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page)
  })

  test('clicking analytics status card opens filtered table view', async ({ page }) => {
    await addJob(page, {
      company: `Applied Co ${Date.now()}`,
      roleTitle: 'Engineer',
      applicationDate: '2026-03-01',
    })

    await page.getByRole('button', { name: 'Analytics' }).click()
    await expect(page.getByRole('heading', { name: 'Pipeline Analytics' })).toBeVisible()

    await page.locator('.stat-card.interactive-card', { hasText: 'Applied' }).first().click()

    await expect(page.getByRole('button', { name: 'All Jobs' })).toHaveClass(/active/)
    await expect(page.locator('.quick-filters select').first()).toHaveValue('Applied')
  })
})
