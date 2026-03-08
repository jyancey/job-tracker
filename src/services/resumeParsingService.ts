/**
 * Resume Parsing Service - Extract structured data from resume text/PDF
 */

export interface ParsedResume {
  name?: string
  email?: string
  phone?: string
  currentRole?: string
  yearsExperience?: number
  skills: string[]
  workHistory: Array<{
    title: string
    company: string
    years?: string
  }>
  education: Array<{
    degree: string
    school: string
    year?: string
  }>
  rawText: string
}

/**
 * Parse resume from text content
 */
export function parseResumeText(text: string): ParsedResume {
  const result: ParsedResume = {
    skills: [],
    workHistory: [],
    education: [],
    rawText: text,
  }

  // Extract email
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  if (emailMatch) {
    result.email = emailMatch[0]
  }

  // Extract phone
  const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phoneMatch) {
    result.phone = phoneMatch[0]
  }

  // Extract name (usually first line or first few words before email)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length > 0) {
    const firstLine = lines[0]
    if (firstLine.length < 50 && !firstLine.includes('@')) {
      result.name = firstLine
    }
  }

  // Extract skills (look for common skill keywords)
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust',
    'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring',
    'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'Git', 'CI/CD', 'Agile', 'Scrum',
    'Machine Learning', 'AI', 'Data Science', 'Analytics',
  ]
  
  const foundSkills = new Set<string>()
  const lowerText = text.toLowerCase()
  
  for (const skill of skillKeywords) {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill)
    }
  }
  
  result.skills = Array.from(foundSkills)

  // Estimate years of experience (look for graduation year or earliest job)
  const years = text.match(/\b(19|20)\d{2}\b/g)
  if (years && years.length > 0) {
    const earliestYear = Math.min(...years.map(y => parseInt(y)))
    const currentYear = new Date().getFullYear()
    if (earliestYear > 1990 && earliestYear < currentYear) {
      result.yearsExperience = currentYear - earliestYear
    }
  }

  return result
}

/**
 * Parse resume from uploaded file
 */
export async function parseResumeFile(file: File): Promise<ParsedResume> {
  let text: string

  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    try {
      // Guard against indefinite waits in PDF parsing by enforcing a timeout.
      text = await withTimeout(extractTextFromPDF(file), 20000, 'PDF parsing timed out')
    } catch (err) {
      throw new Error(
        `Failed to parse PDF: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  } else {
    // Handle text files
    text = await file.text()
  }

  return parseResumeText(text)
}

/**
 * Extract text content from a PDF file
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    return await extractTextWithModernPdfJs(file)
  } catch (err) {
    if (isPdfRuntimeCompatibilityError(err)) {
      try {
        return await extractTextWithLegacyPdfJs(file)
      } catch (legacyErr) {
        throw new Error(
          `Failed to extract text from PDF: ${legacyErr instanceof Error ? legacyErr.message : 'Unknown error'}`,
        )
      }
    }

    throw new Error(
      `Failed to extract text from PDF: ${err instanceof Error ? err.message : 'Unknown error'}`,
    )
  }
}

async function extractTextWithModernPdfJs(file: File): Promise<string> {
  const [pdfjsModule, workerSrcModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])

  const pdfjsLib = resolvePdfJsModule(pdfjsModule)
  const workerSrc = typeof workerSrcModule.default === 'string'
    ? workerSrcModule.default
    : String(workerSrcModule)

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  return extractTextFromDocument(pdf)
}

async function extractTextWithLegacyPdfJs(file: File): Promise<string> {
  const [pdfjsLegacyModule, legacyWorkerSrcModule] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ])

  const pdfjsLegacy = resolvePdfJsModule(pdfjsLegacyModule)
  const workerSrc = typeof legacyWorkerSrcModule.default === 'string'
    ? legacyWorkerSrcModule.default
    : String(legacyWorkerSrcModule)

  pdfjsLegacy.GlobalWorkerOptions.workerSrc = workerSrc
  const arrayBuffer = await file.arrayBuffer()

  // Legacy parser path avoids newer stream features that can be unavailable in some runtimes.
  const pdf = await pdfjsLegacy.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableWorker: true,
  } as any).promise

  return extractTextFromDocument(pdf)
}

async function extractTextFromDocument(pdf: { numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: unknown[] }> }> }): Promise<string> {
  let fullText = ''

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')

    fullText += pageText + '\n'
  }

  return fullText
}

function isPdfRuntimeCompatibilityError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('readablestream') ||
    message.includes('worker') ||
    message.includes('globalworkeroptions.workersrc') ||
    message.includes('undefined is not a function')
  )
}

function resolvePdfJsModule(moduleValue: any): any {
  if (moduleValue && typeof moduleValue === 'object' && 'getDocument' in moduleValue) {
    return moduleValue
  }

  if (moduleValue?.default && typeof moduleValue.default === 'object' && 'getDocument' in moduleValue.default) {
    return moduleValue.default
  }

  return moduleValue
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)

    promise
      .then((value) => {
        globalThis.clearTimeout(timeoutId)
        resolve(value)
      })
      .catch((error) => {
        globalThis.clearTimeout(timeoutId)
        reject(error)
      })
  })
}

/**
 * Convert parsed resume to user profile format
 */
export function resumeToProfile(parsed: ParsedResume) {
  return {
    name: parsed.name,
    currentRole: parsed.currentRole || parsed.workHistory[0]?.title,
    yearsExperience: parsed.yearsExperience,
    skills: parsed.skills,
    resumeText: parsed.rawText,
  }
}
