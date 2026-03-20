import { expect, test } from '@playwright/test'
import { openProfile, openSettings, resetAppState } from './helpers'

test.describe('Profile and settings persistence', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page)
  })

  test('persists profile fields across reloads', async ({ page }) => {
    await test.step('Save profile details', async () => {
      await openProfile(page)

      await page.getByLabel('Name').fill('Casey Candidate')
      await page.getByLabel('Current Role').fill('Staff Product Designer')
      await page.getByLabel('Preferred Location').fill('Remote')
      await page.getByPlaceholder('e.g., React, Python, AWS').fill('TypeScript')
      await page.getByRole('button', { name: 'Add', exact: true }).click()
      await page.getByRole('button', { name: 'Save Profile' }).click()

      await expect(page.getByText('Settings saved successfully')).toBeVisible()
      await expect(page.getByText('TypeScript')).toBeVisible()
    })

    await test.step('Verify profile survives a page reload', async () => {
      await page.reload()
      await openProfile(page)

      await expect(page.getByLabel('Name')).toHaveValue('Casey Candidate')
      await expect(page.getByLabel('Current Role')).toHaveValue('Staff Product Designer')
      await expect(page.getByLabel('Preferred Location')).toHaveValue('Remote')
      await expect(page.getByText('TypeScript')).toBeVisible()
    })
  })

  test('persists AI settings across reloads', async ({ page }) => {
    await test.step('Save AI provider settings', async () => {
      await openSettings(page)

      await page.getByRole('radio', { name: /OpenAI/i }).check()
      const openAiSection = page.locator('.settings-section', {
        has: page.getByRole('heading', { name: 'OpenAI Configuration' }),
      })

      await openAiSection.getByLabel('API Key').fill('sk-e2e-openai-key')
      await openAiSection.getByLabel('Model').fill('gpt-4.1-mini')
      await page.getByRole('button', { name: 'Save Settings' }).click()

      await expect(page.locator('.success-message')).toHaveText('Settings saved successfully')
    })

    await test.step('Verify settings survive a page reload', async () => {
      await page.reload()
      await openSettings(page)
      const openAiSection = page.locator('.settings-section', {
        has: page.getByRole('heading', { name: 'OpenAI Configuration' }),
      })

      await expect(page.getByRole('radio', { name: /OpenAI/i })).toBeChecked()
      await expect(openAiSection.getByLabel('API Key')).toHaveValue('sk-e2e-openai-key')
      await expect(openAiSection.getByLabel('Model')).toHaveValue('gpt-4.1-mini')
    })
  })
})
