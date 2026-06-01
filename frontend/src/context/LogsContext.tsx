import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { logEntryKey, normalizeLogsResponse } from '../api/logs'
import type { LogEntry } from '../api/types'
import { useAppSocket } from './AppSocketContext'

const MAX_ENTRIES = 200

type LogsContextValue = {
  entries: LogEntry[]
  isConnected: boolean
  refresh: () => void
  clearLogs: () => void
}

const LogsContext = createContext<LogsContextValue | null>(null)

function mergeEntries(previous: LogEntry[], incoming: LogEntry[]): LogEntry[] {
  if (incoming.length === 0) return previous
  if (incoming.length > 1) return incoming.slice(0, MAX_ENTRIES)

  const latest = incoming[0]
  if (previous[0] && logEntryKey(previous[0]) === logEntryKey(latest)) {
    return previous
  }

  return [latest, ...previous].slice(0, MAX_ENTRIES)
}

export function LogsProvider({ children }: { children: ReactNode }) {
  const socket = useAppSocket()
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [isConnected, setIsConnected] = useState(socket.connected)

  const refresh = useCallback(() => {
    if (!socket.connected) socket.connect()
  }, [socket])

  const clearLogs = useCallback(() => {
    setEntries([])
  }, [])

  useEffect(() => {
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    const onLog = (data: unknown) => {
      const incoming = normalizeLogsResponse(data)
      setEntries((previous) => mergeEntries(previous, incoming))
    }

    setIsConnected(socket.connected)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onDisconnect)
    socket.on('log', onLog)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onDisconnect)
      socket.off('log', onLog)
    }
  }, [socket])

  const value = useMemo(
    () => ({ entries, isConnected, refresh, clearLogs }),
    [entries, isConnected, refresh, clearLogs],
  )

  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>
}

export function useLogs() {
  const context = useContext(LogsContext)
  if (!context) {
    throw new Error('useLogs must be used within LogsProvider')
  }
  return context
}
