import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  computeActiveLicenses,
  emptyStoredLicenses,
  isLicensedPageId,
  LICENSED_PAGE_IDS,
  LICENSE_KEYS,
  type LicensedPageId,
  type StoredLicenses,
} from '../lib/licenses'
import type { PageId } from '../types/navigation'

type LicenseErrors = Partial<Record<LicensedPageId, string>>

type ActivateResult =
  | { ok: true }
  | { ok: false; errors: LicenseErrors }

type LicenseContextValue = {
  storedLicenses: StoredLicenses
  activeLicenses: Record<LicensedPageId, boolean>
  licenseModalOpen: boolean
  isPageLicensed: (page: PageId) => boolean
  openLicenseModal: () => void
  closeLicenseModal: () => void
  activateLicenses: (inputs: StoredLicenses) => ActivateResult
}

const STORAGE_KEY = 'xy-task-licenses'

const LicenseContext = createContext<LicenseContextValue | null>(null)

function readStoredLicenses(): StoredLicenses {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStoredLicenses()

    const parsed = JSON.parse(raw) as Partial<StoredLicenses>
    const empty = emptyStoredLicenses()

    for (const pageId of LICENSED_PAGE_IDS) {
      empty[pageId] = typeof parsed[pageId] === 'string' ? parsed[pageId] : ''
    }

    return empty
  } catch {
    return emptyStoredLicenses()
  }
}

function persistLicenses(stored: StoredLicenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [storedLicenses, setStoredLicenses] = useState<StoredLicenses>(() =>
    readStoredLicenses(),
  )
  const [licenseModalOpen, setLicenseModalOpen] = useState(false)

  const activeLicenses = useMemo(
    () => computeActiveLicenses(storedLicenses),
    [storedLicenses],
  )

  const isPageLicensed = useCallback(
    (page: PageId) => {
      if (!isLicensedPageId(page)) return true
      return activeLicenses[page]
    },
    [activeLicenses],
  )

  const openLicenseModal = useCallback(() => {
    setLicenseModalOpen(true)
  }, [])

  const closeLicenseModal = useCallback(() => {
    setLicenseModalOpen(false)
  }, [])

  const activateLicenses = useCallback((inputs: StoredLicenses): ActivateResult => {
    const errors: LicenseErrors = {}
    const nextStored = { ...storedLicenses }

    for (const pageId of LICENSED_PAGE_IDS) {
      const value = inputs[pageId].trim()

      if (value === '') {
        nextStored[pageId] = ''
        continue
      }

      if (value === LICENSE_KEYS[pageId]) {
        nextStored[pageId] = value
        continue
      }

      errors[pageId] = 'Licença inválida'
    }

    setStoredLicenses(nextStored)
    persistLicenses(nextStored)

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors }
    }

    return { ok: true }
  }, [storedLicenses])

  const value = useMemo(
    () => ({
      storedLicenses,
      activeLicenses,
      licenseModalOpen,
      isPageLicensed,
      openLicenseModal,
      closeLicenseModal,
      activateLicenses,
    }),
    [
      storedLicenses,
      activeLicenses,
      licenseModalOpen,
      isPageLicensed,
      openLicenseModal,
      closeLicenseModal,
      activateLicenses,
    ],
  )

  return (
    <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>
  )
}

export function useLicenses() {
  const context = useContext(LicenseContext)
  if (!context) {
    throw new Error('useLicenses must be used within LicenseProvider')
  }
  return context
}
