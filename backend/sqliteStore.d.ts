export interface JobStore {
  dbPath: string
  listJobs: () => unknown[]
  replaceAllJobs: (jobs: unknown[]) => void
  close: () => void
}

export function createJobStore(dbPath?: string): JobStore
