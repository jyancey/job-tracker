import { createJobStore } from '../backend/sqliteStore'

const globalForStore = globalThis as unknown as {
  __jobStore?: ReturnType<typeof createJobStore>
}

export const jobStore = globalForStore.__jobStore ?? createJobStore()

if (process.env.NODE_ENV !== 'production') {
  globalForStore.__jobStore = jobStore
}
