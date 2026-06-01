import type { LogEntry, LogStatus } from './types'

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (value === undefined || value === null) continue
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  }
  return ''
}

export function normalizeStatus(value: unknown): LogStatus {
  if (typeof value === 'boolean') return value ? 'success' : 'error'
  if (typeof value === 'number') return value >= 400 ? 'error' : 'success'

  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  if (
    normalized === 'success' ||
    normalized === 'ok' ||
    normalized === 'sucesso' ||
    normalized === 'true'
  ) {
    return 'success'
  }

  return 'error'
}

export function parseLogEntry(value: unknown): LogEntry | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      return parseLogEntry(JSON.parse(trimmed))
    } catch {
      return null
    }
  }

  if (typeof value !== 'object' || value === null) return null

  const record = value as Record<string, unknown>

  const module = pickString(record, ['module', 'type', 'modulo', 'Module'])
  const message = pickString(record, ['message', 'msg', 'mensagem', 'Message'])
  const file = pickString(record, ['file', 'filename', 'arquivo', 'File'])
  const status = normalizeStatus(
    record.status ?? record.state ?? record.ok ?? record.success,
  )

  if (!module && !message && !file) return null

  return {
    module: module || '—',
    status,
    file: file || '—',
    message: message || '—',
  }
}

export function normalizeLogsResponse(data: unknown): LogEntry[] {
  if (data === undefined || data === null) return []

  if (typeof data === 'string') {
    try {
      return normalizeLogsResponse(JSON.parse(data))
    } catch {
      return []
    }
  }

  if (Array.isArray(data)) {
    return data.flatMap((item) => normalizeLogsResponse(item))
  }

  if (typeof data === 'object') {
    const record = data as Record<string, unknown>
    const nested = record.log ?? record.data ?? record.payload ?? record.entry
    if (nested !== undefined) {
      return normalizeLogsResponse(nested)
    }

    const list = record.logs ?? record.entries ?? record.items
    if (Array.isArray(list)) {
      return list
        .map(parseLogEntry)
        .filter((entry): entry is LogEntry => entry !== null)
    }
  }

  const single = parseLogEntry(data)
  return single ? [single] : []
}

export function logEntryKey(entry: LogEntry) {
  return `${entry.module}|${entry.status}|${entry.file}|${entry.message}`
}
