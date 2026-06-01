import { useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import { transformarRazao } from '../api/razao'
import { requestSelect } from '../api/select'
import type { RazaoActionPayload, RazaoModo } from '../api/types'
import { PathField } from '../components/shared/PathField'
import { useSaidaPath } from '../hooks/useSaidaPath'
import { validateEntradaSaida } from '../lib/validatePaths'

type SelectLoading = 'entrada-pasta' | 'entrada-arquivo' | 'saida' | null

type ContraRow = {
  id: string
  valor: string
}

function createContraRow(valor = ''): ContraRow {
  return { id: crypto.randomUUID(), valor }
}

function parseContrasPayload(rows: ContraRow[]): number[] {
  const result: number[] = []
  for (const row of rows) {
    const text = row.valor.trim().replace(',', '.')
    if (!text) continue
    const num = Number(text)
    if (Number.isNaN(num)) continue
    result.push(num)
  }
  return result
}

function validateDfcContras(rows: ContraRow[]): string | null {
  let validCount = 0
  for (const row of rows) {
    const text = row.valor.trim()
    if (!text) continue
    const num = Number(text.replace(',', '.'))
    if (Number.isNaN(num)) {
      return 'Informe apenas valores numéricos nas contrapartidas.'
    }
    validCount += 1
  }
  if (validCount === 0) {
    return 'Adicione pelo menos uma contrapartida numérica para o modo DFC.'
  }
  return null
}

export default function RazaoPage() {
  const [entrada, setEntrada] = useState('')
  const { saida, setSaida, persistSaida, commitSaidaOnBlur } = useSaidaPath('razao')
  const [modo, setModo] = useState<RazaoModo>('resumo')
  const [contraRows, setContraRows] = useState<ContraRow[]>([createContraRow()])
  const [loadingSelect, setLoadingSelect] = useState<SelectLoading>(null)
  const [loadingAction, setLoadingAction] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )

  const payload = useMemo<RazaoActionPayload>(() => {
    const base: RazaoActionPayload = {
      module: 'razao',
      entrada,
      saida,
      modo,
    }
    if (modo === 'dfc') {
      base.contras = parseContrasPayload(contraRows)
    }
    return base
  }, [entrada, saida, modo, contraRows])

  function addContraRow() {
    setContraRows((rows) => [...rows, createContraRow()])
  }

  function updateContraRow(id: string, valor: string) {
    setContraRows((rows) => rows.map((row) => (row.id === id ? { ...row, valor } : row)))
  }

  function removeContraRow(id: string) {
    setContraRows((rows) => {
      if (rows.length <= 1) return [createContraRow()]
      return rows.filter((row) => row.id !== id)
    })
  }

  async function handleSelect(
    target: 'entrada' | 'saida',
    type: 'pasta' | 'arquivos',
    loadingKey: SelectLoading,
  ) {
    setFeedback(null)
    setLoadingSelect(loadingKey)
    try {
      const response = await requestSelect({
        type,
        module: 'razao',
        target,
      })
      if (target === 'entrada') setEntrada(response.path)
      else persistSaida(response.path)
      setFeedback({
        type: 'success',
        text:
          type === 'pasta' ? 'Pasta selecionada com sucesso.' : 'Arquivo selecionado com sucesso.',
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível abrir o seletor.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingSelect(null)
    }
  }

  async function handleTransformar() {
    setFeedback(null)

    const validation = validateEntradaSaida(entrada, saida)
    if (!validation.ok) {
      setFeedback({ type: 'error', text: validation.message })
      return
    }

    if (modo === 'dfc') {
      const dfcError = validateDfcContras(contraRows)
      if (dfcError) {
        setFeedback({ type: 'error', text: dfcError })
        return
      }
    }

    setLoadingAction(true)
    try {
      const result = await transformarRazao(payload)
      setFeedback({
        type: 'success',
        text: result.message ?? 'Transformação concluída com sucesso.',
      })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Falha ao transformar razão.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingAction(false)
    }
  }

  const busy = loadingSelect !== null || loadingAction

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-8 overflow-y-auto py-4 pr-6 sm:pr-10">
        <h1 className="font-display text-center text-4xl font-bold tracking-wide text-accent sm:text-5xl">
          TRANSFORMAR RAZÃO
        </h1>

        <div className="flex w-full max-w-3xl flex-col items-center gap-8 lg:max-w-none">
          <div className="w-full">
            <PathField
              label="Selecionar arquivo/pasta"
              value={entrada}
              onChange={setEntrada}
              placeholder="Caminho da pasta ou arquivo .txt..."
              disabled={busy && !loadingSelect?.startsWith('entrada')}
              actions={[
                {
                  id: 'entrada-pasta',
                  label: 'Selecionar pasta',
                  loading: loadingSelect === 'entrada-pasta',
                  onClick: () => handleSelect('entrada', 'pasta', 'entrada-pasta'),
                },
                {
                  id: 'entrada-arquivo',
                  label: 'Selecionar arq',
                  loading: loadingSelect === 'entrada-arquivo',
                  onClick: () => handleSelect('entrada', 'arquivos', 'entrada-arquivo'),
                },
              ]}
            />

            <fieldset className="mt-4 flex justify-center gap-8">
              <legend className="sr-only">Tipo de transformação</legend>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                <input
                  type="radio"
                  name="razao-modo"
                  value="resumo"
                  checked={modo === 'resumo'}
                  onChange={() => setModo('resumo')}
                  disabled={busy}
                  className="h-4 w-4 accent-accent"
                />
                Resumo
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                <input
                  type="radio"
                  name="razao-modo"
                  value="dfc"
                  checked={modo === 'dfc'}
                  onChange={() => setModo('dfc')}
                  disabled={busy}
                  className="h-4 w-4 accent-accent"
                />
                DFC
              </label>
            </fieldset>

            {modo === 'dfc' && (
              <div className="mt-6 w-full">
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Contrapartidas (DFC)
                </p>
                <div className="porcentagem-panel mx-auto max-w-md rounded-xl border border-intensity-2 bg-surface/80 p-3">
                  <div className="mb-2 grid grid-cols-[1fr_2rem] items-center gap-2 border-b border-intensity-1 pb-2">
                    <span className="text-sm font-semibold text-foreground">Conta</span>
                    <button
                      type="button"
                      onClick={addContraRow}
                      disabled={busy}
                      aria-label="Adicionar contrapartida"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-intensity-2 text-lg font-semibold text-foreground transition-colors hover:bg-intensity-fill-2 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                    {contraRows.map((row) => (
                      <li key={row.id} className="grid grid-cols-[1fr_2rem] items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.valor}
                          onChange={(event) => updateContraRow(row.id, event.target.value)}
                          disabled={busy}
                          placeholder="Ex.: 1234"
                          className="porcentagem-table-input"
                        />
                        <button
                          type="button"
                          onClick={() => removeContraRow(row.id)}
                          disabled={busy}
                          aria-label="Remover contrapartida"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-intensity-fill-1 hover:text-foreground disabled:opacity-40"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={addContraRow}
                    disabled={busy}
                    className="mt-3 w-full rounded-lg border border-intensity-2 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-intensity-fill-2 disabled:opacity-40"
                  >
                    Adicionar número
                  </button>
                </div>
              </div>
            )}
          </div>

          <PathField
            label="Local para salvar"
            value={saida}
            onChange={setSaida}
            onBlur={commitSaidaOnBlur}
            placeholder="Caminho da pasta..."
            disabled={busy && loadingSelect !== 'saida'}
            actions={[
              {
                id: 'saida-pasta',
                label: 'Selecionar local',
                loading: loadingSelect === 'saida',
                onClick: () => handleSelect('saida', 'pasta', 'saida'),
              },
            ]}
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

      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto py-4 pl-5 pr-2 sm:w-72 lg:w-80 xl:w-[22rem]">
        <ActionButton
          label="Transformar razão"
          onClick={handleTransformar}
          loading={loadingAction}
          disabled={busy && !loadingAction}
        />
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
