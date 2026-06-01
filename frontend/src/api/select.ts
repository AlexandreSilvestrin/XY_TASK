import { apiPost } from './client'
import type { SelectPayload, SelectResponse } from './types'

export function requestSelect(payload: SelectPayload) {
  return apiPost<SelectResponse>('/select', payload)
}
