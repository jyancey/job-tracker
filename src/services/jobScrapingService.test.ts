import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isJobUrl, scrapeJobDescription } from './jobScrapingService'

describe('jobScrapingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('isJobUrl', () => {
    it('returns true for known job board hostnames', () => {
      expect(isJobUrl('https://www.linkedin.com/jobs/view/123')).toBe(true)
      expect(isJobUrl('https://indeed.com/viewjob?jk=abc')).toBe(true)
    })

    it('returns true for job-related paths', () => {
      expect(isJobUrl('https://company.com/careers/software-engineer')).toBe(true)
      expect(isJobUrl('https://company.com/job/backend-engineer')).toBe(true)
      expect(isJobUrl('https://company.com/opening/senior-dev')).toBe(true)
    })

    it('returns false for non-job urls and invalid urls', () => {
      expect(isJobUrl('https://example.com/about')).toBe(false)
      expect(isJobUrl('not-a-url')).toBe(false)
    })
  })

  describe('scrapeJobDescription', () => {
    it('returns error for invalid URL format', async () => {
      const result = await scrapeJobDescription('not-a-url')

      expect(result.success).toBe(false)
      expect(result.description).toBe('')
      expect(result.error).toBeTruthy()
    })

    it('returns http error when fetch response is not ok', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('not found', { status: 404, statusText: 'Not Found' })),
      )

      const result = await scrapeJobDescription('https://example.com/jobs/1')

      expect(result.success).toBe(false)
      expect(result.description).toBe('')
      expect(result.error).toBe('HTTP 404: Not Found')
    })

    it('extracts description and title from HTML with job-description container', async () => {
      const html = `
        <html>
          <head><title>Senior Engineer - Acme</title></head>
          <body>
            <div class="job-description">
              <p>Build distributed systems and improve platform reliability across teams.</p>
              <p>Work with product and design to ship customer-facing features.</p>
              <p>Own architecture decisions and mentor other engineers in the org.</p>
            </div>
          </body>
        </html>
      `

      vi.stubGlobal('fetch', vi.fn(async () => new Response(html, { status: 200 })))

      const result = await scrapeJobDescription('https://example.com/jobs/2')

      expect(result.success).toBe(true)
      expect(result.title).toContain('Senior Engineer')
      expect(result.description.length).toBeGreaterThan(100)
      expect(result.error).toBeUndefined()
    })

    it('falls back to body text extraction when specific container is missing', async () => {
      const html = `
        <html>
          <head><title>Role</title></head>
          <body>
            <main>
              <h1>Platform Engineer</h1>
              <p>This role focuses on developer productivity, CI pipelines, and observability systems.</p>
              <p>You will collaborate with security and infrastructure teams to improve reliability posture.</p>
            </main>
          </body>
        </html>
      `

      vi.stubGlobal('fetch', vi.fn(async () => new Response(html, { status: 200 })))

      const result = await scrapeJobDescription('https://example.com/roles/3')

      expect(result.success).toBe(true)
      expect(result.description).toContain('Platform Engineer')
      expect(result.description.length).toBeGreaterThan(100)
    })

    it('returns extraction error when no meaningful description can be extracted', async () => {
      const html = '<html><head><title>Empty</title></head></html>'
      vi.stubGlobal('fetch', vi.fn(async () => new Response(html, { status: 200 })))

      const result = await scrapeJobDescription('https://example.com/jobs/4')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Could not extract job description')
    })

    it('handles fetch/network exceptions', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => {
        throw new Error('network down')
      }))

      const result = await scrapeJobDescription('https://example.com/jobs/5')

      expect(result.success).toBe(false)
      expect(result.description).toBe('')
      expect(result.error).toBe('network down')
    })
  })
})
