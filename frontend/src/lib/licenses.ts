import type { PageId } from '../types/navigation'

export type LicensedPageId = Exclude<PageId, 'home'>

export const LICENSED_PAGE_IDS: LicensedPageId[] = [
  'notas-faturamento',
  'excel-prn',
  'razao',
  'importacao-dimob',
]

export const LICENSE_KEYS: Record<LicensedPageId, string> = {
  'notas-faturamento': 'NOTAS-K92JD',
  'excel-prn': 'PRN-8X72A',
  razao: 'RAZAO-1P7XA',
  'importacao-dimob': 'DIMOB-9L3MN',
}

export const LICENSE_FIELD_LABELS: Record<LicensedPageId, string> = {
  'notas-faturamento': 'NOTAS',
  'excel-prn': 'EXCEL PARA PRN',
  razao: 'RAZÃO',
  'importacao-dimob': 'DIMOB',
}

export function isLicensedPageId(page: PageId): page is LicensedPageId {
  return page !== 'home'
}

export type StoredLicenses = Record<LicensedPageId, string>

export function emptyStoredLicenses(): StoredLicenses {
  return {
    'notas-faturamento': '',
    'excel-prn': '',
    razao: '',
    'importacao-dimob': '',
  }
}

export function computeActiveLicenses(stored: StoredLicenses): Record<LicensedPageId, boolean> {
  return LICENSED_PAGE_IDS.reduce(
    (acc, pageId) => {
      acc[pageId] = stored[pageId].trim() === LICENSE_KEYS[pageId]
      return acc
    },
    {} as Record<LicensedPageId, boolean>,
  )
}
