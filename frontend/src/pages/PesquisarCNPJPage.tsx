import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import {
  iniciarPesquisaCnpj,
  pararPesquisaCnpj,
  salvarCnpj,
} from '../api/cnpjPesquisa'
import { CnpjTable } from '../components/cnpj/CnpjTable'
import { ConfirmDialog } from '../components/cnpj/ConfirmDialog'
import { useAppSocket } from '../context/AppSocketContext'
import { usePageOverlay } from '../context/PageOverlayContext'
import type { CnpjProgressEvent, CnpjRow, CnpjSearchStatus } from '../types/cnpj'
import {
  STATUS_LABELS,
  countFilled,
  isRowFilled,
  rowsForIniciar,
  rowsForSalvar,
} from '../types/cnpj'

type PesquisarCNPJPageProps = {
  initialRows?: CnpjRow[]
}

function emptyRow(): CnpjRow {
  return { cnpj: '', nome: '' }
}

function normalizeInitialRows(rows: CnpjRow[]): CnpjRow[] {
  if (rows.length === 0) return [emptyRow()]
  return rows.map((row) => ({
    cnpj: row.cnpj ?? '',
    nome: row.nome ?? '',
  }))
}

function parseProgressEvent(data: unknown): CnpjProgressEvent | null {
  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  if (
    typeof record.index !== 'number' ||
    typeof record.cnpj !== 'string' ||
    typeof record.nome !== 'string'
  ) {
    return null
  }
  return {
    index: record.index,
    cnpj: record.cnpj,
    nome: record.nome,
  }
}

export default function PesquisarCNPJPage({
  initialRows = [],
}: PesquisarCNPJPageProps) {
  const { closeOverlay } = usePageOverlay()
  const socket = useAppSocket()

  const [rows, setRows] = useState<CnpjRow[]>(() => normalizeInitialRows(initialRows))
  const [status, setStatus] = useState<CnpjSearchStatus>('parado')
  const [researchStarted, setResearchStarted] = useState(false)
  const [lastHighlightIndex, setLastHighlightIndex] = useState<number | null>(null)

  const [loadingIniciar, setLoadingIniciar] = useState(false)
  const [loadingParar, setLoadingParar] = useState(false)
  const [loadingSalvar, setLoadingSalvar] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  const total = rows.length
  const filled = countFilled(rows)
  const progressLabel = `${filled} / ${total}`

  const canSalvar = rowsForSalvar(rows).length > 0 && status !== 'em_andamento'
  const isProcessing = status === 'em_andamento'

  const hasUnsavedChanges = useMemo(() => {
    if (!researchStarted) return false
    return rows.some((row) => row.nome.trim() !== '')
  }, [researchStarted, rows])

  const updateRow = useCallback((index: number, field: keyof CnpjRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )
  }, [])

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow()])
  }, [])

  const removeRow = useCallback((index: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length === 0 ? [emptyRow()] : next
    })
  }, [])

  const applyProgress = useCallback((event: CnpjProgressEvent) => {
    setRows((prev) => {
      if (event.index < 0 || event.index >= prev.length) return prev
      const next = [...prev]
      next[event.index] = {
        cnpj: event.cnpj,
        nome: event.nome,
      }
      return next
    })
    setLastHighlightIndex(event.index)
  }, [])

  useEffect(() => {
    const onProgress = (data: unknown) => {
      const event = parseProgressEvent(data)
      if (!event) return
      applyProgress(event)
    }

    socket.on('cnpj_progress', onProgress)
    return () => {
      socket.off('cnpj_progress', onProgress)
    }
  }, [socket, applyProgress])

  useEffect(() => {
    if (status !== 'em_andamento') return
    if (total === 0) return
    if (filled >= total) {
      setStatus('finalizado')
    }
  }, [filled, total, status])

  async function handleIniciar() {
    if (!rows.some((row) => row.cnpj.trim() !== '')) {
      setFeedback({ type: 'error', text: 'Adicione pelo menos um CNPJ para pesquisar.' })
      return
    }

    const payload = rowsForIniciar(rows)

    setFeedback(null)
    setLoadingIniciar(true)
    try {
      await iniciarPesquisaCnpj({ data: payload })
      setResearchStarted(true)
      setStatus('em_andamento')
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível iniciar a pesquisa.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingIniciar(false)
    }
  }

  async function handleInterromper() {
    setFeedback(null)
    setLoadingParar(true)
    try {
      await pararPesquisaCnpj()
      setStatus('interrompido')
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível interromper a pesquisa.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingParar(false)
    }
  }

  async function handleSalvar() {
    const toSave = rowsForSalvar(rows)
    if (toSave.length === 0) return

    setFeedback(null)
    setLoadingSalvar(true)
    try {
      await salvarCnpj({ data: toSave })
      setRows((prev) => {
        const remaining = prev.filter((row) => !isRowFilled(row))
        return remaining.length === 0 ? [emptyRow()] : remaining
      })
      setFeedback({ type: 'success', text: 'Dados salvos com sucesso.' })
      if (status === 'finalizado' || status === 'interrompido') {
        setStatus('parado')
        setResearchStarted(false)
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Não foi possível salvar os dados.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingSalvar(false)
    }
  }

  function handleCancelar() {
    if (hasUnsavedChanges) {
      setConfirmCancelOpen(true)
      return
    }
    closeOverlay()
  }

  function confirmCancel() {
    setConfirmCancelOpen(false)
    closeOverlay()
  }

  const busy = loadingIniciar || loadingParar || loadingSalvar

  return (
    <>
      <div className="flex h-full min-h-0 w-full flex-col">
        <h1 className="shrink-0 py-4 text-center font-display text-4xl font-bold tracking-wide text-accent sm:text-5xl">
          PESQUISAR CNPJ
        </h1>

        <div className="flex min-h-0 flex-1 gap-0">
          <div className="flex min-w-0 flex-1 flex-col px-4 pb-4 sm:px-6">
            <CnpjTable
              rows={rows}
              onChangeRow={updateRow}
              onAddRow={addRow}
              onRemoveRow={removeRow}
              disabled={isProcessing || busy}
              highlightIndex={lastHighlightIndex}
            />

            {feedback && (
              <p
                role="status"
                className={`mt-3 shrink-0 rounded-lg border px-4 py-2 text-center text-sm ${
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

          <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto p-4 sm:w-72 lg:w-80">
            <SidebarButton
              label="Iniciar pesquisa"
              onClick={handleIniciar}
              loading={loadingIniciar}
              disabled={isProcessing || busy}
            />
            <SidebarButton
              label="Interromper"
              onClick={handleInterromper}
              loading={loadingParar}
              disabled={!isProcessing || busy}
            />

            <div className="rounded-xl border border-intensity-2 bg-surface/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Status
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Status: {STATUS_LABELS[status]}
              </p>
            </div>

            <div className="rounded-xl border border-intensity-2 bg-surface/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Progresso
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Progresso {progressLabel}
              </p>
            </div>

            <SidebarButton
              label="Salvar dados pesquisados"
              onClick={handleSalvar}
              loading={loadingSalvar}
              disabled={!canSalvar || busy}
            />

            <div className="mt-auto pt-4">
              <SidebarButton
                label="Cancelar"
                onClick={handleCancelar}
                disabled={busy}
                variant="muted"
              />
            </div>
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancelOpen}
        title="Cancelar pesquisa"
        message="Tem certeza que deseja cancelar? Os dados pesquisados ainda não foram salvos."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
        onConfirm={confirmCancel}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </>
  )
}

type SidebarButtonProps = {
  label: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'default' | 'muted'
}

function SidebarButton({
  label,
  onClick,
  loading = false,
  disabled = false,
  variant = 'default',
}: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`min-h-12 w-full rounded-2xl border px-4 py-3.5 text-center text-sm font-semibold uppercase leading-snug tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === 'muted'
          ? 'border-intensity-2 text-muted hover:bg-intensity-fill-1'
          : 'border-intensity-3 text-accent hover:bg-intensity-fill-2'
      }`}
    >
      {loading ? 'Processando...' : label}
    </button>
  )
}
