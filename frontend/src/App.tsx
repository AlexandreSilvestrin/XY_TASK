import { AppSettingsProvider } from './context/AppSettingsContext'
import { AppSocketProvider } from './context/AppSocketContext'
import { LicenseProvider } from './context/LicenseContext'
import { LogsProvider } from './context/LogsContext'
import { PageOverlayProvider } from './context/PageOverlayContext'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <AppSettingsProvider>
      <LicenseProvider>
        <AppSocketProvider>
          <LogsProvider>
            <PageOverlayProvider>
              <AppShell />
            </PageOverlayProvider>
          </LogsProvider>
        </AppSocketProvider>
      </LicenseProvider>
    </AppSettingsProvider>
  )
}
