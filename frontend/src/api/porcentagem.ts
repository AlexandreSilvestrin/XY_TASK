import { apiPost } from './client'
import type { GuiaPorcentagemData } from '../types/porcentagem'
import type { NotasApiResult } from './notas'

export type PesquisarGuiaResponse = NotasApiResult & {
  data?: GuiaPorcentagemData
}

export type SalvarGuiaPayload = {
  contrato: string
  razao_social: string
  cnpj: string
  porcentagens: Record<string, number>
  retencoes: string[]
}

export function pesquisarGuiaPorcentagem(cnpj: string) {
  return apiPost<PesquisarGuiaResponse>('/pesquisar_guia_porcentagem', { cnpj })
}

export function salvarGuiaPorcentagem(payload: SalvarGuiaPayload) {
  return apiPost<NotasApiResult>('/salvar_guia_porcentagem', payload)
}
