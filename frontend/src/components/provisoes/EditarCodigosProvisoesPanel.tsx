import { useState, type ReactNode } from 'react'
import { ApiError } from '../../api/client'
import { buscarCodigosConsorcio, salvarCodigosConsorcio } from '../../api/codigosProvisoes'
import {
  CODIGOS_LIST_SIZE,
  ORDEM_PROVISAO_LABELS,
  codigosEntryToForm,
  emptyCodigosEntry,
  parseCodigosForm,
  type CodigosConsorcioEntry,
} from '../../types/codigosProvisoes'

type EditarCodigosProvisoesPanelProps = {
  onClose: () => void
}

type CodigoField = keyof CodigosConsorcioEntry

export function EditarCodigosProvisoesPanel({ onClose }: EditarCodigosProvisoesPanelProps) {
  const [codigoConsorcio, setCodigoConsorcio] = useState('')
  const [entry, setEntry] = useState<CodigosConsorcioEntry>(() => emptyCodigosEntry())
  const [loading, setLoading] = useState<'pesquisar' | 'salvar' | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )

  const busy = loading !== null

  function updateCode(field: CodigoField, index: number, value: string) {
    setEntry((current) => {
      const next = codigosEntryToForm(current)
      const parsed = value.trim() === '' ? 0 : Number(value.replace(/\D/g, ''))
      next[field][index] = Number.isFinite(parsed) ? parsed : 0
      return next
    })
  }

  async function handlePesquisar() {
    setFeedback(null)

    if (!codigoConsorcio.trim()) {
      setFeedback({ type: 'error', text: 'Informe o código do consórcio.' })
      return
    }

    setLoading('pesquisar')
    try {
      const result = await buscarCodigosConsorcio(codigoConsorcio.trim())
      if (!result.success || !result.data) {
        setEntry(emptyCodigosEntry())
        setFeedback({
          type: 'error',
          text:
            result.message ??
            'Consórcio não encontrado. Preencha os códigos e salve para criar um novo.',
        })
        return
      }

      setCodigoConsorcio(result.data.codigo)
      setEntry(
        codigosEntryToForm({
          B: result.data.B,
          'B BAIXA': result.data['B BAIXA'],
          C: result.data.C,
          'C BAIXA': result.data['C BAIXA'],
        }),
      )
      setFeedback({ type: 'success', text: 'Códigos encontrados.' })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Falha ao pesquisar códigos do consórcio.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoading(null)
    }
  }

  async function handleSalvar() {
    setFeedback(null)

    if (!codigoConsorcio.trim()) {
      setFeedback({ type: 'error', text: 'Informe o código do consórcio.' })
      return
    }

    let parsedEntry: CodigosConsorcioEntry
    try {
      parsedEntry = parseCodigosForm(entry)
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Verifique os códigos informados.',
      })
      return
    }

    setLoading('salvar')
    try {
      const result = await salvarCodigosConsorcio(codigoConsorcio.trim(), parsedEntry)
      if (!result.success) {
        setFeedback({
          type: 'error',
          text: result.message ?? 'Não foi possível salvar os códigos.',
        })
        return
      }

      if (result.data) {
        setCodigoConsorcio(result.data.codigo)
        setEntry(
          codigosEntryToForm({
            B: result.data.B,
            'B BAIXA': result.data['B BAIXA'],
            C: result.data.C,
            'C BAIXA': result.data['C BAIXA'],
          }),
        )
      }

      setFeedback({
        type: 'success',
        text: result.message ?? 'Códigos salvos com sucesso.',
      })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Falha ao salvar códigos do consórcio.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
        <h1 className="text-center font-display text-3xl font-bold tracking-wide text-accent sm:text-4xl">
          EDITAR CÓDIGOS DE PROVISÕES
        </h1>

        <div className="codigos-provisoes-grid mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-intensity-3 bg-surface/40 p-4 sm:p-5">
          <div className="codigos-provisoes-grid__header">
            <p className="codigos-provisoes-grid__title codigos-provisoes-grid__title--span-2">
              Normal
            </p>
            <p className="codigos-provisoes-grid__title">Ordem</p>
            <p className="codigos-provisoes-grid__title codigos-provisoes-grid__title--span-2">
              Baixa
            </p>
            <span className="codigos-provisoes-grid__subtitle">Coluna B</span>
            <span className="codigos-provisoes-grid__subtitle">Coluna C</span>
            <span className="codigos-provisoes-grid__subtitle codigos-provisoes-grid__subtitle--empty" />
            <span className="codigos-provisoes-grid__subtitle">Coluna B</span>
            <span className="codigos-provisoes-grid__subtitle">Coluna C</span>
          </div>

          <div className="codigos-provisoes-grid__body">
            {Array.from({ length: CODIGOS_LIST_SIZE }, (_, index) => (
              <div key={index} className="codigos-provisoes-grid__row">
                <CodigoInput
                  value={entry.B[index]}
                  disabled={busy}
                  onChange={(value) => updateCode('B', index, value)}
                />
                <CodigoInput
                  value={entry.C[index]}
                  disabled={busy}
                  onChange={(value) => updateCode('C', index, value)}
                />
                <p className="codigos-provisoes-grid__ordem">{ORDEM_PROVISAO_LABELS[index]}</p>
                <CodigoInput
                  value={entry['B BAIXA'][index]}
                  disabled={busy}
                  onChange={(value) => updateCode('B BAIXA', index, value)}
                />
                <CodigoInput
                  value={entry['C BAIXA'][index]}
                  disabled={busy}
                  onChange={(value) => updateCode('C BAIXA', index, value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-6 grid w-full max-w-6xl gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Field label="Código consórcio">
            <input
              type="text"
              value={codigoConsorcio}
              onChange={(event) => setCodigoConsorcio(event.target.value.toUpperCase())}
              placeholder="Ex.: CDHU-9"
              disabled={busy}
              className="editar-cnpj-field uppercase"
            />
          </Field>
          <PanelButton
            label="Pesquisar"
            onClick={handlePesquisar}
            loading={loading === 'pesquisar'}
            disabled={busy && loading !== 'pesquisar'}
          />
          <PanelButton
            label="Salvar"
            onClick={handleSalvar}
            loading={loading === 'salvar'}
            disabled={busy && loading !== 'salvar'}
          />
        </div>

        {feedback && (
          <p
            role="status"
            className={`mx-auto mt-4 w-full max-w-6xl rounded-lg border px-4 py-2 text-center text-sm ${
              feedback.type === 'error'
                ? 'border-red-400/40 bg-red-500/10 text-red-300'
                : 'border-intensity-2 bg-intensity-fill-2 text-accent'
            }`}
          >
            {feedback.text}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-intensity-1 px-4 py-4 sm:px-8">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="mx-auto flex min-h-11 items-center justify-center rounded-xl border border-intensity-3 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Voltar para provisões
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</span>
      {children}
    </label>
  )
}

function CodigoInput({
  value,
  disabled,
  onChange,
}: {
  value: number
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value === 0 ? '' : String(value)}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="codigos-provisoes-input"
    />
  )
}

type PanelButtonProps = {
  label: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

function PanelButton({ label, onClick, loading = false, disabled = false }: PanelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="min-h-12 w-full rounded-2xl border border-intensity-3 px-4 py-3.5 text-center text-sm font-semibold uppercase leading-snug tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[9rem]"
    >
      {loading ? 'Processando...' : label}
    </button>
  )
}
