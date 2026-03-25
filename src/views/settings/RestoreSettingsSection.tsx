import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Job } from '../../domain'
import { downloadJsonFile } from '../../utils/downloadUtils'
import {
  applyRestore,
  backupFilename,
  calculateRestoreDiff,
  calculateRestoreImpact,
  createBackupSnapshot,
  parseBackup,
  RestoreDiffPreview,
  type RestoreDiff,
  type RestoreImpact,
  type RestoreMode,
} from '../../features/backup'

interface RestoreSettingsSectionProps {
  jobs: Job[]
  setJobs: (updater: (jobs: Job[]) => Job[]) => void
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function RestoreSettingsSection({ jobs, setJobs, addNotification }: RestoreSettingsSectionProps) {
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('upsert')
  const [restoreMessage, setRestoreMessage] = useState('')
  const [restoreImpact, setRestoreImpact] = useState<RestoreImpact | null>(null)
  const [pendingRestoreJobs, setPendingRestoreJobs] = useState<Job[] | null>(null)
  const [showDiffPreview, setShowDiffPreview] = useState(false)
  const [restoreDiff, setRestoreDiff] = useState<RestoreDiff | null>(null)
  const restoreFileRef = useRef<HTMLInputElement>(null)

  const handleBackupDownload = () => {
    const snapshot = createBackupSnapshot(jobs)
    downloadJsonFile(snapshot, backupFilename())
    addNotification(`Backup created for ${jobs.length} jobs`, 'success')
  }

  const handleRestoreFilePick = () => {
    restoreFileRef.current?.click()
  }

  const handleRestoreFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = (e.target?.result as string) || ''
      const parsed = parseBackup(content)
      if (!parsed) {
        setPendingRestoreJobs(null)
        setRestoreImpact(null)
        setRestoreDiff(null)
        setRestoreMessage('Invalid backup file. Expected Job Tracker backup JSON.')
        addNotification('Invalid backup file', 'error')
        return
      }

      const impact = calculateRestoreImpact(jobs, parsed.jobs, restoreMode)
      const diff = calculateRestoreDiff(jobs, parsed.jobs, restoreMode)
      setPendingRestoreJobs(parsed.jobs)
      setRestoreImpact(impact)
      setRestoreDiff(diff)
      setShowDiffPreview(true)
      setRestoreMessage(`Loaded backup with ${parsed.jobs.length} jobs from ${new Date(parsed.createdAt).toLocaleString()}`)
    }

    reader.readAsText(file)
    event.target.value = ''
  }

  const handleApplyRestore = () => {
    if (!pendingRestoreJobs) {
      return
    }

    setJobs((current) => applyRestore(current, pendingRestoreJobs, restoreMode))
    addNotification('Backup restore applied successfully', 'success')
    setRestoreMessage('Restore applied. Your job list was updated.')
    setPendingRestoreJobs(null)
    setRestoreImpact(null)
    setRestoreDiff(null)
    setShowDiffPreview(false)
  }

  const handleRestoreModeChange = (mode: RestoreMode) => {
    setRestoreMode(mode)
    if (pendingRestoreJobs) {
      setRestoreImpact(calculateRestoreImpact(jobs, pendingRestoreJobs, mode))
      setRestoreDiff(calculateRestoreDiff(jobs, pendingRestoreJobs, mode))
    }
  }

  const handleDiffPreviewConfirm = () => {
    handleApplyRestore()
  }

  const handleDiffPreviewCancel = () => {
    setShowDiffPreview(false)
  }

  return (
    <>
      <div className="settings-section">
        <h2>Manual Backup and Restore</h2>

        <input
          ref={restoreFileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleRestoreFileChange}
        />

        <div className="settings-actions-row">
          <button type="button" className="button-secondary" onClick={handleBackupDownload}>
            Download Backup Snapshot
          </button>
          <button type="button" className="button-secondary" onClick={handleRestoreFilePick}>
            Choose Restore File
          </button>
        </div>

        <label className="full-width settings-spaced-top">
          Restore Mode
          <select value={restoreMode} onChange={(e) => handleRestoreModeChange(e.target.value as RestoreMode)}>
            <option value="upsert">Upsert (update matching IDs, insert new)</option>
            <option value="append">Append (add all incoming)</option>
            <option value="replace">Replace (overwrite all current jobs)</option>
          </select>
        </label>

        {restoreImpact && (
          <div className="settings-message" aria-label="restore impact preview">
            Preview: +{restoreImpact.inserted} inserted, {restoreImpact.updated} updated, -{restoreImpact.removed}
            removed. Final total: {restoreImpact.finalCount} jobs.
          </div>
        )}

        {restoreMode === 'replace' && restoreImpact && restoreImpact.removed > 0 && (
          <div className="error-message-inline">
            Replace mode will remove {restoreImpact.removed} current jobs not present in backup.
          </div>
        )}

        <div className="settings-actions-row settings-spaced-top">
          <button type="button" className="button-primary" onClick={handleApplyRestore} disabled={!pendingRestoreJobs}>
            Apply Restore
          </button>
        </div>

        {restoreMessage && <small className="settings-message">{restoreMessage}</small>}
      </div>

      {showDiffPreview && restoreDiff && (
        <div className="modal-overlay" onClick={handleDiffPreviewCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <RestoreDiffPreview
              diff={restoreDiff}
              onConfirm={handleDiffPreviewConfirm}
              onCancel={handleDiffPreviewCancel}
            />
          </div>
        </div>
      )}
    </>
  )
}
