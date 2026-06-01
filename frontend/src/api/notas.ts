import { apiPost } from './client'
import type { NotasActionPayload } from './types'

export type NotasApiResult = {
  success?: boolean
  message?: string
  path?: string
}

export function pesquisarCnpj(payload: NotasActionPayload) {
  return apiPost<unknown>('/pesquisar_cnpj', payload)
}

/** Backend abre o seletor de pasta no servidor; body pode ser vazio. */
export function exportarBanco() {
  return apiPost<NotasApiResult>('/exportar_banco', { module: 'notas' })
}

/** Backend abre o seletor de arquivo .xlsx no servidor; body pode ser vazio. */
export function importarBanco() {
  return apiPost<NotasApiResult>('/importar_banco', { module: 'notas' })
}

export function adicionarPorcentagem(payload: NotasActionPayload) {
  return apiPost<unknown>('/adicionar_porcentagem', payload)
}

export function geralNotas(payload: NotasActionPayload) {
  return apiPost<unknown>('/geral_notas', payload)
}

export function gerarFaturamento(payload: NotasActionPayload) {
  return apiPost<unknown>('/gerar_faturamento', payload)
}
