type AlertDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onClose: () => void
}

export function AlertDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  onClose,
}: AlertDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-intensity-3 bg-surface p-6 shadow-xl"
      >
        <h3 id="alert-title" className="text-lg font-bold text-foreground">
          {title}
        </h3>
        <p className="mt-3 break-words whitespace-pre-line text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">
          {message}
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-intensity-3 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent hover:bg-intensity-fill-2"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
