import {
  formatBackupInterval,
  getNextBackupTime,
  loadBackupState,
  type BackupConfig,
  type BackupInterval,
} from '../../features/backup'

interface BackupScheduleSectionProps {
  backupConfig: BackupConfig
  onChange: (backupConfig: BackupConfig) => void
}

export function BackupScheduleSection({ backupConfig, onChange }: BackupScheduleSectionProps) {
  const backupState = backupConfig.interval === 'disabled' ? null : loadBackupState()
  const nextBackup = backupState ? getNextBackupTime(backupState.lastBackupAt, backupConfig.interval) : null

  return (
    <div className="settings-section">
      <h2>Automatic Backups</h2>

      <label className="full-width">
        Backup Interval
        <select
          value={backupConfig.interval}
          onChange={(e) => onChange({ ...backupConfig, interval: e.target.value as BackupInterval })}
        >
          <option value="disabled">Disabled</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <small>
          Automatic backups will be created when you save jobs and enough time has passed since the last backup.
        </small>
      </label>

      <label className="full-width">
        Keep Last N Backups
        <input
          type="number"
          min="1"
          max="30"
          value={backupConfig.keepLastN}
          onChange={(e) => onChange({ ...backupConfig, keepLastN: Math.max(1, parseInt(e.target.value) || 7) })}
        />
        <small>Older automatic backups will be deleted to save space.</small>
      </label>

      {backupState && (
        <div className="settings-message">
          <strong>Current Status:</strong> {formatBackupInterval(backupConfig.interval)} backups enabled.
          {backupState.lastBackupAt ? (
            <>
              {' '}
              Last backup: {new Date(backupState.lastBackupAt).toLocaleString()}.
              {nextBackup && ` Next backup: ${nextBackup.toLocaleString()}.`}
            </>
          ) : (
            ' No backups created yet.'
          )}
        </div>
      )}
    </div>
  )
}
