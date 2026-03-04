import type { Job } from './domain'

export type ImportMode = 'append' | 'upsert' | 'replace'

export interface ImportMergeResult {
  jobs: Job[]
  inserted: number
  updated: number
}

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

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
