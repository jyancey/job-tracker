import type { Page } from '@playwright/test'

export async function resetAppState(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
}

export async function addJob(page: Page, input: { company: string; roleTitle: string; applicationDate: string }) {
  await page.getByLabel('Company *').fill(input.company)
  await page.getByLabel('Role Title *').fill(input.roleTitle)
  await page.getByLabel('Application Date *').fill(input.applicationDate)
  await page.getByRole('button', { name: 'Add Job' }).click()
}

export async function openTableView(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'All Jobs' }).click()
}
