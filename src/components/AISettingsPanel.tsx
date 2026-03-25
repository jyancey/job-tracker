// Modal panel for configuring AI provider credentials and settings (provider, API key, base URL, model).
import { useState } from 'react'
import { AIConfigForm } from './AIConfigForm'
import type { AIConfig } from '../types/ai'
import { loadAIConfig, saveAIConfig } from '../storage/aiStorage'

interface AISettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AISettingsPanel({ isOpen, onClose }: AISettingsPanelProps) {
  const [config, setConfig] = useState<AIConfig>(() => loadAIConfig())
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleFieldChange = <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
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
          <AIConfigForm config={config} onFieldChange={handleFieldChange} headingLevel="h3" showApiKeyToggle />

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
