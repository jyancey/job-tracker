// Standalone Node.js HTTP server API handler for managing jobs (legacy server implementation).
import { URL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { validateJobArray } from './jobValidation'
import type { JobStore } from './sqliteStore'

const MAX_REQUEST_BYTES = 2 * 1024 * 1024

interface JobsRequestBody {
  jobs?: unknown[]
}

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_REQUEST_BYTES) {
        reject(new Error('Payload too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf-8')
        resolve(text ? JSON.parse(text) : null)
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })

    req.on('error', reject)
  })
}

export async function handleJobsApi(
  req: IncomingMessage,
  res: ServerResponse,
  store: JobStore,
): Promise<boolean> {
  const host = req.headers.host || 'localhost'
  const pathname = new URL(req.url || '/', `http://${host}`).pathname

  if (pathname === '/api/database/info' && req.method === 'GET') {
    if (typeof store.getDatabaseInfo !== 'function') {
      writeJson(res, 501, { error: 'Database info operation not supported' })
      return true
    }

    try {
      writeJson(res, 200, store.getDatabaseInfo())
    } catch (error) {
      writeJson(res, 500, {
        error: error instanceof Error ? error.message : 'Failed to fetch database info',
      })
    }
    return true
  }

  if (pathname === '/api/database/create' && req.method === 'POST') {
    if (typeof store.createDatabase !== 'function') {
      writeJson(res, 501, { error: 'Database create operation not supported' })
      return true
    }

    try {
      writeJson(res, 200, store.createDatabase())
    } catch (error) {
      writeJson(res, 500, {
        error: error instanceof Error ? error.message : 'Failed to create database',
      })
    }
    return true
  }

  if (pathname === '/api/database/test' && req.method === 'GET') {
    if (typeof store.testConnection !== 'function') {
      writeJson(res, 501, { error: 'Database test operation not supported' })
      return true
    }

    try {
      writeJson(res, 200, store.testConnection())
    } catch (error) {
      writeJson(res, 500, {
        error: error instanceof Error ? error.message : 'Failed to test database connection',
      })
    }
    return true
  }

  if (pathname !== '/api/jobs') {
    return false
  }

  if (req.method === 'GET') {
    writeJson(res, 200, {
      jobs: store.listJobs(),
    })
    return true
  }

  if (req.method === 'PUT') {
    try {
      const body = (await readJsonBody(req)) as JobsRequestBody | null
      const jobs = Array.isArray(body?.jobs) ? body.jobs : []

      const validation = validateJobArray(jobs)
      if (!validation.valid) {
        writeJson(res, 422, {
          error: validation.error,
        })
        return true
      }

      store.replaceAllJobs(jobs)
      writeJson(res, 200, { ok: true, count: jobs.length })
    } catch (error) {
      writeJson(res, 400, {
        error: error instanceof Error ? error.message : 'Failed to update jobs',
      })
    }
    return true
  }

  writeJson(res, 405, { error: 'Method not allowed' })
  return true
}
