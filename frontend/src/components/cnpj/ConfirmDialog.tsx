type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl border border-intensity-3 bg-surface p-6 shadow-xl"
      >
        <h3 id="confirm-title" className="text-lg font-bold text-foreground">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-intensity-3 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent hover:bg-intensity-fill-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-red-400/50 bg-red-950/40 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-red-200 hover:bg-red-950/60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
