// Lazy-loaded proxy for the job store that defers SQLite initialization until first use.
import { createJobStore } from './sqliteStore'
import type { JobStore } from './sqliteStore'

const globalForStore = globalThis as unknown as {
  __jobStore?: JobStore
}

function getStore(): JobStore {
  if (!globalForStore.__jobStore) {
    globalForStore.__jobStore = createJobStore()
  }
  return globalForStore.__jobStore
}

// Lazy proxy: the database is not opened until the first method call.
// This prevents SQLite from being initialised at import time (e.g. during
// `next build`, which imports all route modules in parallel across workers).
export const jobStore: JobStore = new Proxy({} as JobStore, {
  get(_target, prop: string) {
    const store = getStore()
    const value = store[prop as keyof JobStore]
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(store)
      : value
  },
})
