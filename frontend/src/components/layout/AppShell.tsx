import { useEffect, useState } from 'react'
import { usePageOverlay } from '../../context/PageOverlayContext'
import { useLicenses } from '../../context/LicenseContext'
import { isLicensedPageId } from '../../lib/licenses'
import { PAGE_COMPONENTS } from '../../pages'
import AdicionarPorcentagemPage from '../../pages/AdicionarPorcentagemPage'
import PesquisarCNPJPage from '../../pages/PesquisarCNPJPage'
import type { PageId } from '../../types/navigation'
import { LicenseModal } from './LicenseModal'
import { ResizablePagesLogs } from './ResizablePagesLogs'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const { overlay, cnpjInitialRows, requestCloseOverlay } = usePageOverlay()
  const { isPageLicensed } = useLicenses()
  const [collapsed, setCollapsed] = useState(false)
  const [activePage, setActivePage] = useState<PageId>('home')

  useEffect(() => {
    if (!isPageLicensed(activePage)) {
      setActivePage('home')
    }
  }, [activePage, isPageLicensed])

  const ActivePage = PAGE_COMPONENTS[activePage]

  const mainContent =
    overlay === 'pesquisar-cnpj' ? (
      <PesquisarCNPJPage initialRows={cnpjInitialRows} />
    ) : overlay === 'adicionar-porcentagem' ? (
      <AdicionarPorcentagemPage />
    ) : (
      <ActivePage />
    )

  return (
    <div className="app-shell flex h-dvh w-full">
      <Sidebar
        collapsed={collapsed}
        activePage={activePage}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onNavigate={(page) => {
          if (isLicensedPageId(page) && !isPageLicensed(page)) return
          requestCloseOverlay(() => setActivePage(page))
        }}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ResizablePagesLogs showLogs={activePage !== 'home'}>
          {mainContent}
        </ResizablePagesLogs>
      </div>

      <LicenseModal />
    </div>
  )
}
