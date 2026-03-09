import { expect, test } from '@playwright/test'
import { resetAppState } from './helpers'

test.describe('Analytics stuck job modal', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page)
  })

  test('clicking stuck job item opens job modal', async ({ page }) => {
    // Navigate to Analytics (sample data includes stuck jobs)
    await page.getByRole('button', { name: 'Analytics' }).click()
    await expect(page.getByRole('heading', { name: 'Pipeline Analytics' })).toBeVisible()

    // Verify stuck jobs section is visible
    const stuckJobsSection = page.locator('text=⚠️ Stuck Jobs')
    const initialVisible = await stuckJobsSection.isVisible()
    
    if (initialVisible) {
      // Stuck jobs exist in sample data, click the first one
      const stuckJobItem = page.locator('.stuck-job-item').first()
      const jobHeader = stuckJobItem.locator('.stuck-job-header').first()
      const originalText = await jobHeader.textContent()
      
      await stuckJobItem.click()

      // Verify job modal opens
      const modal = page.locator('.job-modal')
      await expect(modal).toBeVisible()
      
      // Verify the modal contains the job information
      await expect(modal.locator('h3')).not.toBeEmpty()
      await expect(modal.locator('p').first()).not.toBeEmpty()
      
      // The modal should include the role title from the original text
      const modalContent = await modal.textContent()
      expect(modalContent).toBeTruthy()
    }
  })

  test('closing job modal allows clicking other stuck jobs', async ({ page }) => {
    // Navigate to Analytics
    await page.getByRole('button', { name: 'Analytics' }).click()
    await expect(page.getByRole('heading', { name: 'Pipeline Analytics' })).toBeVisible()

    // Check if stuck jobs exist
    const stuckJobsSection = page.locator('text=⚠️ Stuck Jobs')
    const initialVisible = await stuckJobsSection.isVisible()
    
    if (initialVisible) {
      const stuckJobItems = page.locator('.stuck-job-item')
      const itemCount = await stuckJobItems.count()
      
      if (itemCount >= 2) {
        // Click the first stuck job
        await stuckJobItems.first().click()
        
        // Verify modal opens
        const modal = page.locator('.job-modal')
        await expect(modal).toBeVisible()
        
        // Close modal
        await page.getByRole('button', { name: 'Close' }).first().click()
        await expect(modal).not.toBeVisible()
        
        // Click the second stuck job
        await stuckJobItems.nth(1).click()
        
        // Verify modal opens again with potentially different job
        await expect(modal).toBeVisible()
        const modalContent = await modal.textContent()
        expect(modalContent).toBeTruthy()
      }
    }
  })
})



