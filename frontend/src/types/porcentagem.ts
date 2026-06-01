export type PorcentagemRow = {
  id: string
  nome: string
  percentual: string
}

export type RetencaoKey = 'IR' | 'PIS' | 'COFINS' | 'CSLL'

export const RETENCOES_OPTIONS: RetencaoKey[] = ['IR', 'PIS', 'COFINS', 'CSLL']

/** Resposta de pesquisar — porcentagens em lista para a tabela da UI. */
export type GuiaPorcentagemData = {
  contrato: string
  razao_social: string
  cnpj: string
  porcentagens: { nome: string; percentual: number }[]
  retencoes: string[]
}
