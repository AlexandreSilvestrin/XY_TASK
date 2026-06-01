export type PathFieldAction = {
  id: string
  label: string
  onClick: () => void
  loading?: boolean
}

type PathFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  actions: PathFieldAction[]
  placeholder?: string
  onBlur?: () => void
  disabled?: boolean
}

export function PathField({
  label,
  value,
  onChange,
  actions,
  placeholder = 'Caminho...',
  onBlur,
  disabled = false,
}: PathFieldProps) {
  return (
    <div className="w-full">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-0 flex-1 rounded-xl border border-intensity-2 bg-surface/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-intensity-ring disabled:opacity-60"
        />
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              disabled={disabled || action.loading}
              className="rounded-xl border border-intensity-3 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-50 sm:whitespace-nowrap"
            >
              {action.loading ? 'Abrindo...' : action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
