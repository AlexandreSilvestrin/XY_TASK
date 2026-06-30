export type PageId =
  | 'home'
  | 'notas-faturamento'
  | 'excel-prn'
  | 'importacao-dimob'
  | 'razao'
  | 'provisoes'
  | 'apuracao-pis-cofins'

export type NavItem = {
  id: PageId
  label: string
  order: number
}
