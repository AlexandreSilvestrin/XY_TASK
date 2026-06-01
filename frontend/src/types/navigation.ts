export type PageId =
  | 'home'
  | 'notas-faturamento'
  | 'excel-prn'
  | 'importacao-dimob'
  | 'razao'

export type NavItem = {
  id: PageId
  label: string
  order: number
}
