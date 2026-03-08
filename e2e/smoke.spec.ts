import { expect, test } from '@playwright/test'

test.describe('Job Tracker smoke', () => {
  test('loads homepage and key sections', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /Track your search like a pipeline/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Add Job' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Analytics' })).toBeVisible()
  })

  test('opens and closes settings view', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Settings' }).first().click()
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download Backup Snapshot' })).toBeVisible()

    await page.getByRole('button', { name: /Back to Jobs/i }).click()
    await expect(page.getByRole('heading', { name: /Track your search like a pipeline/i })).toBeVisible()
  })
})
