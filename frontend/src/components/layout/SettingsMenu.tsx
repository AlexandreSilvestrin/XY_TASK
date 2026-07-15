import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import { criarBackup, importarBackup } from '../../api/backup'
import { AlertDialog } from '../cnpj/AlertDialog'
import { ConfirmDialog } from '../cnpj/ConfirmDialog'
import {
  useAppSettings,
  type AccentIntensity,
} from '../../context/AppSettingsContext'
import { useLicenses } from '../../context/LicenseContext'

type SettingsMenuProps = {
  open: boolean
  collapsed: boolean
  onClose: () => void
}

type Feedback = {
  title: string
  text: string
}

const INTENSITY_OPTIONS: { level: AccentIntensity; label: string }[] = [
  { level: 1, label: 'Suave' },
  { level: 2, label: 'Médio' },
  { level: 3, label: 'Forte' },
]

export function SettingsMenu({ open, collapsed, onClose }: SettingsMenuProps) {
  const {
    theme,
    fontScale,
    accentIntensity,
    setTheme,
    setAccentIntensity,
    increaseFont,
    decreaseFont,
  } = useAppSettings()
  const { openLicenseModal } = useLicenses()
  const menuRef = useRef<HTMLDivElement>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [busyAction, setBusyAction] = useState<'criar' | 'importar' | null>(null)
  const [confirmImportOpen, setConfirmImportOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (confirmImportOpen || feedback) return
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (feedback) {
          setFeedback(null)
          return
        }
        if (confirmImportOpen) {
          setConfirmImportOpen(false)
          return
        }
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose, confirmImportOpen, feedback])

  useEffect(() => {
    if (!open) setConfirmImportOpen(false)
  }, [open])

  function showFeedback(title: string, text: string) {
    setFeedback({ title, text })
  }

  async function handleCriarBackup() {
    setBusyAction('criar')
    try {
      const result = await criarBackup()
      if (result.cancelled) return
      if (!result.success) {
        showFeedback(
          'Erro ao criar backup',
          result.message ?? 'Não foi possível criar o backup.',
        )
        return
      }
      showFeedback(
        'Backup criado',
        result.message ?? 'Backup criado com sucesso.',
      )
    } catch (error) {
      showFeedback(
        'Erro ao criar backup',
        error instanceof ApiError
          ? error.message
          : 'Falha ao criar o backup.',
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function handleImportarBackup() {
    setConfirmImportOpen(false)
    setBusyAction('importar')
    try {
      const result = await importarBackup()
      if (result.cancelled) return
      if (!result.success) {
        showFeedback(
          'Erro ao importar backup',
          result.message ?? 'Não foi possível importar o backup.',
        )
        return
      }
      showFeedback(
        result.version_mismatch ? 'Backup importado com aviso' : 'Backup importado',
        result.message ?? 'Backup importado com sucesso.',
      )
    } catch (error) {
      showFeedback(
        'Erro ao importar backup',
        error instanceof ApiError
          ? error.message
          : 'Falha ao importar o backup.',
      )
    } finally {
      setBusyAction(null)
    }
  }

  const busy = busyAction !== null

  return (
    <>
      <div
        ref={menuRef}
        className={`absolute bottom-full z-50 mb-2 origin-bottom transition-all duration-300 ease-out ${
          collapsed ? 'left-0 w-64' : 'left-0 right-0'
        } ${
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0'
        }`}
        aria-hidden={!open}
        role="dialog"
        aria-label="Configurações"
      >
        <div className="rounded-xl border border-intensity-3 bg-surface-elevated shadow-lg shadow-intensity-shadow">
          <div className="border-b border-intensity-1 px-3 py-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
              Configurações
            </p>
          </div>

          <div className="flex flex-col gap-2 p-2">
            <section className="rounded-lg px-2 py-1">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Tema
              </p>
              <div className="grid grid-cols-2 gap-2">
                <ThemeButton
                  active={theme === 'dark'}
                  label="Escuro"
                  onClick={() => setTheme('dark')}
                />
                <ThemeButton
                  active={theme === 'light'}
                  label="Claro"
                  onClick={() => setTheme('light')}
                />
              </div>
            </section>

            <section className="rounded-lg px-2 py-1">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Intensidade das cores
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {INTENSITY_OPTIONS.map(({ level, label }) => (
                  <IntensityButton
                    key={level}
                    level={level}
                    label={label}
                    active={accentIntensity === level}
                    onClick={() => setAccentIntensity(level)}
                  />
                ))}
              </div>
              <div
                className="mt-2 flex flex-col gap-1 rounded-md border border-intensity-1 p-2"
                aria-hidden
              >
                <div className="flex gap-1">
                  <span className="h-5 flex-1 rounded-sm bg-canvas" title="Fundo" />
                  <span className="h-5 flex-1 rounded-sm bg-surface" title="Painéis" />
                  <span
                    className="h-5 flex-1 rounded-sm border border-intensity-3 bg-surface-elevated"
                    title="Cards"
                  />
                </div>
                <div className="flex gap-1">
                  <span className="h-4 flex-1 rounded-sm border border-intensity-1 bg-intensity-fill-1" />
                  <span className="h-4 flex-1 rounded-sm border border-intensity-2 bg-intensity-fill-2" />
                  <span className="h-4 flex-1 rounded-sm border border-intensity-3 bg-intensity-fill-3" />
                </div>
              </div>
            </section>

            <section className="rounded-lg px-3 py-2">
              <p className="mb-2 text-sm font-medium text-foreground">Fonte</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decreaseFont}
                  disabled={fontScale <= 0.85}
                  aria-label="Diminuir fonte"
                  className="flex h-9 flex-1 items-center justify-center rounded-lg border border-intensity-2 text-lg font-semibold text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  A−
                </button>
                <span className="min-w-12 text-center text-xs font-medium text-muted">
                  {Math.round(fontScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={increaseFont}
                  disabled={fontScale >= 1.35}
                  aria-label="Aumentar fonte"
                  className="flex h-9 flex-1 items-center justify-center rounded-lg border border-intensity-2 text-lg font-semibold text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  A+
                </button>
              </div>
            </section>

            <section className="rounded-lg px-2 py-1">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Dados
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCriarBackup()}
                  className="flex w-full items-center justify-center rounded-lg border border-intensity-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busyAction === 'criar' ? 'Criando…' : 'Criar backup'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmImportOpen(true)}
                  className="flex w-full items-center justify-center rounded-lg border border-intensity-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busyAction === 'importar' ? 'Importando…' : 'Importar backup'}
                </button>
              </div>
            </section>

            <section className="rounded-lg px-2 py-1">
              <button
                type="button"
                onClick={() => {
                  openLicenseModal()
                  onClose()
                }}
                className="flex w-full items-center justify-center rounded-lg border border-intensity-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2"
              >
                Licença
              </button>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmImportOpen}
        title="Importar backup?"
        message="Os dados atuais da pasta data serão substituídos pelo conteúdo do backup. Essa ação não pode ser desfeita."
        confirmLabel="Importar"
        cancelLabel="Cancelar"
        onConfirm={() => void handleImportarBackup()}
        onCancel={() => setConfirmImportOpen(false)}
      />

      <AlertDialog
        open={feedback !== null}
        title={feedback?.title ?? ''}
        message={feedback?.text ?? ''}
        onClose={() => setFeedback(null)}
      />
    </>
  )
}

function ThemeButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active
          ? 'border-intensity-3 bg-intensity-fill-3 text-accent'
          : 'border-intensity-2 text-foreground hover:bg-intensity-fill-1'
      }`}
    >
      {label}
    </button>
  )
}

function IntensityButton({
  level,
  label,
  active,
  onClick,
}: {
  level: AccentIntensity
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Intensidade ${level}: ${label}`}
      className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-center transition-colors ${
        active
          ? 'border-intensity-3 bg-intensity-fill-3 text-accent'
          : 'border-intensity-2 text-foreground hover:bg-intensity-fill-1'
      }`}
    >
      <span className="text-sm font-bold leading-none">{level}</span>
      <span className="text-[0.6rem] font-semibold uppercase tracking-wide">{label}</span>
    </button>
  )
}
