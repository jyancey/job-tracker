#!/usr/bin/env node

/**
 * Simple static file server for Job Tracker
 * Serves the dist/ directory over HTTP on the specified port
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3100
const DIST_DIR = path.join(__dirname, 'dist')

const MIME_TYPES = {
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
  // Parse URL and handle SPA routing (fallback to index.html for routes)
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url)

  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('Forbidden')
    return
  }

  // Try to serve the file, fallback to index.html for SPA routes
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // If file not found and not index.html, try index.html (SPA routing)
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
      // Serve index.html for directory requests
      filePath = path.join(filePath, 'index.html')
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('404 Not Found')
        } else {
          res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] })
          res.end(content)
        }
      })
    } else {
      // Serve the file
      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      fs.readFile(filePath, (err, content) => {
        if (err) {
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
})

server.listen(PORT, () => {
  console.log(`Job Tracker server running at http://localhost:${PORT}`)
  console.log(`Serving files from: ${DIST_DIR}`)
  console.log('Press Ctrl+C to stop')
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`)
  } else {
    console.error('Server error:', err)
  }
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
