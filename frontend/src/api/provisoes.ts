import { apiPost } from './client'
import type { ActionApiResult, ProvisoesActionPayload } from './types'

export function transformarProvisoes(payload: ProvisoesActionPayload) {
  return apiPost<ActionApiResult>('/transformar_provisoes', payload)
}
