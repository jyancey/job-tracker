import { useId, useState } from 'react'
import type { AIConfig } from '../types/ai'

interface AIConfigFormProps {
  config: AIConfig
  onFieldChange: <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => void
  headingLevel?: 'h2' | 'h3'
  showApiKeyToggle?: boolean
}

export function AIConfigForm({
  config,
  onFieldChange,
  headingLevel = 'h2',
  showApiKeyToggle = false,
}: AIConfigFormProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const providerFieldName = `provider-${useId()}`
  const HeadingTag = headingLevel
  const apiKeyInputType = showApiKeyToggle && showApiKey ? 'text' : 'password'

  return (
    <>
      <div className="settings-section">
        <HeadingTag>AI Provider</HeadingTag>

        <fieldset className="provider-options">
          <label className="radio-label">
            <input
              type="radio"
              name={providerFieldName}
              value="disabled"
              checked={config.provider === 'disabled'}
              onChange={() => onFieldChange('provider', 'disabled')}
            />
            <span className="radio-text">
              <strong>Disabled</strong>
              <small>No AI scoring</small>
            </span>
          </label>

          <label className="radio-label">
            <input
              type="radio"
              name={providerFieldName}
              value="openai"
              checked={config.provider === 'openai'}
              onChange={() => onFieldChange('provider', 'openai')}
            />
            <span className="radio-text">
              <strong>OpenAI</strong>
              <small>Cloud-based GPT models</small>
            </span>
          </label>

          <label className="radio-label">
            <input
              type="radio"
              name={providerFieldName}
              value="lmstudio"
              checked={config.provider === 'lmstudio'}
              onChange={() => onFieldChange('provider', 'lmstudio')}
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
          <HeadingTag>OpenAI Configuration</HeadingTag>

          <label className="full-width">
            API Key
            <div className="input-with-toggle">
              <input
                type={apiKeyInputType}
                value={config.apiKey}
                onChange={(e) => onFieldChange('apiKey', e.target.value)}
                placeholder="sk-..."
                required
              />
              {showApiKeyToggle && (
                <button
                  type="button"
                  className="toggle-button"
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  onClick={() => setShowApiKey((current) => !current)}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
            <small>Get your API key from https://platform.openai.com/api-keys</small>
          </label>

          <label className="full-width">
            Model
            <input
              type="text"
              value={config.model || ''}
              onChange={(e) => onFieldChange('model', e.target.value)}
              placeholder="gpt-4o-mini (default)"
            />
            <small>Recommended: gpt-4o-mini for cost-effectiveness</small>
          </label>
        </div>
      )}

      {config.provider === 'lmstudio' && (
        <div className="settings-section">
          <HeadingTag>LM Studio Configuration</HeadingTag>

          <label className="full-width">
            Base URL
            <input
              type="url"
              value={config.baseUrl || ''}
              onChange={(e) => onFieldChange('baseUrl', e.target.value)}
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
              onChange={(e) => onFieldChange('model', e.target.value)}
              placeholder="local-model"
            />
            <small>Name of the model loaded in LM Studio</small>
          </label>
        </div>
      )}
    </>
  )
}
