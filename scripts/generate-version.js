#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const versionFile = path.join(__dirname, '..', 'src', 'version.ts')

try {
  // Try to get git describe (tag-based version), fallback to short commit hash
  let version
  try {
    version = execSync('git describe --tags --always', { encoding: 'utf-8' }).trim()
  } catch {
    version = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  }

  // Get git branch
  let branch
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    branch = 'unknown'
  }

  // Get last commit message
  let lastCommit
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
  console.log(`✓ Generated version file: ${version}`)
} catch (error) {
  console.error('Failed to generate version:', error.message)
  // Fallback version
  const fallback = `// Fallback version (git not available)
export const APP_VERSION = 'dev'
export const GIT_BRANCH = 'unknown'
export const GIT_COMMIT = 'unknown'
`
  fs.writeFileSync(versionFile, fallback)
}
