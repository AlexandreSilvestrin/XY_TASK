export type CodigosConsorcioEntry = {
  B: number[]
  'B BAIXA': number[]
  C: number[]
  'C BAIXA': number[]
}

export type CodigosConsorcioRecord = CodigosConsorcioEntry & {
  codigo: string
}

export const ORDEM_PROVISAO_LABELS = [
  'Provisão de férias',
  'FGTS s/ provisão de férias',
  'INSS s/ provisão de férias',
  'Provisão de 13º salário',
  'FGTS s/ provisão de 13º salário',
  'INSS s/ provisão de 13º salário',
] as const

export const CODIGOS_LIST_SIZE = 6

export function emptyCodigosEntry(): CodigosConsorcioEntry {
  return {
    B: Array(CODIGOS_LIST_SIZE).fill(0),
    'B BAIXA': Array(CODIGOS_LIST_SIZE).fill(0),
    C: Array(CODIGOS_LIST_SIZE).fill(0),
    'C BAIXA': Array(CODIGOS_LIST_SIZE).fill(0),
  }
}

export function codigosEntryToForm(entry: CodigosConsorcioEntry): CodigosConsorcioEntry {
  return {
    B: [...entry.B],
    'B BAIXA': [...entry['B BAIXA']],
    C: [...entry.C],
    'C BAIXA': [...entry['C BAIXA']],
  }
}

export function parseCodigosForm(entry: CodigosConsorcioEntry): CodigosConsorcioEntry {
  const parseList = (values: number[]) =>
    values.map((value) => {
      const parsed = Number(String(value).trim())
      if (!Number.isFinite(parsed)) {
        throw new Error('Informe apenas números nos códigos.')
      }
      return parsed
    })

  return {
    B: parseList(entry.B),
    'B BAIXA': parseList(entry['B BAIXA']),
    C: parseList(entry.C),
    'C BAIXA': parseList(entry['C BAIXA']),
  }
}
