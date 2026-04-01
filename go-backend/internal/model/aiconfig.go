package model

// AIConfig holds AI provider configuration.
type AIConfig struct {
	Provider string `json:"provider"`
	APIKey   string `json:"apiKey"`
	BaseURL  string `json:"baseUrl,omitempty"`
	Model    string `json:"model,omitempty"`
}
