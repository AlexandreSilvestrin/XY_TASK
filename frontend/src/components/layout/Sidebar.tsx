import { useState } from 'react'
import type { NavItem, PageId } from '../../types/navigation'
import { SettingsMenu } from './SettingsMenu'

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'HOME', order: 1 },
  { id: 'notas-faturamento', label: 'NOTAS / FATURAMENTO', order: 2 },
  { id: 'excel-prn', label: 'EXCEL PARA PRN', order: 3 },
  { id: 'razao', label: 'RAZÃO', order: 4 },
  { id: 'importacao-dimob', label: 'IMPORTAÇÃO DIMOB', order: 5 },
]

type SidebarProps = {
  collapsed: boolean
  activePage: PageId
  onToggleCollapse: () => void
  onNavigate: (page: PageId) => void
}

export function Sidebar({
  collapsed,
  activePage,
  onToggleCollapse,
  onNavigate,
}: SidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <aside
      className={`relative z-30 flex h-full shrink-0 flex-col overflow-visible border-r border-intensity-2 bg-surface transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-[4.25rem]' : 'w-64 lg:w-72'
      }`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-intensity-1 px-3 py-4">
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-accent">
              XY Task
            </p>
            <h1 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
              ETL Contábil
            </h1>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-intensity-3 text-accent transition-colors hover:bg-intensity-fill-2 ${
            collapsed ? 'mx-auto' : 'ml-auto'
          }`}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            title={item.label}
            className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold uppercase tracking-wide transition-all ${
              activePage === item.id
                ? 'border border-intensity-3 bg-intensity-fill-3 text-accent shadow-[inset_0_0_20px_-12px] shadow-intensity-shadow'
                : 'border border-transparent text-foreground/80 hover:border-intensity-2 hover:bg-intensity-fill-1 hover:text-accent'
            } ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                activePage === item.id
                  ? 'border-accent bg-intensity-fill-3 text-accent'
                  : 'border-intensity-2 text-accent/80 group-hover:border-intensity-3'
              }`}
            >
              {item.order}
            </span>
            {!collapsed && <span className="leading-tight">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="relative overflow-visible border-t border-intensity-1 p-2">
        <SettingsMenu
          open={settingsOpen}
          collapsed={collapsed}
          onClose={() => setSettingsOpen(false)}
        />

        <button
          type="button"
          onClick={() => setSettingsOpen((open) => !open)}
          aria-expanded={settingsOpen}
          aria-haspopup="menu"
          title="Configurações"
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-intensity-3 px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent transition-all hover:bg-intensity-fill-2 ${
            settingsOpen ? 'bg-intensity-fill-3 shadow-[inset_0_0_16px_-10px] shadow-intensity-shadow' : ''
          } ${collapsed ? 'px-2' : ''}`}
        >
          {collapsed ? (
            <GearIcon />
          ) : (
            <>
              <GearIcon />
              <span>Configurações</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      />
    </svg>
  )
}
