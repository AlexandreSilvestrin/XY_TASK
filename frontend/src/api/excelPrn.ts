import { apiPost } from './client'
import type { ActionApiResult, ExcelPrnActionPayload } from './types'

export function geralPrn(payload: ExcelPrnActionPayload) {
  return apiPost<ActionApiResult>('/geral_prn', payload)
}
