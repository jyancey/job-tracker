import type { IncomingMessage, ServerResponse } from 'http'
import type { JobStore } from './sqliteStore.js'

export function handleJobsApi(
  req: IncomingMessage,
  res: ServerResponse,
  store: JobStore,
): Promise<boolean>
