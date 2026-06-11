import { apiPost } from './client'
import type { CodigosConsorcioEntry, CodigosConsorcioRecord } from '../types/codigosProvisoes'

type CodigosConsorcioResponse = {
  success?: boolean
  message?: string
  data?: CodigosConsorcioRecord
}

export function buscarCodigosConsorcio(codigo: string) {
  return apiPost<CodigosConsorcioResponse>('/buscar_codigos_consorcio', { codigo })
}

export function salvarCodigosConsorcio(codigo: string, entry: CodigosConsorcioEntry) {
  return apiPost<CodigosConsorcioResponse>('/salvar_codigos_consorcio', {
    codigo,
    entry,
  })
}
