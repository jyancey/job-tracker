/**
 * Job Scraping Service - Fetches and extracts job descriptions from URLs
 */

export interface ScrapedJob {
  description: string
  title?: string
  company?: string
  location?: string
  salary?: string
  success: boolean
  error?: string
}

/**
 * Attempt to fetch and extract job description from a URL
 * This is a basic implementation - production would use a proper scraping service
 */
export async function scrapeJobDescription(url: string): Promise<ScrapedJob> {
  try {
    // Validate URL
    new URL(url)
    
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return {
        description:

 '',
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const html = await response.text()
    
    // Basic extraction - look for common job description patterns
    const extracted = extractJobDetails(html)
    
    if (!extracted.description) {
      return {
        description: '',
        success: false,
        error: 'Could not extract job description from page. Try pasting the description manually.',
      }
    }

    return {
      ...extracted,
      success: true,
    }
  } catch (error) {
    return {
      description: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch URL',
    }
  }
}

function extractJobDetails(html: string): Omit<ScrapedJob, 'success' | 'error'> {
  // Remove script and style tags
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  
  // Try to find job description in common containers
  const descPatterns = [
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is,
    /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>(.*?)<\/div>/is,
    /<section[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/section>/is,
    /<article[^>]*>(.*?)<\/article>/is,
  ]

  let description = ''
  for (const pattern of descPatterns) {
    const match = cleaned.match(pattern)
    if (match && match[1]) {
      description = cleanHtml(match[1])
      if (description.length > 100) break // If we got substantial content, use it
    }
  }

  // Fallback: extract all text from body
  if (!description || description.length < 100) {
    const bodyMatch = cleaned.match(/<body[^>]*>(.*?)<\/body>/is)
    if (bodyMatch) {
      description = cleanHtml(bodyMatch[1])
    }
  }

  // Try to extract title
  const titleMatch = cleaned.match(/<title[^>]*>(.*?)<\/title>/i)
  const title = titleMatch ? cleanHtml(titleMatch[1]) : undefined

  // Try to extract structured data
  const jsonLdMatch = cleaned.match(/<script type="application\/ld\+json">(.*?)<\/script>/is)
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1])
      if (data['@type'] === 'JobPosting') {
        return {
          description: data.description || description,
          title: data.title || title,
          company: data.hiringOrganization?.name,
          location: data.jobLocation?.address?.addressLocality,
          salary: data.baseSalary?.value || data.baseSalary?.minValue,
        }
      }
    } catch {
      // Ignore JSON parsing errors
    }
  }

  return {
    description,
    title,
  }
}

function cleanHtml(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]+>/g, ' ')
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()
  
  return text
}

/**
 * Check if URL is likely a job posting
 */
export function isJobUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    const path = parsed.pathname.toLowerCase()
    
    // Common job board patterns
    const jobSites = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com']
    if (jobSites.some(site => hostname.includes(site))) {
      return true
    }
    
    // Check for job-related paths
    if (path.includes('/job') || path.includes('/career') || path.includes('/opening')) {
      return true
    }
    
    return false
  } catch {
    return false
  }
}
