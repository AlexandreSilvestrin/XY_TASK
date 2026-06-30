import { useEffect, useState } from 'react'
import {
  LICENSED_PAGE_IDS,
  LICENSE_FIELD_LABELS,
  emptyStoredLicenses,
  type LicensedPageId,
  type StoredLicenses,
} from '../../lib/licenses'
import { useLicenses } from '../../context/LicenseContext'

export function LicenseModal() {
  const {
    licenseModalOpen,
    closeLicenseModal,
    storedLicenses,
    activateLicenses,
  } = useLicenses()

  const [draft, setDraft] = useState<StoredLicenses>(() => emptyStoredLicenses())
  const [visible, setVisible] = useState<Record<LicensedPageId, boolean>>(() =>
    emptyVisibility(),
  )
  const [errors, setErrors] = useState<Partial<Record<LicensedPageId, string>>>({})

  useEffect(() => {
    if (!licenseModalOpen) return

    setDraft({ ...storedLicenses })
    setVisible(emptyVisibility())
    setErrors({})
  }, [licenseModalOpen, storedLicenses])

  useEffect(() => {
    if (!licenseModalOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLicenseModal()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [licenseModalOpen, closeLicenseModal])

  if (!licenseModalOpen) return null

  const handleActivate = () => {
    const result = activateLicenses(draft)

    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    setErrors({})
    closeLicenseModal()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeLicenseModal()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="license-modal-title"
        className="w-full max-w-lg rounded-2xl border border-intensity-3 bg-surface p-6 shadow-xl"
      >
        <h2
          id="license-modal-title"
          className="text-center text-lg font-bold uppercase tracking-wide text-accent"
        >
          Licença
        </h2>

        <div className="mt-6 flex flex-col gap-4">
          {LICENSED_PAGE_IDS.map((pageId) => (
            <LicenseField
              key={pageId}
              label={LICENSE_FIELD_LABELS[pageId]}
              value={draft[pageId]}
              error={errors[pageId]}
              visible={visible[pageId]}
              onToggleVisible={() =>
                setVisible((current) => ({ ...current, [pageId]: !current[pageId] }))
              }
              onChange={(value) => {
                setDraft((current) => ({ ...current, [pageId]: value }))
                if (errors[pageId]) {
                  setErrors((current) => {
                    const next = { ...current }
                    delete next[pageId]
                    return next
                  })
                }
              }}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeLicenseModal}
            className="rounded-xl border border-intensity-3 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleActivate}
            className="rounded-xl border border-intensity-3 bg-intensity-fill-3 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2"
          >
            Ativar
          </button>
        </div>
      </div>
    </div>
  )
}

type LicenseFieldProps = {
  label: string
  value: string
  error?: string
  visible: boolean
  onToggleVisible: () => void
  onChange: (value: string) => void
}

function LicenseField({
  label,
  value,
  error,
  visible,
  onToggleVisible,
  onChange,
}: LicenseFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <label className="w-36 shrink-0 text-sm font-semibold uppercase tracking-wide text-accent">
          {label}:
        </label>
        <div className="relative min-w-0 flex-1">
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="****"
            className={`w-full rounded-xl border bg-surface-elevated py-2.5 pl-3 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-2 focus:ring-intensity-ring ${
              error ? 'border-red-400/60' : 'border-intensity-3'
            }`}
          />
          <button
            type="button"
            onClick={onToggleVisible}
            aria-label={visible ? 'Ocultar licença' : 'Mostrar licença'}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-intensity-fill-2 hover:text-accent"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>
      {error ? <p className="pl-[9.75rem] text-xs text-red-300">{error}</p> : null}
    </div>
  )
}

function emptyVisibility(): Record<LicensedPageId, boolean> {
  return {
    'notas-faturamento': false,
    'excel-prn': false,
    razao: false,
    'importacao-dimob': false,
    provisoes: false,
    'apuracao-pis-cofins': false,
  }
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1 1 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.01 9.963 7.178a1 1 0 010 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.01-9.964-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c1.907 0 3.708-.417 5.302-1.165M6.228 6.228A10.45 10.45 0 0112 4.5c4.638 0 8.573 3.01 9.963 7.178a10.523 10.523 0 01-4.293 4.925M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}
