import { expect, test } from '@playwright/test'

test.describe('Job Tracker smoke', () => {
  test('loads homepage and key sections', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Track your search like a pipeline/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Job' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Analytics' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'All Jobs' })).toBeVisible()
  })

  test('opens and closes settings view', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Settings' }).first().click()
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download Backup Snapshot' })).toBeVisible()

    // Close the settings modal by clicking the close button at the bottom
    const settingsPanel = page.locator('[class*="profile-modal"]').last()
    await settingsPanel.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('heading', { name: /Track your search like a pipeline/i })).toBeVisible()
  })
})
