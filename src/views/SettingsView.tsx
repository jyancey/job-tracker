// Settings hub for AI configuration, backup scheduling, and operational sections.
import { useState } from 'react'
import type { Job } from '../domain'
import type { AIConfig } from '../types/ai'
import { loadAIConfig, saveAIConfig } from '../storage/aiStorage'
import { loadBackupConfig, saveBackupConfig, type BackupConfig } from '../features/backup'
import { AISettingsSection } from './settings/AISettingsSection'
import { BackupScheduleSection } from './settings/BackupScheduleSection'
import { DatabaseSettingsSection } from './settings/DatabaseSettingsSection'
import { RestoreSettingsSection } from './settings/RestoreSettingsSection'

interface SettingsViewProps {
  onClose: () => void
  jobs: Job[]
  setJobs: (updater: (jobs: Job[]) => Job[]) => void
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

export function SettingsView({ onClose, jobs, setJobs, addNotification }: SettingsViewProps) {
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => loadAIConfig())
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(() => loadBackupConfig())
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleAIFieldChange = <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    setAiConfig((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
    setError('')
  }

  const handleBackupConfigChange = (nextBackupConfig: BackupConfig) => {
    setBackupConfig(nextBackupConfig)
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

  return (
    <>
      <header className="profile-view-header">
        <h1>Settings</h1>
        <button className="close-button" onClick={onClose} title="Close">
          ✕
        </button>
      </header>

      <div className="profile-content">
        <div className="ai-tab">
          <DatabaseSettingsSection />
          <AISettingsSection aiConfig={aiConfig} onFieldChange={handleAIFieldChange} />
          <BackupScheduleSection backupConfig={backupConfig} onChange={handleBackupConfigChange} />

          <RestoreSettingsSection jobs={jobs} setJobs={setJobs} addNotification={addNotification} />
        </div>

        {error && <div className="error-message">{error}</div>}
        {saved && <div className="success-message">Settings saved successfully</div>}

        <div className="profile-footer">
          <button type="button" className="button-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="button-primary" onClick={handleSaveSettings}>
            Save Settings
          </button>
        </div>
      </div>
    </>
  )
}
