// Settings hub for AI configuration, database setup, backup scheduling, and restore operations.
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Job } from '../domain'
import { downloadJsonFile } from '../utils/downloadUtils'
import type { AIConfig } from '../types/ai'
import { loadAIConfig, saveAIConfig } from '../storage/aiStorage'
import {
  applyRestore,
  backupFilename,
  calculateRestoreImpact,
  calculateRestoreDiff,
  createBackupSnapshot,
  formatBackupInterval,
  getNextBackupTime,
  loadBackupConfig,
  loadBackupState,
  parseBackup,
  RestoreDiffPreview,
  saveBackupConfig,
  type BackupConfig,
  type BackupInterval,
  type RestoreDiff,
  type RestoreImpact,
  type RestoreMode,
} from '../features/backup'
import {
  createDatabase,
  fetchDatabaseInfo,
  testAIEndpoint,
  testDatabaseConnection,
  type DatabaseInfo,
} from '../services/settingsService'

interface SettingsViewProps {
  onClose: () => void
  jobs: Job[]
  setJobs: (updater: (jobs: Job[]) => Job[]) => void
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

const DB_HEALTH_KEY = 'job-tracker-settings-db-last-success'
const AI_HEALTH_KEY = 'job-tracker-settings-ai-last-success'

function formatHealthTimestamp(value: string | null): string {
  if (!value) {
    return 'Not tested yet'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Not tested yet' : parsed.toLocaleString()
}

export function SettingsView({ onClose, jobs, setJobs, addNotification }: SettingsViewProps) {
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => loadAIConfig())
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(() => loadBackupConfig())
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [databaseMessage, setDatabaseMessage] = useState('')
  const [aiTestMessage, setAiTestMessage] = useState('')
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [testingDatabase, setTestingDatabase] = useState(false)
  const [testingAI, setTestingAI] = useState(false)
  const [creatingDatabase, setCreatingDatabase] = useState(false)
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('upsert')
  const [restoreMessage, setRestoreMessage] = useState('')
  const [restoreImpact, setRestoreImpact] = useState<RestoreImpact | null>(null)
  const [pendingRestoreJobs, setPendingRestoreJobs] = useState<Job[] | null>(null)
  const [showDiffPreview, setShowDiffPreview] = useState(false)
  const [restoreDiff, setRestoreDiff] = useState<RestoreDiff | null>(null)
  const restoreFileRef = useRef<HTMLInputElement>(null)
  const [dbLastSuccess, setDbLastSuccess] = useState<string | null>(() => localStorage.getItem(DB_HEALTH_KEY))
  const [aiLastSuccess, setAiLastSuccess] = useState<string | null>(() => localStorage.getItem(AI_HEALTH_KEY))

  useEffect(() => {
    setLoadingInfo(true)
    fetchDatabaseInfo()
      .then((info) => {
        setDatabaseInfo(info)
      })
      .catch((err) => {
        setDatabaseMessage(err instanceof Error ? err.message : 'Failed to load database info')
      })
      .finally(() => {
        setLoadingInfo(false)
      })
  }, [])

  const handleAIFieldChange = <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    setAiConfig((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
    setError('')
  }

  const handleSaveSettings = () => {
    try {
      saveAIConfig(aiConfig)
      saveBackupConfig(backupConfig)
      setSaved(true)
      setError('')
      addNotification('Settings saved successfully', 'success')
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    }
  }

  const handleCreateDatabase = async () => {
    setCreatingDatabase(true)
    setDatabaseMessage('')

    try {
      const result = await createDatabase()
      setDatabaseInfo((current) => ({
        provider: current?.provider || 'sqlite',
        dbPath: result.dbPath,
        exists: result.exists,
      }))
      setDatabaseMessage(result.created ? 'Database file created successfully.' : 'Database already exists and is ready.')
    } catch (err) {
      setDatabaseMessage(err instanceof Error ? err.message : 'Failed to create database')
    } finally {
      setCreatingDatabase(false)
    }
  }

  const handleTestDatabaseConnection = async () => {
    setTestingDatabase(true)
    setDatabaseMessage('')

    try {
      const result = await testDatabaseConnection()
      if (result.ok) {
        setDatabaseMessage('Database connection successful.')
        const now = new Date().toISOString()
        setDbLastSuccess(now)
        localStorage.setItem(DB_HEALTH_KEY, now)
      } else {
        setDatabaseMessage('Database connection returned an unexpected response.')
      }
    } catch (err) {
      setDatabaseMessage(err instanceof Error ? err.message : 'Failed to test database connection')
    } finally {
      setTestingDatabase(false)
    }
  }

  const handleTestAIConnection = async () => {
    setTestingAI(true)
    setAiTestMessage('')

    try {
      const result = await testAIEndpoint(aiConfig)
      if (result.ok) {
        setAiTestMessage(`${result.message} (${result.latencyMs} ms)`)
        const now = new Date().toISOString()
        setAiLastSuccess(now)
        localStorage.setItem(AI_HEALTH_KEY, now)
      } else {
        setAiTestMessage(`Connection failed: ${result.message}`)
      }
    } catch (err) {
      setAiTestMessage(err instanceof Error ? err.message : 'Failed to test AI endpoint')
    } finally {
      setTestingAI(false)
    }
  }

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
    <div className="profile-view-container">
      <header className="profile-view-header">
        <h1>Settings</h1>
        <button className="close-button" onClick={onClose} title="Close">
          ✕
        </button>
      </header>

      <div className="profile-content">
        <div className="ai-tab">
          <div className="settings-section">
            <h2>Database Settings</h2>

            <label className="full-width">
              Database Provider
              <input type="text" value="SQLite" readOnly />
            </label>

            <label className="full-width">
              API Endpoint
              <input type="text" value="/api/jobs" readOnly />
            </label>

            <label className="full-width">
              Database File Path
              <input
                type="text"
                value={databaseInfo?.dbPath || (loadingInfo ? 'Loading...' : 'Unavailable')}
                readOnly
              />
            </label>

            <div className="settings-actions-row">
              <button
                type="button"
                className="button-secondary"
                onClick={handleCreateDatabase}
                disabled={creatingDatabase}
              >
                {creatingDatabase ? 'Creating...' : 'Create Database'}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={handleTestDatabaseConnection}
                disabled={testingDatabase}
              >
                {testingDatabase ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            <div className="health-badge-row">
              <span className="health-badge" aria-label="database health status">
                DB Last Success: {formatHealthTimestamp(dbLastSuccess)}
              </span>
            </div>

            {databaseMessage && <small className="settings-message">{databaseMessage}</small>}
          </div>

          <div className="settings-section">
            <h2>AI Provider</h2>

            <fieldset className="provider-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="provider"
                  value="disabled"
                  checked={aiConfig.provider === 'disabled'}
                  onChange={() => handleAIFieldChange('provider', 'disabled')}
                />
                <span className="radio-text">
                  <strong>Disabled</strong>
                  <small>No AI scoring</small>
                </span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={aiConfig.provider === 'openai'}
                  onChange={() => handleAIFieldChange('provider', 'openai')}
                />
                <span className="radio-text">
                  <strong>OpenAI</strong>
                  <small>Cloud-based GPT models</small>
                </span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="provider"
                  value="lmstudio"
                  checked={aiConfig.provider === 'lmstudio'}
                  onChange={() => handleAIFieldChange('provider', 'lmstudio')}
                />
                <span className="radio-text">
                  <strong>LM Studio</strong>
                  <small>Local LLM (privacy-first)</small>
                </span>
              </label>
            </fieldset>
          </div>

          {aiConfig.provider === 'openai' && (
            <div className="settings-section">
              <h2>OpenAI Configuration</h2>

              <label className="full-width">
                API Key
                <div className="input-with-toggle">
                  <input
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={(e) => handleAIFieldChange('apiKey', e.target.value)}
                    placeholder="sk-..."
                    required
                  />
                </div>
                <small>Get your API key from https://platform.openai.com/api-keys</small>
              </label>

              <label className="full-width">
                Model
                <input
                  type="text"
                  value={aiConfig.model || ''}
                  onChange={(e) => handleAIFieldChange('model', e.target.value)}
                  placeholder="gpt-4o-mini (default)"
                />
                <small>Recommended: gpt-4o-mini for cost-effectiveness</small>
              </label>
            </div>
          )}

          {aiConfig.provider === 'lmstudio' && (
            <div className="settings-section">
              <h2>LM Studio Configuration</h2>

              <label className="full-width">
                Base URL
                <input
                  type="url"
                  value={aiConfig.baseUrl || ''}
                  onChange={(e) => handleAIFieldChange('baseUrl', e.target.value)}
                  placeholder="http://localhost:1234"
                  required
                />
                <small>LM Studio API endpoint (default: http://localhost:1234)</small>
              </label>

              <label className="full-width">
                Model
                <input
                  type="text"
                  value={aiConfig.model || ''}
                  onChange={(e) => handleAIFieldChange('model', e.target.value)}
                  placeholder="local-model"
                />
                <small>Name of the model loaded in LM Studio</small>
              </label>
            </div>
          )}

          <div className="settings-section">
            <h2>AI Endpoint Test</h2>
            <div className="settings-actions-row">
              <button
                type="button"
                className="button-secondary"
                onClick={handleTestAIConnection}
                disabled={testingAI}
              >
                {testingAI ? 'Testing...' : 'Test AI Endpoint'}
              </button>
            </div>
            <div className="health-badge-row">
              <span className="health-badge" aria-label="ai health status">
                AI Last Success: {formatHealthTimestamp(aiLastSuccess)}
              </span>
            </div>
            {aiTestMessage && <small className="settings-message">{aiTestMessage}</small>}
          </div>

          <div className="settings-section">
            <h2>Automatic Backups</h2>

            <label className="full-width">
              Backup Interval
              <select
                value={backupConfig.interval}
                onChange={(e) => setBackupConfig({ ...backupConfig, interval: e.target.value as BackupInterval })}
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
                onChange={(e) =>
                  setBackupConfig({ ...backupConfig, keepLastN: Math.max(1, parseInt(e.target.value) || 7) })
                }
              />
              <small>Older automatic backups will be deleted to save space.</small>
            </label>

            {backupConfig.interval !== 'disabled' && (
              <div className="settings-message">
                <strong>Current Status:</strong> {formatBackupInterval(backupConfig.interval)} backups enabled.
                {(() => {
                  const state = loadBackupState()
                  const nextBackup = getNextBackupTime(state.lastBackupAt, backupConfig.interval)
                  return state.lastBackupAt ? (
                    <>
                      {' '}
                      Last backup: {new Date(state.lastBackupAt).toLocaleString()}.
                      {nextBackup && ` Next backup: ${nextBackup.toLocaleString()}.`}
                    </>
                  ) : (
                    ' No backups created yet.'
                  )
                })()}
              </div>
            )}
          </div>

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

            <label className="full-width" style={{ marginTop: '0.8rem' }}>
              Restore Mode
              <select value={restoreMode} onChange={(e) => handleRestoreModeChange(e.target.value as RestoreMode)}>
                <option value="upsert">Upsert (update matching IDs, insert new)</option>
                <option value="append">Append (add all incoming)</option>
                <option value="replace">Replace (overwrite all current jobs)</option>
              </select>
            </label>

            {restoreImpact && (
              <div className="settings-message" aria-label="restore impact preview">
                Preview: +{restoreImpact.inserted} inserted, {restoreImpact.updated} updated, -
                {restoreImpact.removed} removed. Final total: {restoreImpact.finalCount} jobs.
              </div>
            )}

            {restoreMode === 'replace' && restoreImpact && restoreImpact.removed > 0 && (
              <div className="error-message-inline">
                Replace mode will remove {restoreImpact.removed} current jobs not present in backup.
              </div>
            )}

            <div className="settings-actions-row" style={{ marginTop: '0.8rem' }}>
              <button
                type="button"
                className="button-primary"
                onClick={handleApplyRestore}
                disabled={!pendingRestoreJobs}
              >
                Apply Restore
              </button>
            </div>

            {restoreMessage && <small className="settings-message">{restoreMessage}</small>}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {saved && <div className="success-message">Settings saved successfully</div>}

        <div className="profile-footer">
          <button type="button" className="button-secondary" onClick={onClose}>
            ← Back to Jobs
          </button>
          <button type="button" className="button-primary" onClick={handleSaveSettings}>
            Save Settings
          </button>
        </div>
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
    </div>
  )
}
