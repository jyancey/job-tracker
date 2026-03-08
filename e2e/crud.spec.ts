import { expect, test } from '@playwright/test'
import { addJob, openTableView, resetAppState } from './helpers'

test.describe('CRUD workflow', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page)
  })

  test('create, edit, and delete a job from table view', async ({ page }) => {
    const company = `Acme-${Date.now()}`

    await addJob(page, {
      company,
      roleTitle: 'Platform Engineer',
      applicationDate: '2026-03-01',
    })

    await openTableView(page)
    const row = page.locator('tbody tr', { hasText: company }).first()
    await expect(row).toBeVisible()

    await row.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByRole('heading', { name: 'Edit Job' })).toBeVisible()
    await page.getByLabel('Role Title *').fill('Senior Platform Engineer')
    await page.getByRole('button', { name: 'Save Changes' }).click()

    const updatedRow = page.locator('tbody tr', { hasText: company }).first()
    await expect(updatedRow).toContainText('Senior Platform Engineer')

    await updatedRow.getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('tbody tr', { hasText: company })).toHaveCount(0)
  })
})
