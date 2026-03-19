// Exports jobs to JSON and imports with type validation and default priority handling.
import type { Job } from '../domain'

export function exportToJson(jobs: Job[]): string {
  return JSON.stringify(jobs, null, 2)
}

export function importFromJson(jsonString: string): Job[] {
  try {
    const parsed = JSON.parse(jsonString)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(
        (item): item is Job =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          typeof item.company === 'string' &&
          typeof item.roleTitle === 'string' &&
          typeof item.applicationDate === 'string' &&
          typeof item.status === 'string',
      )
      .map((item) => ({
        ...item,
        priority: item.priority ?? 'Medium',
      }))
  } catch {
    return []
  }
}
