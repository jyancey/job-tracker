import { useState } from 'react'
import type { AIConfig } from '../types/ai'
import { loadAIConfig, saveAIConfig } from '../storage/aiStorage'

interface SettingsViewProps {
  onClose: () => void
}

export function SettingsView({ onClose }: SettingsViewProps) {
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => loadAIConfig())
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div className="profile-view-container">
      <header className="profile-view-header">
        <h1>AI Settings</h1>
        <button className="close-button" onClick={onClose} title="Close">
          ✕
        </button>
      </header>

      <div className="profile-content">
        <div className="ai-tab">
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
                  defaultValue="gpt-4o-mini"
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
