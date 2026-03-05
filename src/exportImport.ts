import type { Job, JobStatus } from './domain'
import { JOB_STATUSES } from './domain'

export type ImportMode = 'append' | 'upsert' | 'replace'

export interface ImportMergeResult {
  jobs: Job[]
  inserted: number
  updated: number
}

type RawCsvRow = Record<string, string>

export function exportToJson(jobs: Job[]): string {
  return JSON.stringify(jobs, null, 2)
}

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
    'Next Action',
    'Next Action Due',
    'Notes',
  ]

  const rows = jobs.map((job) => [
    `"${job.company.replace(/"/g, '""')}"`,
    `"${job.roleTitle.replace(/"/g, '""')}"`,
    `"${job.status}"`,
    `"${job.applicationDate}"`,
    `"${job.salaryRange.replace(/"/g, '""')}"`,
    `"${job.contactPerson.replace(/"/g, '""')}"`,
    `"${job.nextAction.replace(/"/g, '""')}"`,
    `"${job.nextActionDueDate}"`,
    `"${job.notes.replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

export function importFromJson(jsonString: string): Job[] {
  try {
    const parsed = JSON.parse(jsonString)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item): item is Job =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.company === 'string' &&
        typeof item.roleTitle === 'string' &&
        typeof item.applicationDate === 'string' &&
        typeof item.status === 'string',
    )
  } catch {
    return []
  }
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
      nextAction: pickValue(raw, ['nextaction']),
      nextActionDueDate: pickValue(raw, ['nextactiondue', 'nextactionduedate']),
      createdAt: pickValue(raw, ['createdat']) || now,
      updatedAt: pickValue(raw, ['updatedat']) || now,
    })
  }

  return imported
}

export function importJobsFromFile(content: string, filename: string): Job[] {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.csv')) {
    return importFromCsv(content)
  }

  return importFromJson(content)
}

export function mergeImportedJobs(existing: Job[], imported: Job[], mode: ImportMode): ImportMergeResult {
  if (mode === 'replace') {
    return {
      jobs: [...imported],
      inserted: imported.length,
      updated: 0,
    }
  }

  if (mode === 'append') {
    return {
      jobs: [...existing, ...imported],
      inserted: imported.length,
      updated: 0,
    }
  }

  const merged = new Map(existing.map((job) => [job.id, job]))
  let inserted = 0
  let updated = 0

  for (const importedJob of imported) {
    if (merged.has(importedJob.id)) {
      updated += 1
    } else {
      inserted += 1
    }
    merged.set(importedJob.id, importedJob)
  }

  return {
    jobs: [...merged.values()],
    inserted,
    updated,
  }
}
