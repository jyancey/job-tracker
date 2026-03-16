import { AppShellView } from './views/AppShellView'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppContentModel } from './hooks/useAppContentModel'

function AppContent() {
  const appShellProps = useAppContentModel()
  return <AppShellView {...appShellProps} />
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
