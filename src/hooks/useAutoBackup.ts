import { useEffect, useRef } from 'react'
import type { Job } from '../domain'
import { checkAndCreateAutoBackup, loadBackupState } from '../features/backup'

/**
 * Hook that automatically checks and creates backups based on configured interval.
 * Runs when jobs change and checks if enough time has passed since last backup.
 */
export function useAutoBackup(jobs: Job[], enabled: boolean = true): void {
  const lastCheckRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || jobs.length === 0) {
      return
    }

    // Load current state to check interval
    const state = loadBackupState()
    
    // Skip if backups are disabled
    if (state.config.interval === 'disabled') {
      return
    }

    // Only check once per app session for the same lastBackupAt value
    // This prevents excessive checks while still catching new backup windows
    if (lastCheckRef.current === state.lastBackupAt) {
      return
    }

    lastCheckRef.current = state.lastBackupAt

    // Check and create backup if needed
    const result = checkAndCreateAutoBackup(jobs)
    
    if (result) {
      console.log(`Auto-backup created: ${result.backupHistory[0]?.filename}`)
    }
  }, [jobs, enabled])
}
