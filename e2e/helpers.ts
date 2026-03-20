import { expect, type Page } from '@playwright/test'

export async function resetAppState(page: Page): Promise<void> {
  await page.goto('/')
  const resetResult = await page.evaluate(async () => {
    try {
      const [jobsResponse, profileResponse, configResponse] = await Promise.all([
        fetch('/api/jobs', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobs: [] }),
        }),
        fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile: {
              name: '',
              currentRole: '',
              yearsExperience: null,
              skills: [],
              preferredRoles: [],
              preferredCompanySize: '',
              preferredLocation: '',
              salaryExpectation: '',
              targetIndustries: [],
              careerGoals: '',
              dealBreakers: [],
              resumeText: '',
            },
          }),
        }),
        fetch('/api/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              provider: 'disabled',
              apiKey: '',
              baseUrl: '',
              model: 'gpt-4o-mini',
            },
          }),
        }),
      ])

      return {
        ok: jobsResponse.ok && profileResponse.ok && configResponse.ok,
        status: [jobsResponse.status, profileResponse.status, configResponse.status].join(','),
        body: JSON.stringify({
          jobs: await jobsResponse.text(),
          profile: await profileResponse.text(),
          config: await configResponse.text(),
        }),
      }
    } catch (error) {
      return {
        ok: false,
        status: -1,
        body: error instanceof Error ? error.message : 'Unknown reset error',
      }
    }
  })

  expect(
    resetResult.ok,
    `Expected /api/jobs reset to succeed before test setup. Received status ${resetResult.status}: ${resetResult.body}`,
  ).toBe(true)

  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
}

export async function addJob(page: Page, input: { company: string; roleTitle: string; applicationDate: string }) {
  await page.getByRole('button', { name: 'Add Job' }).first().click()
  await page.getByLabel('Company *').fill(input.company)
  await page.getByLabel('Role Title *').fill(input.roleTitle)
  await page.getByLabel('Application Date *').fill(input.applicationDate)
  await page.locator('.job-form-modal button[type="submit"]').click()
  await expect(page.locator('.job-form-modal')).toBeHidden()
}

export async function openProfile(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Your Profile', level: 1 })).toBeVisible()
}

export async function openSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
}

export async function openTableView(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'All Jobs' }).click()
}
