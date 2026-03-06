import { useEffect, useState } from 'react'
import type { AIConfig } from '../types/ai'
import { loadAIConfig, saveAIConfig } from '../storage/aiStorage'
import {
  createDatabase,
  fetchDatabaseInfo,
  testAIEndpoint,
  testDatabaseConnection,
  type DatabaseInfo,
} from '../services/settingsService'

interface SettingsViewProps {
  onClose: () => void
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

export function SettingsView({ onClose }: SettingsViewProps) {
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => loadAIConfig())
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [databaseMessage, setDatabaseMessage] = useState('')
  const [aiTestMessage, setAiTestMessage] = useState('')
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [testingDatabase, setTestingDatabase] = useState(false)
  const [testingAI, setTestingAI] = useState(false)
  const [creatingDatabase, setCreatingDatabase] = useState(false)
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
      setSaved(true)
      setError('')
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
    </div>
  )
}
