import { useMemo, useState } from 'react'
import {
  exportarBanco,
  geralNotas,
  gerarFaturamento,
  importarBanco,
  pesquisarCnpj,
} from '../api/notas'
import { requestSelect } from '../api/select'
import { ApiError } from '../api/client'
import { usePageOverlay } from '../context/PageOverlayContext'
import type { NotasActionPayload } from '../api/types'
import type { CnpjRow } from '../types/cnpj'
import { EditarCnpjPanel } from '../components/notas/EditarCnpjPanel'
import { FolderPathField } from '../components/notas/FolderPathField'
import { useSaidaPath } from '../hooks/useSaidaPath'
import { MONTHS, buildYearRange } from '../lib/dateOptions'
import { validateEntradaSaida } from '../lib/validatePaths'

const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = buildYearRange(CURRENT_YEAR, 3, 3)

type ActionKey = 'geral_notas' | 'gerar_faturamento'

const ACTIONS: Record<
  ActionKey,
  { label: string; run: (payload: NotasActionPayload) => Promise<unknown> }
> = {
  geral_notas: { label: 'Geral notas', run: geralNotas },
  gerar_faturamento: { label: 'Gerar faturamento', run: gerarFaturamento },
}

const BANK_ACTIONS = [
  { key: 'exportar_banco' as const, label: 'Exportar banco', run: exportarBanco },
  { key: 'importar_banco' as const, label: 'Importar banco', run: importarBanco },
]

function parseCnpjRowsFromResponse(data: unknown): CnpjRow[] {
  if (typeof data !== 'object' || data === null) return []
  const record = data as Record<string, unknown>
  const list = record.data
  if (!Array.isArray(list)) return []

  return list
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const row = item as Record<string, unknown>
      const cnpj = typeof row.cnpj === 'string' ? row.cnpj : String(row.cnpj ?? '')
      const nome = typeof row.nome === 'string' ? row.nome : String(row.nome ?? '')
      if (!cnpj.trim()) return null
      return { cnpj, nome }
    })
    .filter((row): row is CnpjRow => row !== null)
}

const SECONDARY_ACTIONS: ActionKey[] = ['geral_notas', 'gerar_faturamento']

export default function NotasFaturamentoPage() {
  const { openPesquisarCnpj, openAdicionarPorcentagem } = usePageOverlay()
  const [view, setView] = useState<'notas' | 'editar-cnpj'>('notas')
  const [entrada, setEntrada] = useState('')
  const { saida, setSaida, persistSaida, commitSaidaOnBlur } = useSaidaPath('notas')
  const [mes, setMes] = useState(CURRENT_MONTH)
  const [ano, setAno] = useState(CURRENT_YEAR)
  const [loadingSelect, setLoadingSelect] = useState<'entrada' | 'saida' | null>(null)
  const [loadingAction, setLoadingAction] = useState<ActionKey | null>(null)
  const [loadingBankAction, setLoadingBankAction] = useState<
    'exportar_banco' | 'importar_banco' | null
  >(null)
  const [loadingPesquisarCnpj, setLoadingPesquisarCnpj] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )

  const payload = useMemo<NotasActionPayload>(
    () => ({
      module: 'notas',
      entrada,
      saida,
      mes,
      ano,
    }),
    [entrada, saida, mes, ano],
  )

  async function handleSelectFolder(target: 'entrada' | 'saida') {
    setFeedback(null)
    setLoadingSelect(target)
    try {
      const response = await requestSelect({
        type: 'pasta',
        module: 'notas',
        target,
      })
      if (target === 'entrada') setEntrada(response.path)
      else persistSaida(response.path)
      setFeedback({ type: 'success', text: 'Pasta selecionada com sucesso.' })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível abrir o seletor de pasta.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingSelect(null)
    }
  }

  function ensurePathsFilled(): boolean {
    const validation = validateEntradaSaida(entrada, saida)
    if (!validation.ok) {
      setFeedback({ type: 'error', text: validation.message })
      return false
    }
    return true
  }

  async function handleOpenPesquisarCnpj() {
    setFeedback(null)
    if (!ensurePathsFilled()) return

    setLoadingPesquisarCnpj(true)
    try {
      const response = await pesquisarCnpj(payload)
      const rows = parseCnpjRowsFromResponse(response)

      if (rows.length === 0) {
        setFeedback({
          type: 'error',
          text: 'Não há dados para pesquisar.',
        })
        return
      }

      openPesquisarCnpj(rows)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar a lista de CNPJs.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingPesquisarCnpj(false)
    }
  }

  async function handleAction(key: ActionKey) {
    setFeedback(null)
    if (!ensurePathsFilled()) return

    setLoadingAction(key)
    try {
      await ACTIONS[key].run(payload)
      setFeedback({
        type: 'success',
        text: `${ACTIONS[key].label} enviado ao backend.`,
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : `Falha ao executar ${ACTIONS[key].label}.`
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleBankAction(key: 'exportar_banco' | 'importar_banco') {
    setFeedback(null)
    const action = BANK_ACTIONS.find((item) => item.key === key)
    if (!action) return

    setLoadingBankAction(key)
    try {
      const result = await action.run()
      setFeedback({
        type: 'success',
        text: result.message ?? `${action.label} concluído.`,
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : `Falha ao executar ${action.label}.`
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingBankAction(null)
    }
  }

  const busy =
    loadingSelect !== null ||
    loadingAction !== null ||
    loadingBankAction !== null ||
    loadingPesquisarCnpj

  if (view === 'editar-cnpj') {
    return <EditarCnpjPanel onClose={() => setView('notas')} />
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-8 overflow-y-auto py-4 pr-6 sm:pr-10">
        <h1 className="font-display text-5xl font-bold tracking-wide text-accent sm:text-6xl">
          NOTAS
        </h1>

        <div className="flex w-full max-w-3xl flex-col items-center gap-8 lg:max-w-none">
          <FolderPathField
            label="Local dos arquivos"
            value={entrada}
            onChange={setEntrada}
            onSelect={() => handleSelectFolder('entrada')}
            loading={loadingSelect === 'entrada'}
            disabled={busy && loadingSelect !== 'entrada'}
          />

          <div className="flex justify-center gap-5">
            <label className="flex w-32 flex-col gap-1.5 sm:w-36">
              <span className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Mês
              </span>
              <select
                value={mes}
                onChange={(event) => setMes(Number(event.target.value))}
                disabled={busy}
                className="rounded-xl border border-intensity-2 bg-surface/60 px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-intensity-ring disabled:opacity-60"
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex w-32 flex-col gap-1.5 sm:w-36">
              <span className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Ano
              </span>
              <select
                value={ano}
                onChange={(event) => setAno(Number(event.target.value))}
                disabled={busy}
                className="rounded-xl border border-intensity-2 bg-surface/60 px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-intensity-ring disabled:opacity-60"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <FolderPathField
            label="Local para salvar"
            value={saida}
            onChange={setSaida}
            onBlur={commitSaidaOnBlur}
            onSelect={() => handleSelectFolder('saida')}
            loading={loadingSelect === 'saida'}
            disabled={busy && loadingSelect !== 'saida'}
          />
        </div>

        {feedback && (
          <p
            role="status"
            className={`w-full max-w-3xl rounded-lg border px-4 py-2 text-center text-sm lg:max-w-none ${
              feedback.type === 'error'
                ? 'border-red-400/40 bg-red-500/10 text-red-300'
                : 'border-intensity-2 bg-intensity-fill-2 text-accent'
            }`}
          >
            {feedback.text}
          </p>
        )}
      </div>

      <div className="w-px shrink-0 bg-intensity-fill-2" aria-hidden />

      <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto py-4 pl-5 pr-2 sm:w-72 lg:w-80 xl:w-[22rem]">
        <div className="flex flex-col gap-4">
          <ActionButton
            label="Editar CNPJ"
            onClick={() => setView('editar-cnpj')}
            disabled={busy}
          />
          <ActionButton
            label="Pesquisar CNPJ"
            onClick={handleOpenPesquisarCnpj}
            loading={loadingPesquisarCnpj}
            disabled={busy && !loadingPesquisarCnpj}
          />
          {BANK_ACTIONS.map((action) => (
            <ActionButton
              key={action.key}
              label={action.label}
              onClick={() => handleBankAction(action.key)}
              loading={loadingBankAction === action.key}
              disabled={busy && loadingBankAction !== action.key}
            />
          ))}
          <ActionButton
            label="Adicionar porcentagem"
            onClick={openAdicionarPorcentagem}
            disabled={busy}
          />
        </div>

        <div className="mt-2 flex flex-col gap-4 border-t border-intensity-1 pt-6">
          {SECONDARY_ACTIONS.map((key) => (
            <ActionButton
              key={key}
              label={ACTIONS[key].label}
              onClick={() => handleAction(key)}
              loading={loadingAction === key}
              disabled={busy && loadingAction !== key}
            />
          ))}
        </div>
      </aside>
    </div>
  )
}

type ActionButtonProps = {
  label: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

function ActionButton({ label, onClick, loading = false, disabled = false }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="min-h-12 w-full rounded-2xl border border-intensity-3 px-4 py-3.5 text-center text-sm font-semibold uppercase leading-snug tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Processando...' : label}
    </button>
  )
}
