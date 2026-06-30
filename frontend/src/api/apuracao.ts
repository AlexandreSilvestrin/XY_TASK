import { apiPost } from './client'
import type { ActionApiResult } from './types'
import type {
  ApuracaoConsorcioRecord,
  EmpresaApuracao,
  EmpresaConsorciadaApuracao,
} from '../types/dadosApuracao'

type ApuracaoCodigosResponse = {
  success?: boolean
  message?: string
  data?: ApuracaoConsorcioRecord
}

type ListResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

export function transformarApuracao(payload: {
  module: 'apuracao-pis-cofins'
  entrada: string
  saida: string
  empresa: EmpresaApuracao
  data: string
}) {
  return apiPost<ActionApiResult>('/transformar_apuracao', payload)
}

export function listarConsorciosApuracao(empresa: EmpresaApuracao) {
  return apiPost<ListResponse<string[]>>('/listar_consorcios_apuracao', { empresa })
}

export function buscarCodigosApuracao(empresa: EmpresaApuracao, consorcio: string) {
  return apiPost<ApuracaoCodigosResponse>('/buscar_codigos_apuracao', {
    empresa,
    consorcio,
  })
}

export function salvarCodigosApuracao(
  empresa: EmpresaApuracao,
  consorcio: string,
  empresas: EmpresaConsorciadaApuracao[],
) {
  return apiPost<ApuracaoCodigosResponse>('/salvar_codigos_apuracao', {
    empresa,
    consorcio,
    empresas,
  })
}
