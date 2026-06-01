import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { ApiError } from '../api/client'
import { pesquisarGuiaPorcentagem, salvarGuiaPorcentagem } from '../api/porcentagem'
import { usePageOverlay } from '../context/PageOverlayContext'
import { formatCnpjInput } from '../lib/cnpjMask'
import {
  RETENCOES_OPTIONS,
  type PorcentagemRow,
  type RetencaoKey,
} from '../types/porcentagem'

function createRow(nome = '', percentual = ''): PorcentagemRow {
  return {
    id: crypto.randomUUID(),
    nome,
    percentual: percentual === '' ? '' : String(percentual),
  }
}

function emptyForm() {
  return {
    cnpj: '',
    contrato: '',
    razaoSocial: '',
    porcentagens: [createRow()],
    retencoes: new Set<RetencaoKey>(),
  }
}

export default function AdicionarPorcentagemPage() {
  const { closeOverlay } = usePageOverlay()
  const titleId = useId()
  const [cnpj, setCnpj] = useState('')
  const [contrato, setContrato] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [porcentagens, setPorcentagens] = useState<PorcentagemRow[]>([createRow()])
  const [retencoes, setRetencoes] = useState<Set<RetencaoKey>>(new Set())
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  )
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState<'pesquisar' | 'salvar' | null>(null)

  const resetForm = useCallback(() => {
    const initial = emptyForm()
    setCnpj(initial.cnpj)
    setContrato(initial.contrato)
    setRazaoSocial(initial.razaoSocial)
    setPorcentagens(initial.porcentagens)
    setRetencoes(initial.retencoes)
    setFeedback(null)
    setSaveSuccessMessage(null)
  }, [])

  useEffect(() => {
    resetForm()
  }, [resetForm])

  function handleSaveSuccessOk() {
    resetForm()
  }

  function addRow() {
    setPorcentagens((rows) => [...rows, createRow()])
  }

  function updateRow(id: string, field: 'nome' | 'percentual', value: string) {
    setPorcentagens((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    )
  }

  function removeRow(id: string) {
    setPorcentagens((rows) => {
      if (rows.length <= 1) return [createRow()]
      return rows.filter((row) => row.id !== id)
    })
  }

  function toggleRetencao(key: RetencaoKey) {
    setRetencoes((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function parsePorcentagemRow(
    row: PorcentagemRow,
  ): { nome: string; percentual: number } | null {
    const nome = row.nome.trim()
    const percentualText = String(row.percentual).trim()
    if (!nome || !percentualText) return null
    const percentual = Number(percentualText.replace(',', '.'))
    if (Number.isNaN(percentual)) return null
    return { nome, percentual }
  }

  function buildPorcentagensPayload(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const row of porcentagens) {
      const parsed = parsePorcentagemRow(row)
      if (!parsed) continue
      result[parsed.nome] = parsed.percentual
    }
    return result
  }

  function validateSalvarForm(): string | null {
    const missing: string[] = []
    if (cnpj.replace(/\D/g, '').length !== 14) missing.push('CNPJ')
    if (!contrato.trim()) missing.push('Contrato')
    if (!razaoSocial.trim()) missing.push('Razão social')

    if (missing.length > 0) {
      return `Preencha todos os campos obrigatórios: ${missing.join(', ')}.`
    }

    let completeRows = 0
    for (const row of porcentagens) {
      const nome = row.nome.trim()
      const percentualText = String(row.percentual).trim()
      const hasNome = nome.length > 0
      const hasPercentual = percentualText.length > 0

      if (!hasNome && !hasPercentual) continue
      if (hasNome && !hasPercentual) continue
      if (!hasNome && hasPercentual) continue

      const percentual = Number(percentualText.replace(',', '.'))
      if (Number.isNaN(percentual)) {
        return 'Informe um percentual válido em todas as linhas da tabela.'
      }

      completeRows += 1
    }

    if (completeRows === 0) {
      return 'Adicione pelo menos uma porcentagem na tabela (Nome e %).'
    }

    return null
  }

  async function handlePesquisar() {
    setFeedback(null)
    if (!cnpj.trim()) {
      setFeedback({ type: 'error', text: 'Informe o CNPJ para pesquisar.' })
      return
    }

    setLoading('pesquisar')
    try {
      const result = await pesquisarGuiaPorcentagem(cnpj)
      if (!result.data) {
        setFeedback({ type: 'error', text: result.message ?? 'CNPJ não encontrado.' })
        return
      }

      setContrato(result.data.contrato ?? '')
      setRazaoSocial(result.data.razao_social ?? '')
      setCnpj(formatCnpjInput(result.data.cnpj ?? cnpj))

      const rows = result.data.porcentagens.map((item) =>
        createRow(item.nome, String(item.percentual)),
      )
      setPorcentagens(rows.length > 0 ? rows : [createRow()])

      const ret = new Set<RetencaoKey>()
      for (const item of result.data.retencoes) {
        const key = item.toUpperCase() as RetencaoKey
        if (RETENCOES_OPTIONS.includes(key)) ret.add(key)
      }
      setRetencoes(ret)

      setFeedback({ type: 'success', text: result.message ?? 'Registro carregado.' })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Falha ao pesquisar CNPJ.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoading(null)
    }
  }

  async function handleSalvar() {
    setFeedback(null)

    const validationError = validateSalvarForm()
    if (validationError) {
      setFeedback({ type: 'error', text: validationError })
      return
    }

    setLoading('salvar')
    try {
      const result = await salvarGuiaPorcentagem({
        contrato: contrato.trim(),
        razao_social: razaoSocial.trim(),
        cnpj: cnpj.trim(),
        porcentagens: buildPorcentagensPayload(),
        retencoes: Array.from(retencoes),
      })
      setSaveSuccessMessage(result.message ?? 'Porcentagem salva com sucesso.')
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Falha ao salvar registro.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setLoading(null)
    }
  }

  const busy = loading !== null

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <h1 className="shrink-0 py-4 text-center font-display text-4xl font-bold tracking-wide text-accent sm:text-5xl">
        PORCENTAGENS
      </h1>

      <div className="flex min-h-0 flex-1 gap-0">
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 pb-4 sm:px-6">
          <div className="porcentagem-page mx-auto w-full max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_minmax(14rem,17rem)] lg:gap-8">
              <section className="flex flex-col gap-5">
                <Field label="CNPJ">
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(event) => setCnpj(formatCnpjInput(event.target.value))}
                    placeholder="00.000.000/0000-00"
                    disabled={busy}
                    className="porcentagem-field"
                  />
                </Field>

                <Field label="Contrato">
                  <input
                    type="text"
                    value={contrato}
                    onChange={(event) => setContrato(event.target.value)}
                    disabled={busy}
                    className="porcentagem-field"
                  />
                </Field>

                <Field label="Razão social">
                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(event) => setRazaoSocial(event.target.value)}
                    disabled={busy}
                    className="porcentagem-field"
                  />
                </Field>

                <fieldset className="flex flex-col gap-3">
                  <legend className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted lg:text-left">
                    Retenções
                  </legend>
                  <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                    {RETENCOES_OPTIONS.map((key) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={retencoes.has(key)}
                          onChange={() => toggleRetencao(key)}
                          disabled={busy}
                          className="h-4 w-4 rounded border-intensity-2 accent-accent"
                        />
                        {key}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-auto grid grid-cols-2 gap-3 pt-2 sm:max-w-sm">
                  <PageActionButton
                    label="Pesquisar"
                    onClick={handlePesquisar}
                    loading={loading === 'pesquisar'}
                    disabled={busy && loading !== 'pesquisar'}
                  />
                  <PageActionButton
                    label="Salvar"
                    onClick={handleSalvar}
                    loading={loading === 'salvar'}
                    disabled={busy && loading !== 'salvar'}
                  />
                </div>
              </section>

              <aside className="flex flex-col gap-3">
                <h2 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Porcentagens
                </h2>

                <div className="porcentagem-panel flex min-h-[14rem] flex-1 flex-col rounded-xl border border-intensity-2 bg-surface/80 p-3 lg:min-h-[18rem]">
                  <div className="mb-2 grid grid-cols-[1fr_5rem_2rem] items-center gap-2 border-b border-intensity-1 pb-2">
                    <span className="text-sm font-semibold text-foreground">Nome</span>
                    <span className="text-center text-sm font-semibold text-foreground">%</span>
                    <button
                      type="button"
                      onClick={addRow}
                      disabled={busy}
                      aria-label="Adicionar linha"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-intensity-2 text-lg font-semibold text-foreground transition-colors hover:bg-intensity-fill-2 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                    {porcentagens.map((row) => (
                      <li
                        key={row.id}
                        className="grid grid-cols-[1fr_5rem_2rem] items-center gap-2"
                      >
                        <input
                          type="text"
                          value={row.nome}
                          onChange={(event) => updateRow(row.id, 'nome', event.target.value)}
                          disabled={busy}
                          placeholder="Nome"
                          className="porcentagem-table-input"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.percentual}
                          onChange={(event) =>
                            updateRow(row.id, 'percentual', event.target.value)
                          }
                          disabled={busy}
                          placeholder="0"
                          className="porcentagem-table-input text-center"
                        />
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={busy}
                          aria-label="Remover linha"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-intensity-fill-1 hover:text-foreground disabled:opacity-40"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={addRow}
                    disabled={busy}
                    className="mt-3 w-full rounded-lg border border-intensity-2 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-intensity-fill-2 disabled:opacity-40"
                  >
                    Adicionar linha
                  </button>
                </div>
              </aside>
            </div>

            {feedback && (
              <p
                role="status"
                className={`mt-4 rounded-lg border px-3 py-2 text-center text-sm ${
                  feedback.type === 'error'
                    ? 'border-red-400/40 bg-red-500/10 text-red-300'
                    : 'border-intensity-2 bg-intensity-fill-2 text-foreground'
                }`}
              >
                {feedback.text}
              </p>
            )}
          </div>
        </div>

        <div className="w-px shrink-0 bg-intensity-fill-2" aria-hidden />

        <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto p-4 sm:w-72 lg:w-80">
          <div className="mt-auto pt-4">
            <SidebarButton
              label="Voltar"
              onClick={closeOverlay}
              disabled={busy}
              variant="muted"
            />
          </div>
        </aside>
      </div>

      {saveSuccessMessage && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-success-title`}
            aria-describedby={`${titleId}-success-message`}
            className="w-full max-w-md rounded-2xl border border-intensity-3 bg-surface-elevated p-6 shadow-2xl shadow-intensity-shadow"
          >
            <h3
              id={`${titleId}-success-title`}
              className="text-center text-lg font-bold text-foreground"
            >
              Sucesso
            </h3>
            <p
              id={`${titleId}-success-message`}
              className="mt-3 text-center text-sm leading-relaxed text-muted"
            >
              {saveSuccessMessage}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleSaveSuccessOk}
                className="min-w-[7rem] rounded-xl border border-intensity-3 bg-intensity-fill-2 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-intensity-fill-3"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted lg:text-left">
        {label}
      </span>
      {children}
    </label>
  )
}

function PageActionButton({
  label,
  onClick,
  loading,
  disabled,
}: {
  label: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="rounded-xl border border-intensity-3 bg-intensity-fill-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-intensity-fill-3 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? '...' : label}
    </button>
  )
}

function SidebarButton({
  label,
  onClick,
  loading = false,
  disabled = false,
  variant = 'default',
}: {
  label: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'default' | 'muted'
}) {
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
