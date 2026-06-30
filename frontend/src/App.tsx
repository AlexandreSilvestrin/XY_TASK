import { AppSettingsProvider } from './context/AppSettingsContext'
import { AppSocketProvider } from './context/AppSocketContext'
import { LicenseProvider } from './context/LicenseContext'
import { LogsProvider } from './context/LogsContext'
import { LogsPanelVisibilityProvider } from './context/LogsPanelVisibilityContext'
import { PageOverlayProvider } from './context/PageOverlayContext'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <AppSettingsProvider>
      <LicenseProvider>
        <AppSocketProvider>
          <LogsProvider>
            <LogsPanelVisibilityProvider>
              <PageOverlayProvider>
                <AppShell />
              </PageOverlayProvider>
            </LogsPanelVisibilityProvider>
          </LogsProvider>
        </AppSocketProvider>
      </LicenseProvider>
    </AppSettingsProvider>
  )
}
