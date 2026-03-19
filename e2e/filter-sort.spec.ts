import { expect, test } from '@playwright/test'
import { addJob, openTableView, resetAppState } from './helpers'

test.describe('Filter and sort workflows', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page)
  })

  test('filters by search query and sorts by company', async ({ page }) => {
    const suffix = Date.now()
    const alpha = `Alpha-${suffix}`
    const zeta = `Zeta-${suffix}`

    await addJob(page, { company: zeta, roleTitle: 'Backend Engineer', applicationDate: '2026-03-01' })
    await addJob(page, { company: alpha, roleTitle: 'Frontend Engineer', applicationDate: '2026-03-02' })

    await openTableView(page)

    const searchInput = page.getByLabel('Search jobs')
    await searchInput.fill(zeta)

    await expect(page.locator('tbody tr', { hasText: zeta })).toHaveCount(1)
    await expect(page.locator('tbody tr', { hasText: alpha })).toHaveCount(0)

    await searchInput.fill('')
    await expect(page.locator('tbody tr', { hasText: zeta })).toHaveCount(1)
    await expect(page.locator('tbody tr', { hasText: alpha })).toHaveCount(1)

    await searchInput.fill(String(suffix))
    await page.getByRole('button', { name: 'Company' }).click()
    const firstCompanyCell = page.locator('tbody tr').first().locator('td').nth(1)
    await expect(firstCompanyCell).toHaveText(alpha)
  })
})
