import { URL } from 'url'
import { validateJobArray } from './jobValidation.js'

const MAX_REQUEST_BYTES = 2 * 1024 * 1024

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []

    req.on('data', (chunk) => {
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

export async function handleJobsApi(req, res, store) {
  const host = req.headers.host || 'localhost'
  const pathname = new URL(req.url || '/', `http://${host}`).pathname

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
      const body = await readJsonBody(req)
      const jobs = Array.isArray(body?.jobs) ? body.jobs : []

      // Validate job payload
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
