import { useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '../../api/client'
import { useHideLogsPanel } from '../../context/LogsPanelVisibilityContext'
import {
  buscarCodigosApuracao,
  listarConsorciosApuracao,
  salvarCodigosApuracao,
} from '../../api/apuracao'
import {
  CODIGOS_APURACAO_FIELDS,
  CODIGOS_APURACAO_LABELS,
  EMPRESAS_APURACAO,
  emptyEmpresaConsorciada,
  parseEmpresasApuracao,
  type CodigosApuracaoEmpresa,
  type EmpresaApuracao,
  type EmpresaConsorciadaApuracao,
} from '../../types/dadosApuracao'

type EditarCodigosApuracaoPanelProps = {
  onClose: () => void
}

export function EditarCodigosApuracaoPanel({ onClose }: EditarCodigosApuracaoPanelProps) {
  useHideLogsPanel()

  const [empresa, setEmpresa] = useState<EmpresaApuracao>('LBR')
  const [consorcio, setConsorcio] = useState('')
  const [empresas, setEmpresas] = useState<EmpresaConsorciadaApuracao[]>([
    emptyEmpresaConsorciada(),
  ])
  const [consorciosCadastrados, setConsorciosCadastrados] = useState<string[]>([])
  const [loading, setLoading] = useState<'pesquisar' | 'salvar' | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )

  const busy = loading !== null

  function resetFormulario() {
    setConsorcio('')
    setEmpresas([emptyEmpresaConsorciada()])
    setFeedback(null)
  }

  function handleSelectEmpresa(item: EmpresaApuracao) {
    setEmpresa(item)
    resetFormulario()
  }

  useEffect(() => {
    let cancelled = false

    listarConsorciosApuracao(empresa)
      .then((result) => {
        if (cancelled) return
        setConsorciosCadastrados(result.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setConsorciosCadastrados([])
      })

    return () => {
      cancelled = true
    }
  }, [empresa])

  function updateEmpresaNome(index: number, value: string) {
    setEmpresas((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, nome: value.toUpperCase() } : item,
      ),
    )
  }

  function updateCodigo(
    index: number,
    field: keyof CodigosApuracaoEmpresa,
    value: string,
  ) {
    setEmpresas((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item
        const parsed = value.trim() === '' ? 0 : Number(value.replace(/\D/g, ''))
        return {
          ...item,
          codigos: {
            ...item.codigos,
            [field]: Number.isFinite(parsed) ? parsed : 0,
          },
        }
      }),
    )
  }

  function moveEmpresa(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= empresas.length) return

    setEmpresas((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  function removeEmpresa(index: number) {
    setEmpresas((current) => {
      if (current.length === 1) return [emptyEmpresaConsorciada()]
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  function addEmpresa() {
    setEmpresas((current) => [...current, emptyEmpresaConsorciada()])
  }

  async function handlePesquisar() {
    setFeedback(null)

    if (!consorcio.trim()) {
      setFeedback({ type: 'error', text: 'Informe o nome do consórcio.' })
      return
    }

    setLoading('pesquisar')
    try {
      const result = await buscarCodigosApuracao(empresa, consorcio.trim())
      if (!result.success || !result.data) {
        setEmpresas([emptyEmpresaConsorciada()])
        setFeedback({
          type: 'error',
          text:
            result.message ??
            'Consórcio não encontrado. Preencha os códigos na ordem correta e salve para criar.',
        })
        return
      }

      setConsorcio(result.data.consorcio)
      setEmpresas(result.data.empresas)
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

    if (!consorcio.trim()) {
      setFeedback({ type: 'error', text: 'Informe o nome do consórcio.' })
      return
    }

    let parsedEmpresas: EmpresaConsorciadaApuracao[]
    try {
      parsedEmpresas = parseEmpresasApuracao(empresas)
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Verifique os códigos informados.',
      })
      return
    }

    setLoading('salvar')
    try {
      const result = await salvarCodigosApuracao(empresa, consorcio.trim(), parsedEmpresas)
      if (!result.success) {
        setFeedback({
          type: 'error',
          text: result.message ?? 'Não foi possível salvar os códigos.',
        })
        return
      }

      if (result.data) {
        setConsorcio(result.data.consorcio)
        setEmpresas(result.data.empresas)
      }

      const lista = await listarConsorciosApuracao(empresa)
      setConsorciosCadastrados(lista.data ?? [])

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
          EDITAR CÓDIGOS DE APURAÇÃO
        </h1>

        <p className="mx-auto mt-4 max-w-4xl text-center text-sm leading-relaxed text-muted">
          Selecione a empresa, informe o consórcio e cadastre as empresas consorciadas na{' '}
          <strong className="text-accent">ordem exata</strong> em que aparecem na planilha de
          apuração. A primeira empresa corresponde ao PIS_1 / COFINS_1, a segunda ao PIS_2 /
          COFINS_2, e assim por diante.
        </p>

        <div className="mx-auto mt-6 flex w-full max-w-4xl flex-wrap justify-center gap-2">
          {EMPRESAS_APURACAO.map((item) => (
            <button
              key={item}
              type="button"
              disabled={busy}
              onClick={() => handleSelectEmpresa(item)}
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

        <div className="codigos-apuracao-grid mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-intensity-3 bg-surface/40 p-4 sm:p-5">
          <div className="codigos-apuracao-grid__header">
            <span className="codigos-apuracao-grid__subtitle">Ordem</span>
            <span className="codigos-apuracao-grid__subtitle codigos-apuracao-grid__subtitle--wide">
              Empresa
            </span>
            {CODIGOS_APURACAO_FIELDS.map((field) => (
              <span key={field} className="codigos-apuracao-grid__subtitle">
                {CODIGOS_APURACAO_LABELS[field]}
              </span>
            ))}
            <span className="codigos-apuracao-grid__subtitle codigos-apuracao-grid__subtitle--actions" />
          </div>

          <div className="codigos-apuracao-grid__body">
            {empresas.map((item, index) => (
              <div key={index} className="codigos-apuracao-grid__row">
                <p className="codigos-apuracao-grid__ordem">{index + 1}</p>
                <input
                  type="text"
                  value={item.nome}
                  onChange={(event) => updateEmpresaNome(index, event.target.value)}
                  disabled={busy}
                  placeholder="Ex.: LBR"
                  className="codigos-apuracao-input codigos-apuracao-input--wide uppercase"
                />
                {CODIGOS_APURACAO_FIELDS.map((field) => (
                  <input
                    key={field}
                    type="text"
                    inputMode="numeric"
                    value={item.codigos[field] === 0 ? '' : String(item.codigos[field])}
                    onChange={(event) => updateCodigo(index, field, event.target.value)}
                    disabled={busy}
                    className="codigos-apuracao-input"
                  />
                ))}
                <div className="codigos-apuracao-grid__actions">
                  <IconButton
                    label="Subir"
                    disabled={busy || index === 0}
                    onClick={() => moveEmpresa(index, -1)}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    label="Descer"
                    disabled={busy || index === empresas.length - 1}
                    onClick={() => moveEmpresa(index, 1)}
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    label="Remover"
                    disabled={busy}
                    onClick={() => removeEmpresa(index)}
                  >
                    ×
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-4 flex w-full max-w-6xl justify-end">
          <PanelButton
            label="Adicionar empresa"
            onClick={addEmpresa}
            disabled={busy}
          />
        </div>

        <div className="mx-auto mt-6 grid w-full max-w-6xl gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Field label="Nome do consórcio">
            <input
              type="text"
              list="consorcios-apuracao"
              value={consorcio}
              onChange={(event) => setConsorcio(event.target.value.toUpperCase())}
              placeholder="Ex.: ASSESSOR CE"
              disabled={busy}
              className="editar-cnpj-field uppercase"
            />
            <datalist id="consorcios-apuracao">
              {consorciosCadastrados.map((nome) => (
                <option key={nome} value={nome} />
              ))}
            </datalist>
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
          Voltar para apuração
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

function IconButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string
  children: ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-intensity-3 text-sm font-bold text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
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
