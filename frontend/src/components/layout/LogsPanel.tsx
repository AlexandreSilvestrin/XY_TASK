import { useLogs } from '../../context/LogsContext'
import { LogTable } from '../logs/LogTable'

type LogsPanelProps = {
  className?: string
}

export function LogsPanel({ className = '' }: LogsPanelProps) {
  const { entries, isConnected, clearLogs } = useLogs()

  return (
    <section
      className={`flex min-h-0 flex-col border-t border-intensity-2 bg-surface ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-intensity-1 px-5 py-2.5">
        <h2 className="font-display text-xl font-bold text-accent">Logs</h2>
        <div className="flex items-center gap-3">
          <span
            className={`text-[0.65rem] font-medium uppercase tracking-[0.18em] ${
              isConnected ? 'text-muted' : 'text-red-400'
            }`}
          >
            {isConnected ? 'ETL · ao vivo' : 'Backend offline'}
          </span>
          <button
            type="button"
            onClick={clearLogs}
            disabled={entries.length === 0}
            className="rounded-lg border border-intensity-3 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpar logs
          </button>
        </div>
      </div>

      <LogTable entries={entries} />
    </section>
  )
}
