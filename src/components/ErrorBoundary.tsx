import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

/**
 * Catches render/runtime errors in the React tree and shows a safe fallback UI.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown application error',
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Keep console logging for local diagnostics.
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <main className="content-grid">
            <section className="panel views-panel error-fallback">
              <h2>Something went wrong</h2>
              <p>
                The application encountered an unexpected error. You can retry the current view or
                reload the app.
              </p>
              {this.state.errorMessage && <pre className="error-message">{this.state.errorMessage}</pre>}
              <div className="error-actions">
                <button type="button" onClick={this.handleRetry}>
                  Retry
                </button>
                <button type="button" className="ghost" onClick={this.handleReload}>
                  Reload App
                </button>
              </div>
            </section>
          </main>
        </div>
      )
    }

    return this.props.children
  }
}
