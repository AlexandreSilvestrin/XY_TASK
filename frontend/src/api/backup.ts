import { apiGet, apiPost } from './client'

export type BackupApiResult = {
  success?: boolean
  cancelled?: boolean
  message?: string
  path?: string
  local_path?: string
  version?: string
  backup_version?: string
  app_version?: string
  version_mismatch?: boolean
  created_at?: string
  status?: string
  hostname?: string
  code?: string
  ip?: string
  active?: boolean
  firewall_ok?: boolean
  firewall_message?: string
  computers?: RedeComputer[]
}

export type RedeComputer = {
  hostname: string
  ip: string
  code: string
}

/** Backend abre o diálogo para salvar o .xybackup. */
export function criarBackup() {
  return apiPost<BackupApiResult>('/criar_backup', {})
}

/** Backend abre o diálogo para selecionar o .xybackup e substitui os dados. */
export function importarBackup() {
  return apiPost<BackupApiResult>('/importar_backup', {})
}

export function iniciarEnvioRede() {
  return apiPost<BackupApiResult>('/banco_rede/iniciar_envio', {})
}

export function statusEnvioRede() {
  return apiGet<BackupApiResult>('/banco_rede/status_envio')
}

export function cancelarEnvioRede() {
  return apiPost<BackupApiResult>('/banco_rede/cancelar_envio', {})
}

export function descobrirComputadoresRede() {
  return apiPost<BackupApiResult>('/banco_rede/descobrir', {})
}

export function receberBancoRede(ip: string) {
  return apiPost<BackupApiResult>('/banco_rede/receber', { ip })
}
