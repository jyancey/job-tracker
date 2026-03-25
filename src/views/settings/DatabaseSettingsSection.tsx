import { useEffect, useState } from 'react'
import {
  createDatabase,
  fetchDatabaseInfo,
  testDatabaseConnection,
  type DatabaseInfo,
} from '../../services/settingsService'

const DB_HEALTH_KEY = 'job-tracker-settings-db-last-success'

function formatHealthTimestamp(value: string | null): string {
  if (!value) {
    return 'Not tested yet'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Not tested yet' : parsed.toLocaleString()
}

export function DatabaseSettingsSection() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [databaseMessage, setDatabaseMessage] = useState('')
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [testingDatabase, setTestingDatabase] = useState(false)
  const [creatingDatabase, setCreatingDatabase] = useState(false)
  const [dbLastSuccess, setDbLastSuccess] = useState<string | null>(() => localStorage.getItem(DB_HEALTH_KEY))

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

  return (
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
        <input type="text" value={databaseInfo?.dbPath || (loadingInfo ? 'Loading...' : 'Unavailable')} readOnly />
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
  )
}
