import { apiPost } from './client'
import type { ActionApiResult, DimobActionPayload } from './types'

export function transformarDimob(payload: DimobActionPayload) {
  return apiPost<ActionApiResult>('/transformar_dimob', payload)
}
