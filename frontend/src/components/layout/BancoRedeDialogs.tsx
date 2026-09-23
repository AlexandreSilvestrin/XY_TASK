import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import {
  cancelarEnvioRede,
  descobrirComputadoresRede,
  iniciarEnvioRede,
  receberBancoRede,
  statusEnvioRede,
  type RedeComputer,
} from '../../api/backup'
import { ConfirmDialog } from '../cnpj/ConfirmDialog'

type Props = {
  sendOpen: boolean
  receiveOpen: boolean
  onCloseSend: () => void
  onCloseReceive: () => void
  onFeedback: (title: string, text: string) => void
}

export function BancoRedeDialogs({
  sendOpen,
  receiveOpen,
  onCloseSend,
  onCloseReceive,
  onFeedback,
}: Props) {
  return (
    <>
      {sendOpen ? (
        <SendDialog onClose={onCloseSend} onFeedback={onFeedback} />
      ) : null}
      {receiveOpen ? (
        <ReceiveDialog onClose={onCloseReceive} onFeedback={onFeedback} />
      ) : null}
    </>
  )
}

function SendDialog({
  onClose,
  onFeedback,
}: {
  onClose: () => void
  onFeedback: (title: string, text: string) => void
}) {
  const [status, setStatus] = useState('waiting')
  const [message, setMessage] = useState('Gerando o banco e aguardando conexão...')
  const [hostname, setHostname] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(true)
  const [canCancel, setCanCancel] = useState(true)

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    async function start() {
      try {
        const result = await iniciarEnvioRede()
        if (cancelled) return
        if (!result.success) {
          onFeedback(
            'Erro ao enviar pela rede',
            result.message ?? 'Não foi possível iniciar o envio.',
          )
          onClose()
          return
        }
        setHostname(result.hostname ?? '')
        setCode(result.code ?? '')
        setStatus(result.status ?? 'waiting')
        setMessage(result.message ?? 'Aguardando outro computador...')
        setBusy(false)
      } catch (error) {
        if (cancelled) return
        onFeedback(
          'Erro ao enviar pela rede',
          error instanceof ApiError
            ? error.message
            : 'Falha ao iniciar o envio pela rede.',
        )
        onClose()
      }
    }

    void start()

    timer = window.setInterval(() => {
      void statusEnvioRede()
        .then((result) => {
          if (cancelled) return
          if (result.hostname) setHostname(result.hostname)
          if (result.code) setCode(result.code)
          if (result.status) setStatus(result.status)
          if (result.message) setMessage(result.message)
          setCanCancel(result.status !== 'transferring')
          if (
            result.status === 'completed' ||
            result.status === 'error' ||
            result.status === 'cancelled'
          ) {
            setBusy(false)
          }
        })
        .catch(() => undefined)
    }, 800)

    return () => {
      cancelled = true
      if (timer) window.clearInterval(timer)
    }
  }, [onClose, onFeedback])

  async function handleCancel() {
    if (!canCancel) return
    try {
      await cancelarEnvioRede()
    } catch {
      /* ignore */
    }
    onClose()
  }

  async function handleOk() {
    try {
      await cancelarEnvioRede()
    } catch {
      /* ignore */
    }
    onClose()
  }

  const finished = status === 'completed' || status === 'error' || status === 'cancelled'
  const statusLabel =
    status === 'transferring'
      ? 'Transferindo...'
      : status === 'completed'
        ? 'Concluído'
        : status === 'error'
          ? 'Erro'
          : 'Aguardando computador'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-rede-title"
        className="w-full max-w-md rounded-2xl border border-intensity-3 bg-surface p-6 shadow-xl"
      >
        <h3 id="send-rede-title" className="text-lg font-bold text-foreground">
          Enviar pela rede
        </h3>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent">
          {busy && !hostname ? 'Preparando...' : statusLabel}
        </p>
        {hostname ? (
          <div className="mt-4 rounded-xl border border-intensity-2 bg-intensity-fill-1 px-4 py-3">
            <p className="text-sm text-muted">Aguardando conexão...</p>
            <p className="mt-2 text-sm text-foreground">
              Computador: <span className="font-semibold">{hostname}</span>
            </p>
            <p className="text-sm text-foreground">
              Código: <span className="font-semibold tracking-widest">{code}</span>
            </p>
          </div>
        ) : null}
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          {finished ? (
            <button
              type="button"
              onClick={() => void handleOk()}
              className="rounded-xl border border-intensity-3 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent hover:bg-intensity-fill-2"
            >
              OK
            </button>
          ) : (
            <button
              type="button"
              disabled={!canCancel}
              onClick={() => void handleCancel()}
              className="rounded-xl border border-intensity-3 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReceiveDialog({
  onClose,
  onFeedback,
}: {
  onClose: () => void
  onFeedback: (title: string, text: string) => void
}) {
  const [searching, setSearching] = useState(true)
  const [receiving, setReceiving] = useState(false)
  const [statusLabel, setStatusLabel] = useState('Procurando computadores...')
  const [message, setMessage] = useState('')
  const [computers, setComputers] = useState<RedeComputer[]>([])
  const [pending, setPending] = useState<RedeComputer | null>(null)

  async function search() {
    setSearching(true)
    setStatusLabel('Procurando computadores...')
    try {
      const result = await descobrirComputadoresRede()
      setComputers(result.computers ?? [])
      setMessage(result.message ?? '')
      setStatusLabel(
        (result.computers?.length ?? 0) > 0
          ? 'Computadores encontrados'
          : 'Nenhum computador encontrado',
      )
    } catch (error) {
      setComputers([])
      setMessage(
        error instanceof ApiError
          ? error.message
          : 'Falha ao procurar computadores na rede.',
      )
      setStatusLabel('Erro')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    void search()
  }, [])

  async function handleReceive(computer: RedeComputer) {
    setPending(null)
    setReceiving(true)
    setStatusLabel('Conectando...')
    setMessage(`Conectando a ${computer.hostname} (${computer.ip})...`)
    try {
      setStatusLabel('Transferindo...')
      const result = await receberBancoRede(computer.ip)
      if (!result.success) {
        setStatusLabel('Erro')
        setMessage(result.message ?? 'Conexão recusada.')
        return
      }
      onFeedback('Banco importado', result.message ?? 'Transferência concluída.')
      onClose()
    } catch (error) {
      setStatusLabel('Erro')
      setMessage(
        error instanceof ApiError
          ? error.message
          : 'Falha ao receber o banco pela rede.',
      )
    } finally {
      setReceiving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recv-rede-title"
          className="w-full max-w-md rounded-2xl border border-intensity-3 bg-surface p-6 shadow-xl"
        >
          <h3 id="recv-rede-title" className="text-lg font-bold text-foreground">
            Receber pela rede
          </h3>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent">
            {statusLabel}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>

          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {computers.map((computer) => (
              <div
                key={`${computer.ip}-${computer.code}`}
                className="rounded-xl border border-intensity-2 px-3 py-3"
              >
                <p className="text-sm font-semibold text-foreground">{computer.hostname}</p>
                <p className="text-xs text-muted">Código: {computer.code || '—'}</p>
                <p className="text-xs text-muted">IP: {computer.ip}</p>
                <button
                  type="button"
                  disabled={searching || receiving}
                  onClick={() => setPending(computer)}
                  className="mt-2 w-full rounded-lg border border-intensity-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-accent hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Receber
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={searching || receiving}
              onClick={onClose}
              className="rounded-xl border border-intensity-3 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={searching || receiving}
              onClick={() => void search()}
              className="rounded-xl border border-intensity-3 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {searching ? 'Procurando...' : 'Atualizar'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Receber banco pela rede?"
        message="Os dados atuais da pasta data serão substituídos pelo banco recebido. Essa ação não pode ser desfeita."
        confirmLabel="Receber"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (pending) void handleReceive(pending)
        }}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
