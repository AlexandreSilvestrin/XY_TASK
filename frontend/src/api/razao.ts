import { apiPost } from './client'
import type { ActionApiResult, RazaoActionPayload } from './types'

export function transformarRazao(payload: RazaoActionPayload) {
  return apiPost<ActionApiResult>('/transformar_razao', payload)
}
