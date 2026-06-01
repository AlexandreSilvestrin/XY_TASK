export type CnpjRow = {
  cnpj: string
  nome: string
}

export type CnpjSearchStatus = 'parado' | 'em_andamento' | 'finalizado' | 'interrompido'

export type CnpjTablePayload = {
  data: CnpjRow[]
}

export type CnpjProgressEvent = {
  index: number
  cnpj: string
  nome: string
}

export const STATUS_LABELS: Record<CnpjSearchStatus, string> = {
  parado: 'Parado',
  em_andamento: 'Em andamento',
  finalizado: 'Finalizado',
  interrompido: 'Interrompido',
}

export function isRowFilled(row: CnpjRow): boolean {
  return row.cnpj.trim() !== '' && row.nome.trim() !== ''
}

export function countFilled(rows: CnpjRow[]): number {
  return rows.filter(isRowFilled).length
}

/** Envia a tabela inteira para os índices do websocket coincidirem com as linhas na UI. */
export function rowsForIniciar(rows: CnpjRow[]): CnpjRow[] {
  return rows.map((row) => ({
    cnpj: row.cnpj.trim(),
    nome: row.nome.trim(),
  }))
}

export function rowsForSalvar(rows: CnpjRow[]): CnpjRow[] {
  return rows.filter(isRowFilled)
}
