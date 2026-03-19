// Public API barrel re-exporting backup, scheduler, and restore diff functionality.
export {
  applyRestore,
  backupFilename,
  calculateRestoreImpact,
  createBackupSnapshot,
  parseBackup,
  serializeBackup,
  type BackupSnapshot,
  type RestoreImpact,
  type RestoreMode,
} from './backupService'

export {
  checkAndCreateAutoBackup,
  createAutoBackup,
  deleteStoredBackup,
  downloadBackup,
  formatBackupInterval,
  getNextBackupTime,
  getStoredBackup,
  loadBackupConfig,
  loadBackupState,
  saveBackupConfig,
  saveBackupState,
  shouldCreateBackup,
  type AutoBackupState,
  type BackupConfig,
  type BackupInterval,
  type BackupMetadata,
} from './backupScheduler'

export {
  calculateRestoreDiff,
  formatFieldName,
  formatFieldValue,
  type ChangeType,
  type FieldChange,
  type JobDiff,
  type RestoreDiff,
} from './restoreDiff'

export { RestoreDiffPreview, type RestoreDiffPreviewProps } from './RestoreDiffPreview'
