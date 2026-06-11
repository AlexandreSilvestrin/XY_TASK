import { apiPost } from './client'

export type CnpjBancoRecord = {
  cnpj: string
  nome: string
}

type CnpjBancoResponse = {
  success?: boolean
  message?: string
  data?: CnpjBancoRecord
}

export function buscarBancoCnpj(cnpj: string) {
  return apiPost<CnpjBancoResponse>('/buscar_banco_cnpj', { cnpj })
}

export function salvarBancoCnpj(cnpj: string, nome: string) {
  return apiPost<CnpjBancoResponse>('/salvar_banco_cnpj', { cnpj, nome })
}
