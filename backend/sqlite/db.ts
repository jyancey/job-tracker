import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url))

export const DEFAULT_DB_PATH = path.join(MODULE_DIR, '..', 'data', 'job-tracker.sqlite')

export type SQLiteDatabase = InstanceType<typeof Database>

export function resolveDbPath(dbPath = process.env.JOB_TRACKER_DB_PATH || DEFAULT_DB_PATH): string {
  return dbPath
}

export function ensureDatabaseDirectory(dbPath: string): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

function configureDatabase(db: SQLiteDatabase): void {
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 10000')
}

export function openDatabase(dbPath = resolveDbPath()): SQLiteDatabase {
  ensureDatabaseDirectory(dbPath)

  const db = new Database(dbPath)
  configureDatabase(db)
  return db
}

export function withDatabase<T>(
  dbPath: string | undefined,
  callback: (db: SQLiteDatabase, resolvedDbPath: string) => T,
): T {
  const resolvedDbPath = resolveDbPath(dbPath)
  const db = openDatabase(resolvedDbPath)

  try {
    return callback(db, resolvedDbPath)
  } finally {
    db.close()
  }
}
