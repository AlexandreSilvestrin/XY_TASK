import { useState, type ReactNode } from 'react'
import { ApiError } from '../../api/client'
import { buscarBancoCnpj, salvarBancoCnpj } from '../../api/cnpjBanco'
import { formatCnpjInput } from '../../lib/cnpjMask'

type EditarCnpjPanelProps = {
  onClose: () => void
}

export function EditarCnpjPanel({ onClose }: EditarCnpjPanelProps) {
  const [cnpj, setCnpj] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState<'pesquisar' | 'salvar' | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )

  const busy = loading !== null

  async function handlePesquisar() {
    setFeedback(null)

    if (cnpj.replace(/\D/g, '').length !== 14) {
      setFeedback({ type: 'error', text: 'Informe um CNPJ válido com 14 dígitos.' })
      return
    }

    setLoading('pesquisar')
    try {
      const result = await buscarBancoCnpj(cnpj)
      if (!result.success || !result.data) {
        setFeedback({
          type: 'error',
          text: result.message ?? 'CNPJ não encontrado no banco.',
        })
        return
      }

      setCnpj(formatCnpjInput(result.data.cnpj))
      setNome(result.data.nome)
      setFeedback({ type: 'success', text: 'CNPJ encontrado no banco.' })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Falha ao pesquisar CNPJ no banco.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoading(null)
    }
  }

  async function handleSalvar() {
    setFeedback(null)

    if (cnpj.replace(/\D/g, '').length !== 14) {
      setFeedback({ type: 'error', text: 'Informe um CNPJ válido com 14 dígitos.' })
      return
    }

    if (!nome.trim()) {
      setFeedback({ type: 'error', text: 'Informe o nome para salvar.' })
      return
    }

    setLoading('salvar')
    try {
      const result = await salvarBancoCnpj(cnpj, nome.trim())
      if (!result.success) {
        setFeedback({
          type: 'error',
          text: result.message ?? 'Não foi possível salvar o CNPJ.',
        })
        return
      }

      if (result.data) {
        setCnpj(formatCnpjInput(result.data.cnpj))
        setNome(result.data.nome)
      }

      setFeedback({
        type: 'success',
        text: result.message ?? 'CNPJ salvo no banco.',
      })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Falha ao salvar CNPJ no banco.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8 sm:px-10">
        <h1 className="font-display text-center text-4xl font-bold tracking-wide text-accent sm:text-5xl">
          EDITAR CNPJ
        </h1>

        <div className="mt-10 w-full max-w-2xl rounded-2xl border border-intensity-3 bg-surface/40 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CNPJ">
              <input
                type="text"
                value={cnpj}
                onChange={(event) => setCnpj(formatCnpjInput(event.target.value))}
                placeholder="00.000.000/0000-00"
                disabled={busy}
                className="editar-cnpj-field"
              />
            </Field>

            <Field label="Nome">
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Razão social"
                disabled={busy}
                className="editar-cnpj-field"
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
        </div>

        {feedback && (
          <p
            role="status"
            className={`mt-6 w-full max-w-2xl rounded-lg border px-4 py-2 text-center text-sm ${
              feedback.type === 'error'
                ? 'border-red-400/40 bg-red-500/10 text-red-300'
                : 'border-intensity-2 bg-intensity-fill-2 text-accent'
            }`}
          >
            {feedback.text}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-intensity-1 px-4 py-4 sm:px-10">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="mx-auto flex min-h-11 items-center justify-center rounded-xl border border-intensity-3 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Voltar para notas
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
      className="min-h-12 w-full rounded-2xl border border-intensity-3 px-4 py-3.5 text-center text-sm font-semibold uppercase leading-snug tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Processando...' : label}
    </button>
  )
}
