import { apiPost } from './client'
import type { CnpjTablePayload } from '../types/cnpj'

export function iniciarPesquisaCnpj(payload: CnpjTablePayload) {
  return apiPost<unknown>('/iniciar_pesquisa_cnpj', payload)
}

export function pararPesquisaCnpj() {
  return apiPost<unknown>('/parar_pesquisa_cnpj')
}

export function salvarCnpj(payload: CnpjTablePayload) {
  return apiPost<unknown>('/salvar_cnpj', payload)
}
