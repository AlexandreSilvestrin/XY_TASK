import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CnpjRow } from '../types/cnpj'

type OverlayId = 'pesquisar-cnpj' | 'adicionar-porcentagem' | null

type PageOverlayContextValue = {
  overlay: OverlayId
  cnpjInitialRows: CnpjRow[]
  openPesquisarCnpj: (initialRows?: CnpjRow[]) => void
  openAdicionarPorcentagem: () => void
  closeOverlay: () => void
}

const PageOverlayContext = createContext<PageOverlayContextValue | null>(null)

export function PageOverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<OverlayId>(null)
  const [cnpjInitialRows, setCnpjInitialRows] = useState<CnpjRow[]>([])

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
  }, [])

  const value = useMemo(
    () => ({
      overlay,
      cnpjInitialRows,
      openPesquisarCnpj,
      openAdicionarPorcentagem,
      closeOverlay,
    }),
    [overlay, cnpjInitialRows, openPesquisarCnpj, openAdicionarPorcentagem, closeOverlay],
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
