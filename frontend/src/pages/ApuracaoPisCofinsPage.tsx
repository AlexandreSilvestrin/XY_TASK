import { useMemo, useState } from 'react'
import { ApiError } from '../api/client'
import { transformarApuracao } from '../api/apuracao'
import { requestSelect } from '../api/select'
import type { ApuracaoActionPayload } from '../api/types'
import { EditarCodigosApuracaoPanel } from '../components/apuracao/EditarCodigosApuracaoPanel'
import { PathField } from '../components/shared/PathField'
import { useSaidaPath } from '../hooks/useSaidaPath'
import { validateEntradaSaida } from '../lib/validatePaths'
import { EMPRESAS_APURACAO, type EmpresaApuracao } from '../types/dadosApuracao'

type SelectLoading = 'entrada-pasta' | 'saida' | null

export default function ApuracaoPisCofinsPage() {
  const [view, setView] = useState<'apuracao' | 'editar-codigos'>('apuracao')
  const [empresa, setEmpresa] = useState<EmpresaApuracao>('LBR')
  const [entrada, setEntrada] = useState('')
  const { saida, setSaida, persistSaida, commitSaidaOnBlur } = useSaidaPath('apuracao-pis-cofins')
  const [data, setData] = useState('')
  const [loadingSelect, setLoadingSelect] = useState<SelectLoading>(null)
  const [loadingAction, setLoadingAction] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )

  const payload = useMemo<ApuracaoActionPayload>(
    () => ({
      module: 'apuracao-pis-cofins',
      entrada,
      saida,
      empresa,
      data,
    }),
    [entrada, saida, empresa, data],
  )

  async function handleSelect(target: 'entrada' | 'saida', loadingKey: SelectLoading) {
    setFeedback(null)
    setLoadingSelect(loadingKey)
    try {
      const response = await requestSelect({
        type: 'pasta',
        module: 'apuracao-pis-cofins',
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

    if (!data.trim()) {
      setFeedback({ type: 'error', text: 'Informe a data de referência (ex.: 31/05/2026).' })
      return
    }

    setLoadingAction(true)
    try {
      const result = await transformarApuracao(payload)
      setFeedback({
        type: 'success',
        text: result.message ?? 'Apuração processada com sucesso.',
      })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Falha ao gerar apuração PIS/COFINS.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoadingAction(false)
    }
  }

  const busy = loadingSelect !== null || loadingAction

  if (view === 'editar-codigos') {
    return <EditarCodigosApuracaoPanel onClose={() => setView('apuracao')} />
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-8 overflow-y-auto py-4 pr-6 sm:pr-10">
        <h1 className="font-display text-center text-4xl font-bold tracking-wide text-accent sm:text-5xl">
          APURAÇÃO PIS / COFINS
        </h1>

        <div className="flex w-full max-w-3xl flex-wrap justify-center gap-2 lg:max-w-none">
          {EMPRESAS_APURACAO.map((item) => (
            <button
              key={item}
              type="button"
              disabled={busy}
              onClick={() => setEmpresa(item)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                empresa === item
                  ? 'border-accent bg-intensity-fill-3 text-accent'
                  : 'border-intensity-3 text-foreground/80 hover:bg-intensity-fill-2'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

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

          <label className="flex w-full flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Data de referência
            </span>
            <input
              type="text"
              value={data}
              onChange={(event) => setData(event.target.value)}
              placeholder="Ex.: 31/05/2026"
              disabled={busy}
              className="editar-cnpj-field"
            />
          </label>
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
        <ActionButton
          label="Editar códigos"
          onClick={() => setView('editar-codigos')}
          disabled={busy}
        />
        <ActionButton
          label="Gerar apuração"
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
