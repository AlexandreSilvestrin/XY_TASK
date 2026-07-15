import { apiPost } from './client'

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
}

/** Backend abre o diálogo para salvar o .xybackup. */
export function criarBackup() {
  return apiPost<BackupApiResult>('/criar_backup', {})
}

/** Backend abre o diálogo para selecionar o .xybackup e substitui os dados. */
export function importarBackup() {
  return apiPost<BackupApiResult>('/importar_backup', {})
}
