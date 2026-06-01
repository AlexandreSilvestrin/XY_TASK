import { AppSettingsProvider } from './context/AppSettingsContext'
import { AppSocketProvider } from './context/AppSocketContext'
import { LogsProvider } from './context/LogsContext'
import { PageOverlayProvider } from './context/PageOverlayContext'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <AppSettingsProvider>
      <AppSocketProvider>
        <LogsProvider>
          <PageOverlayProvider>
            <AppShell />
          </PageOverlayProvider>
        </LogsProvider>
      </AppSocketProvider>
    </AppSettingsProvider>
  )
}
