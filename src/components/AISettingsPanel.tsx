// Modal panel for configuring AI provider credentials and settings (provider, API key, base URL, model).
import { useState } from 'react'
import type { AIConfig, AIProvider } from '../types/ai'
import { loadAIConfig, saveAIConfig } from '../storage/aiStorage'

interface AISettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AISettingsPanel({ isOpen, onClose }: AISettingsPanelProps) {
  const [config, setConfig] = useState<AIConfig>(() => loadAIConfig())
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleProviderChange = (provider: AIProvider) => {
    setConfig((prev) => ({ ...prev, provider }))
    setSaved(false)
    setError('')
  }

  const handleApiKeyChange = (apiKey: string) => {
    setConfig((prev) => ({ ...prev, apiKey }))
    setSaved(false)
    setError('')
  }

  const handleBaseUrlChange = (baseUrl: string) => {
    setConfig((prev) => ({ ...prev, baseUrl }))
    setSaved(false)
    setError('')
  }

  const handleModelChange = (model: string) => {
    setConfig((prev) => ({ ...prev, model }))
    setSaved(false)
    setError('')
  }

  const handleSave = () => {
    try {
      if (config.provider === 'openai' && !config.apiKey.trim()) {
        setError('OpenAI API key is required')
        return
      }
      if (config.provider === 'lmstudio' && !config.baseUrl?.trim()) {
        setError('LM Studio base URL is required')
        return
      }
      saveAIConfig(config)
      setSaved(true)
      setError('')
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    }
  }

  const handleDisable = () => {
    const disabledConfig: AIConfig = {
      provider: 'disabled',
      apiKey: '',
      baseUrl: '',
      model: '',
    }
    setConfig(disabledConfig)
    saveAIConfig(disabledConfig)
    setSaved(true)
    setError('')
    setTimeout(() => setSaved(false), 3000)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>AI Scoring Settings</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ai-settings-content">
          <div className="settings-section">
            <h3>AI Provider</h3>

            <fieldset className="provider-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="provider"
                  value="disabled"
                  checked={config.provider === 'disabled'}
                  onChange={() => handleProviderChange('disabled' as AIProvider)}
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
                  checked={config.provider === 'openai'}
                  onChange={() => handleProviderChange('openai' as AIProvider)}
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
                  checked={config.provider === 'lmstudio'}
                  onChange={() => handleProviderChange('lmstudio' as AIProvider)}
                />
                <span className="radio-text">
                  <strong>LM Studio</strong>
                  <small>Local LLM (privacy-first)</small>
                </span>
              </label>
            </fieldset>
          </div>

          {config.provider === 'openai' && (
            <div className="settings-section">
              <h3>OpenAI Configuration</h3>

              <label className="full-width">
                API Key
                <div className="input-with-toggle">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="sk-..."
                    required
                  />
                  <button
                    type="button"
                    className="toggle-button"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <small>Get your API key from https://platform.openai.com/api-keys</small>
              </label>

              <label className="full-width">
                Model
                <input
                  type="text"
                  value={config.model || ''}
                  onChange={(e) => handleModelChange(e.target.value)}
                  placeholder="gpt-4o-mini (default)"
                  defaultValue="gpt-4o-mini"
                />
                <small>Recommended: gpt-4o-mini for cost-effectiveness</small>
              </label>
            </div>
          )}

          {config.provider === 'lmstudio' && (
            <div className="settings-section">
              <h3>LM Studio Configuration</h3>

              <label className="full-width">
                Base URL
                <input
                  type="url"
                  value={config.baseUrl || ''}
                  onChange={(e) => handleBaseUrlChange(e.target.value)}
                  placeholder="http://localhost:1234"
                  required
                />
                <small>LM Studio API endpoint (default: http://localhost:1234)</small>
              </label>

              <label className="full-width">
                Model
                <input
                  type="text"
                  value={config.model || ''}
                  onChange={(e) => handleModelChange(e.target.value)}
                  placeholder="local-model"
                />
                <small>Name of the model loaded in LM Studio</small>
              </label>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {saved && <div className="success-message">Settings saved successfully</div>}

          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>
              Close
            </button>
            {config.provider !== 'disabled' && (
              <button type="button" className="button-secondary" onClick={handleDisable}>
                Disable AI
              </button>
            )}
            {config.provider !== 'disabled' && (
              <button type="button" className="button-primary" onClick={handleSave}>
                Save Settings
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
