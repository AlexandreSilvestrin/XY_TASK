import { apiGet } from './client'

export type VersionResponse = {
  success?: boolean
  version?: string
}

export function fetchAppVersion() {
  return apiGet<VersionResponse>('/version')
}

export function formatAppVersionLabel(version: string): string {
  const trimmed = version.trim()
  if (!trimmed) return 'V.?.?.?'
  return trimmed.startsWith('V') ? trimmed : `V.${trimmed}`
}
