import type { PageId } from '../types/navigation'

export type LicensedPageId =
  | 'notas-faturamento'
  | 'excel-prn'
  | 'razao'
  | 'importacao-dimob'
  | 'provisoes'

export const LICENSED_PAGE_IDS: LicensedPageId[] = [
  'notas-faturamento',
  'excel-prn',
  'razao',
  'importacao-dimob',
  'provisoes',
]

export const LICENSE_KEYS: Record<LicensedPageId, string> = {
  'notas-faturamento': 'NOTAS-K92JD',
  'excel-prn': 'PRN-8X72A',
  razao: 'RAZAO-1P7XA',
  'importacao-dimob': 'DIMOB-9L3MN',
  provisoes: 'PROVISOES-6R2KP',
}

export const LICENSE_FIELD_LABELS: Record<LicensedPageId, string> = {
  'notas-faturamento': 'NOTAS',
  'excel-prn': 'EXCEL PARA PRN',
  razao: 'RAZÃO',
  'importacao-dimob': 'DIMOB',
  provisoes: 'PROVISÕES',
}

export function isLicensedPageId(page: PageId): page is LicensedPageId {
  return LICENSED_PAGE_IDS.includes(page as LicensedPageId)
}

export type StoredLicenses = Record<LicensedPageId, string>

export function emptyStoredLicenses(): StoredLicenses {
  return {
    'notas-faturamento': '',
    'excel-prn': '',
    razao: '',
    'importacao-dimob': '',
    provisoes: '',
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
