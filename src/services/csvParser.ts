// Exports and imports jobs to/from CSV format with quoted field escaping.
import type { Job, JobStatus, JobPriority } from '../domain'
import { JOB_PRIORITIES, JOB_STATUSES } from '../domain'

type RawCsvRow = Record<string, string>

export function exportToCsv(jobs: Job[]): string {
  if (!jobs.length) {
    return ''
  }

  const headers = [
    'Company',
    'Role Title',
    'Status',
    'Application Date',
    'Salary Range',
    'Contact Person',
    'Priority',
    'Next Action',
    'Next Action Due',
    'Score Fit',
    'Score Compensation',
    'Score Location',
    'Score Growth',
    'Score Confidence',
    'Notes',
  ]

  const rows = jobs.map((job) => [
    `"${job.company.replace(/"/g, '""')}"`,
    `"${job.roleTitle.replace(/"/g, '""')}"`,
    `"${job.status}"`,
    `"${job.applicationDate}"`,
    `"${job.salaryRange.replace(/"/g, '""')}"`,
    `"${job.contactPerson.replace(/"/g, '""')}"`,
    `"${(job.priority ?? 'Medium').replace(/"/g, '""')}"`,
    `"${job.nextAction.replace(/"/g, '""')}"`,
    `"${job.nextActionDueDate}"`,
    job.scoreFit != null ? String(job.scoreFit) : '',
    job.scoreCompensation != null ? String(job.scoreCompensation) : '',
    job.scoreLocation != null ? String(job.scoreLocation) : '',
    job.scoreGrowth != null ? String(job.scoreGrowth) : '',
    job.scoreConfidence != null ? String(job.scoreConfidence) : '',
    `"${job.notes.replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i]
    const next = csv[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && char === ',') {
      row.push(field.trim())
      field = ''
      continue
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        i += 1
      }
      row.push(field.trim())
      if (row.some((value) => value.length > 0)) {
        rows.push(row)
      }
      row = []
      field = ''
      continue
    }

    field += char
  }

  row.push(field.trim())
  if (row.some((value) => value.length > 0)) {
    rows.push(row)
  }

  return rows
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function toRowObject(headers: string[], row: string[]): RawCsvRow {
  return headers.reduce<RawCsvRow>((acc, header, index) => {
    acc[header] = row[index] ?? ''
    return acc
  }, {})
}

function pickValue(row: RawCsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }
  return ''
}

function coerceToJobStatus(value: string): JobStatus {
  const trimmed = value.trim()
  if (JOB_STATUSES.includes(trimmed as JobStatus)) {
    return trimmed as JobStatus
  }
  return 'Applied'
}

function coerceToJobPriority(value: string): JobPriority {
  const trimmed = value.trim()
  if (JOB_PRIORITIES.includes(trimmed as JobPriority)) {
    return trimmed as JobPriority
  }
  return 'Medium'
}

export function importFromCsv(csvString: string): Job[] {
  const rows = parseCsv(csvString)
  if (rows.length < 2) {
    return []
  }

  const headerNames = rows[0].map(normalizeHeader)
  const now = new Date().toISOString()
  const imported: Job[] = []

  for (const row of rows.slice(1)) {
    const raw = toRowObject(headerNames, row)
    const company = pickValue(raw, ['company'])
    const roleTitle = pickValue(raw, ['roletitle', 'role'])
    const applicationDate = pickValue(raw, ['applicationdate', 'applieddate', 'date'])
    const statusRaw = pickValue(raw, ['status']) || 'Applied'
    const status = coerceToJobStatus(statusRaw)
    const priorityRaw = pickValue(raw, ['priority']) || 'Medium'
    const priority = coerceToJobPriority(priorityRaw)

    if (!company || !roleTitle || !applicationDate) {
      continue
    }

    imported.push({
      id: pickValue(raw, ['id']) || crypto.randomUUID(),
      company,
      roleTitle,
      applicationDate,
      status,
      jobUrl: pickValue(raw, ['joburl']),
      atsUrl: pickValue(raw, ['atsurl']),
      salaryRange: pickValue(raw, ['salaryrange']),
      notes: pickValue(raw, ['notes']),
      contactPerson: pickValue(raw, ['contactperson', 'contact']),
      priority,
      nextAction: pickValue(raw, ['nextaction']),
      nextActionDueDate: pickValue(raw, ['nextactiondue', 'nextactionduedate']),
      createdAt: pickValue(raw, ['createdat']) || now,
      updatedAt: pickValue(raw, ['updatedat']) || now,
    })
  }

  return imported
}
