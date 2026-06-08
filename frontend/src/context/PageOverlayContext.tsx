import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CnpjRow } from '../types/cnpj'

type OverlayId = 'pesquisar-cnpj' | 'adicionar-porcentagem' | null

export type OverlayCloseGuard = {
  hasUnsavedChanges: () => boolean
  requestClose: (onConfirmed: () => void) => void
}

type PageOverlayContextValue = {
  overlay: OverlayId
  cnpjInitialRows: CnpjRow[]
  openPesquisarCnpj: (initialRows?: CnpjRow[]) => void
  openAdicionarPorcentagem: () => void
  closeOverlay: () => void
  registerOverlayGuard: (guard: OverlayCloseGuard | null) => void
  requestCloseOverlay: (onClosed?: () => void) => void
}

const PageOverlayContext = createContext<PageOverlayContextValue | null>(null)

export function PageOverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<OverlayId>(null)
  const [cnpjInitialRows, setCnpjInitialRows] = useState<CnpjRow[]>([])
  const overlayGuardRef = useRef<OverlayCloseGuard | null>(null)

  const openPesquisarCnpj = useCallback((initialRows: CnpjRow[] = []) => {
    setCnpjInitialRows(initialRows)
    setOverlay('pesquisar-cnpj')
  }, [])

  const openAdicionarPorcentagem = useCallback(() => {
    setOverlay('adicionar-porcentagem')
  }, [])

  const closeOverlay = useCallback(() => {
    setOverlay(null)
    setCnpjInitialRows([])
    overlayGuardRef.current = null
  }, [])

  const registerOverlayGuard = useCallback((guard: OverlayCloseGuard | null) => {
    overlayGuardRef.current = guard
  }, [])

  const requestCloseOverlay = useCallback(
    (onClosed?: () => void) => {
      if (!overlay) {
        onClosed?.()
        return
      }

      const guard = overlayGuardRef.current

      if (guard?.hasUnsavedChanges()) {
        guard.requestClose(() => {
          closeOverlay()
          onClosed?.()
        })
        return
      }

      closeOverlay()
      onClosed?.()
    },
    [overlay, closeOverlay],
  )

  const value = useMemo(
    () => ({
      overlay,
      cnpjInitialRows,
      openPesquisarCnpj,
      openAdicionarPorcentagem,
      closeOverlay,
      registerOverlayGuard,
      requestCloseOverlay,
    }),
    [
      overlay,
      cnpjInitialRows,
      openPesquisarCnpj,
      openAdicionarPorcentagem,
      closeOverlay,
      registerOverlayGuard,
      requestCloseOverlay,
    ],
  )

  return (
    <PageOverlayContext.Provider value={value}>
      {children}
    </PageOverlayContext.Provider>
  )
}

export function usePageOverlay() {
  const context = useContext(PageOverlayContext)
  if (!context) {
    throw new Error('usePageOverlay must be used within PageOverlayProvider')
  }
  return context
}
