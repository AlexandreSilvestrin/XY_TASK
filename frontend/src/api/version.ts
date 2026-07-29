import { apiGet, apiPost } from './client'

export type VersionResponse = {
  success?: boolean
  version?: string
}

export type UpdateCheckResponse = {
  success?: boolean
  message?: string
}

export function fetchAppVersion() {
  return apiGet<VersionResponse>('/version')
}

export function checkForUpdates() {
  return apiPost<UpdateCheckResponse>('/verificar_atualizacao', {})
}

export function formatAppVersionLabel(version: string): string {
  const trimmed = version.trim()
  if (!trimmed) return 'V.?.?.?'
  return trimmed.startsWith('V') ? trimmed : `V.${trimmed}`
}
