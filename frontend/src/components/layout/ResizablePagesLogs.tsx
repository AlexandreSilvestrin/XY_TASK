import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { LogsPanel } from './LogsPanel'

const STORAGE_KEY = 'xy-task-logs-height'
const DEFAULT_LOGS_HEIGHT = 160
const MIN_LOGS_HEIGHT = 72
const MIN_PAGES_HEIGHT = 160

function readStoredHeight(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_LOGS_HEIGHT
    const value = Number(raw)
    return Number.isFinite(value) ? value : DEFAULT_LOGS_HEIGHT
  } catch {
    return DEFAULT_LOGS_HEIGHT
  }
}

type ResizablePagesLogsProps = {
  children: ReactNode
  showLogs?: boolean
}

export function ResizablePagesLogs({ children, showLogs = true }: ResizablePagesLogsProps) {
  const [logsHeight, setLogsHeight] = useState(readStoredHeight)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const clampLogsHeight = useCallback((next: number) => {
    const container = containerRef.current
    if (!container) return next

    const max = Math.max(
      MIN_LOGS_HEIGHT,
      container.clientHeight - MIN_PAGES_HEIGHT - 8,
    )
    return Math.min(max, Math.max(MIN_LOGS_HEIGHT, next))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(logsHeight))
  }, [logsHeight])

  useEffect(() => {
    const handleResize = () => {
      setLogsHeight((current) => clampLogsHeight(current))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [clampLogsHeight])

  const startDrag = useCallback(
    (clientY: number) => {
      const container = containerRef.current
      if (!container) return

      draggingRef.current = true
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'

      const rect = container.getBoundingClientRect()
      const next = rect.bottom - clientY
      setLogsHeight(clampLogsHeight(next))
    },
    [clampLogsHeight],
  )

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return
      startDrag(event.clientY)
    }

    const stopDrag = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDrag)
      window.removeEventListener('pointercancel', stopDrag)
    }
  }, [startDrag])

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
        {showLogs ? (
          <div className="shrink-0 border-b border-intensity-1 px-5 py-3">
            <h2 className="font-display text-xl font-bold text-accent">Pages</h2>
          </div>
        ) : null}
        <div
          className={
            showLogs
              ? 'min-h-0 flex-1 overflow-auto px-6 py-6 sm:px-10 lg:px-14'
              : 'min-h-0 flex-1 overflow-auto'
          }
        >
          {children}
        </div>
      </main>

      {showLogs ? (
        <>
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-valuenow={logsHeight}
            aria-label="Redimensionar área de logs"
            onPointerDown={(event) => {
              event.preventDefault()
              ;(event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId)
              startDrag(event.clientY)
            }}
            className="group relative z-10 h-2 shrink-0 cursor-row-resize touch-none"
          >
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-intensity-fill-2 transition-colors group-hover:bg-intensity-fill-3 group-active:bg-accent" />
            <div className="absolute left-1/2 top-1/2 h-1 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-intensity-fill-2 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <div
            className="shrink-0 overflow-hidden"
            style={{ height: logsHeight }}
          >
            <LogsPanel className="h-full" />
          </div>
        </>
      ) : null}
    </div>
  )
}
