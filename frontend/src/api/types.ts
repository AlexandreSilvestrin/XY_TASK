export type SelectType = 'pasta' | 'arquivos'

export type SelectTarget = 'entrada' | 'saida'

export type AppModule = 'notas' | 'excel-prn' | 'importacao-dimob' | 'razao' | 'provisoes' | 'home'

export type SelectPayload = {
  type: SelectType
  module: AppModule
  target: SelectTarget
}

export type SelectResponse = {
  path: string
}

export type NotasActionPayload = {
  module: 'notas'
  entrada: string
  saida: string
  mes: number
  ano: number
}

export type ExcelPrnActionPayload = {
  module: 'excel-prn'
  entrada: string
  saida: string
}

export type RazaoModo = 'resumo' | 'dfc'

export type RazaoActionPayload = {
  module: 'razao'
  entrada: string
  saida: string
  modo: RazaoModo
  /** Contas contrapartida (obrigatório quando modo = dfc). */
  contras?: number[]
}

export type DimobActionPayload = {
  module: 'importacao-dimob'
  entrada: string
  saida: string
}

export type ProvisoesActionPayload = {
  module: 'provisoes'
  entrada: string
  saida: string
}

export type ActionApiResult = {
  success?: boolean
  message?: string
  file?: string
}

export type LogStatus = 'success' | 'error'

export type LogEntry = {
  module: string
  status: LogStatus
  file: string
  message: string
}
