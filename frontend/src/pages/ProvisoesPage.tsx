import { useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import { transformarProvisoes } from '../api/provisoes'
import { requestSelect } from '../api/select'
import type { ProvisoesActionPayload } from '../api/types'
import { PathField } from '../components/shared/PathField'
import { useSaidaPath } from '../hooks/useSaidaPath'
import { validateEntradaSaida } from '../lib/validatePaths'

type SelectLoading = 'entrada-pasta' | 'saida' | null

export default function ProvisoesPage() {
  const [entrada, setEntrada] = useState('')
  const { saida, setSaida, persistSaida, commitSaidaOnBlur } = useSaidaPath('provisoes')
  const [loadingSelect, setLoadingSelect] = useState<SelectLoading>(null)
  const [loadingAction, setLoadingAction] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )

  const payload = useMemo<ProvisoesActionPayload>(
    () => ({
      module: 'provisoes',
      entrada,
      saida,
    }),
    [entrada, saida],
  )

  async function handleSelect(target: 'entrada' | 'saida', loadingKey: SelectLoading) {
    setFeedback(null)
    setLoadingSelect(loadingKey)
    try {
      const response = await requestSelect({
        type: 'pasta',
        module: 'provisoes',
        target,
      })
      if (target === 'entrada') setEntrada(response.path)
      else persistSaida(response.path)
      setFeedback({ type: 'success', text: 'Pasta selecionada com sucesso.' })
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

    setLoadingAction(true)
    try {
      const result = await transformarProvisoes(payload)
      setFeedback({
        type: 'success',
        text: result.message ?? 'Provisões processadas com sucesso.',
      })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Falha ao transformar provisões.'
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
          PROVISÕES
        </h1>

        <div className="flex w-full max-w-3xl flex-col items-center gap-8 lg:max-w-none">
          <PathField
            label="Pasta dos arquivos"
            value={entrada}
            onChange={setEntrada}
            placeholder="Caminho da pasta..."
            disabled={busy && loadingSelect !== 'entrada-pasta'}
            actions={[
              {
                id: 'entrada-pasta',
                label: 'Selecionar pasta',
                loading: loadingSelect === 'entrada-pasta',
                onClick: () => handleSelect('entrada', 'entrada-pasta'),
              },
            ]}
          />

          <PathField
            label="Pasta para salvar"
            value={saida}
            onChange={setSaida}
            onBlur={commitSaidaOnBlur}
            placeholder="Caminho da pasta..."
            disabled={busy && loadingSelect !== 'saida'}
            actions={[
              {
                id: 'saida-pasta',
                label: 'Selecionar pasta',
                loading: loadingSelect === 'saida',
                onClick: () => handleSelect('saida', 'saida'),
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
          label="Transformar provisões"
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
