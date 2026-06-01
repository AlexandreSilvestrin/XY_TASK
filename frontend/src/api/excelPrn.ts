import { apiPost } from './client'
import type { ExcelPrnActionPayload } from './types'

export function geralPrn(payload: ExcelPrnActionPayload) {
  return apiPost<unknown>('/geral_prn', payload)
}
