type FolderPathFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: () => void
  onBlur?: () => void
  disabled?: boolean
  loading?: boolean
}

export function FolderPathField({
  label,
  value,
  onChange,
  onSelect,
  onBlur,
  disabled = false,
  loading = false,
}: FolderPathFieldProps) {
  return (
    <div className="w-full">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="Caminho da pasta..."
          disabled={disabled}
          className="min-w-0 flex-1 rounded-xl border border-intensity-2 bg-surface/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-intensity-ring disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSelect}
          disabled={disabled || loading}
          className="shrink-0 rounded-xl border border-intensity-3 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Abrindo...' : 'Selecionar pasta'}
        </button>
      </div>
    </div>
  )
}
