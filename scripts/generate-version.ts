#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const versionFile = path.join(__dirname, '..', 'src', 'version.ts')

try {
  let version: string
  try {
    version = execSync('git describe --tags --always', { encoding: 'utf-8' }).trim()
  } catch {
    version = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  }

  let branch: string
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    branch = 'unknown'
  }

  let lastCommit: string
  try {
    lastCommit = execSync('git log -1 --pretty=%s', { encoding: 'utf-8' }).trim()
  } catch {
    lastCommit = 'unknown'
  }

  const content = `// This file is auto-generated during build. Do not edit manually.
export const APP_VERSION = '${version}'
export const GIT_BRANCH = '${branch}'
export const GIT_COMMIT = '${lastCommit}'
`

  fs.writeFileSync(versionFile, content)
  console.warn(`Generated version file: ${version}`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Failed to generate version:', message)
  const fallback = `// Fallback version (git not available)
export const APP_VERSION = 'dev'
export const GIT_BRANCH = 'unknown'
export const GIT_COMMIT = 'unknown'
`
  fs.writeFileSync(versionFile, fallback)
}
