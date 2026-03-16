#!/usr/bin/env node

/**
 * Static + API server for Job Tracker.
 * Serves dist/ and persists jobs in a SQLite database.
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJobStore } from './backend/sqliteStore'
import { handleJobsApi } from './backend/jobsApi'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3100
const DIST_DIR = path.join(__dirname, 'dist')
const jobStore = createJobStore()

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
}

const server = http.createServer((req, res) => {
  void (async () => {
    const handled = await handleJobsApi(req, res, jobStore)
    if (handled) {
      return
    }

    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url || '')

    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('Forbidden')
      return
    }

    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT' && req.url !== '/') {
          filePath = path.join(DIST_DIR, 'index.html')
          fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
              res.writeHead(404, { 'Content-Type': 'text/plain' })
              res.end('404 Not Found')
            } else {
              res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] })
              res.end(content)
            }
          })
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('404 Not Found')
        }
        return
      }

      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html')
        fs.readFile(filePath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('404 Not Found')
          } else {
            res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] })
            res.end(content)
          }
        })
      } else {
        const ext = path.extname(filePath).toLowerCase()
        const contentType = MIME_TYPES[ext] || 'application/octet-stream'

        fs.readFile(filePath, (readErr, content) => {
          if (readErr) {
            res.writeHead(500, { 'Content-Type': 'text/plain' })
            res.end('Internal Server Error')
          } else {
            res.writeHead(200, {
              'Content-Type': contentType,
              'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
            })
            res.end(content)
          }
        })
      }
    })
  })().catch((error) => {
    console.error('Request handling error:', error)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal Server Error')
    }
  })
})

server.listen(PORT, () => {
  console.warn(`Job Tracker server running at http://localhost:${PORT}`)
  console.warn(`Serving files from: ${DIST_DIR}`)
  console.warn(`SQLite DB path: ${jobStore.dbPath}`)
  console.warn('Press Ctrl+C to stop')
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`)
  } else {
    console.error('Server error:', err)
  }
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.warn('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    jobStore.close()
    console.warn('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  jobStore.close()
  process.exit(0)
})
