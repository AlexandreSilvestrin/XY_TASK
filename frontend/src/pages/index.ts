import type { ComponentType } from 'react'
import type { PageId } from '../types/navigation'
import HomePage from './HomePage'
import NotasFaturamentoPage from './NotasFaturamentoPage'
import ExcelParaPrnPage from './ExcelParaPrnPage'
import ImportacaoDimobPage from './ImportacaoDimobPage'
import RazaoPage from './RazaoPage'
import ProvisoesPage from './ProvisoesPage'

export const PAGE_COMPONENTS: Record<PageId, ComponentType> = {
  home: HomePage,
  'notas-faturamento': NotasFaturamentoPage,
  'excel-prn': ExcelParaPrnPage,
  'importacao-dimob': ImportacaoDimobPage,
  razao: RazaoPage,
  provisoes: ProvisoesPage,
}

export {
  HomePage,
  NotasFaturamentoPage,
  ExcelParaPrnPage,
  ImportacaoDimobPage,
  RazaoPage,
  ProvisoesPage,
}
