import type { AppModule } from '../api/types'

const STORAGE_PREFIX = 'xy-task-saida-'

export type SaidaPersistModule = Extract<
  AppModule,
  'notas' | 'excel-prn' | 'importacao-dimob' | 'razao' | 'provisoes' | 'apuracao-pis-cofins'
>

function storageKey(module: SaidaPersistModule): string {
  return `${STORAGE_PREFIX}${module}`
}

export function getStoredSaidaPath(module: SaidaPersistModule): string {
  try {
    return localStorage.getItem(storageKey(module)) ?? ''
  } catch {
    return ''
  }
}

export function setStoredSaidaPath(module: SaidaPersistModule, path: string): void {
  try {
    const trimmed = path.trim()
    if (trimmed) {
      localStorage.setItem(storageKey(module), trimmed)
    } else {
      localStorage.removeItem(storageKey(module))
    }
  } catch {
    /* localStorage indisponível */
  }
}
