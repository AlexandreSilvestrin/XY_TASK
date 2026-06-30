export const EMPRESAS_APURACAO = ['LBR', 'SONDOTECNICA', 'PLANSERVI'] as const

export type EmpresaApuracao = (typeof EMPRESAS_APURACAO)[number]

export type CodigosApuracaoEmpresa = {
  PIS_B: number
  PIS_C: number
  COFINS_B: number
  COFINS_C: number
}

export type EmpresaConsorciadaApuracao = {
  nome: string
  codigos: CodigosApuracaoEmpresa
}

export type ApuracaoConsorcioRecord = {
  empresa: EmpresaApuracao
  consorcio: string
  empresas: EmpresaConsorciadaApuracao[]
}

export const CODIGOS_APURACAO_FIELDS: (keyof CodigosApuracaoEmpresa)[] = [
  'PIS_B',
  'PIS_C',
  'COFINS_B',
  'COFINS_C',
]

export const CODIGOS_APURACAO_LABELS: Record<keyof CodigosApuracaoEmpresa, string> = {
  PIS_B: 'PIS B',
  PIS_C: 'PIS C',
  COFINS_B: 'COFINS B',
  COFINS_C: 'COFINS C',
}

export function emptyCodigosApuracao(): CodigosApuracaoEmpresa {
  return {
    PIS_B: 0,
    PIS_C: 0,
    COFINS_B: 0,
    COFINS_C: 0,
  }
}

export function emptyEmpresaConsorciada(): EmpresaConsorciadaApuracao {
  return {
    nome: '',
    codigos: emptyCodigosApuracao(),
  }
}

export function parseEmpresasApuracao(
  empresas: EmpresaConsorciadaApuracao[],
): EmpresaConsorciadaApuracao[] {
  if (!empresas.length) {
    throw new Error('Informe ao menos uma empresa consorciada na ordem correta.')
  }

  const seen = new Set<string>()

  return empresas.map((item, index) => {
    const nome = item.nome.trim().toUpperCase()
    if (!nome) {
      throw new Error(`Informe o nome da empresa na posição ${index + 1}.`)
    }
    if (seen.has(nome)) {
      throw new Error(`A empresa '${nome}' está duplicada.`)
    }
    seen.add(nome)

    const codigos = { ...emptyCodigosApuracao(), ...item.codigos }
    for (const field of CODIGOS_APURACAO_FIELDS) {
      const value = Number(codigos[field])
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`Preencha o código ${CODIGOS_APURACAO_LABELS[field]} da posição ${index + 1}.`)
      }
      codigos[field] = value
    }

    return { nome, codigos }
  })
}
