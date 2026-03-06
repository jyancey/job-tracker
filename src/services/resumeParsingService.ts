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

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try {
      text = await extractTextFromPDF(file)
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
    // Dynamically import pdfjs-dist only when needed (browser environment)
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set up the worker for PDF parsing
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ''

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Extract text items and join them with spaces
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
      
      fullText += pageText + '\n'
    }

    return fullText
  } catch (err) {
    throw new Error(
      `Failed to extract text from PDF: ${err instanceof Error ? err.message : 'Unknown error'}`,
    )
  }
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
