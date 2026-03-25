import { useState } from 'react'
import { AIConfigForm } from '../../components/AIConfigForm'
import { testAIEndpoint } from '../../services/settingsService'
import type { AIConfig } from '../../types/ai'

const AI_HEALTH_KEY = 'job-tracker-settings-ai-last-success'

function formatHealthTimestamp(value: string | null): string {
  if (!value) {
    return 'Not tested yet'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Not tested yet' : parsed.toLocaleString()
}

interface AISettingsSectionProps {
  aiConfig: AIConfig
  onFieldChange: <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => void
}

export function AISettingsSection({ aiConfig, onFieldChange }: AISettingsSectionProps) {
  const [aiTestMessage, setAiTestMessage] = useState('')
  const [testingAI, setTestingAI] = useState(false)
  const [aiLastSuccess, setAiLastSuccess] = useState<string | null>(() => localStorage.getItem(AI_HEALTH_KEY))

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
    <>
      <AIConfigForm config={aiConfig} onFieldChange={onFieldChange} />

      <div className="settings-section">
        <h2>AI Endpoint Test</h2>
        <div className="settings-actions-row">
          <button type="button" className="button-secondary" onClick={handleTestAIConnection} disabled={testingAI}>
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
    </>
  )
}
