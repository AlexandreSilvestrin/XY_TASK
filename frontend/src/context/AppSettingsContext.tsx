import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'dark' | 'light'
export type AccentIntensity = 1 | 2 | 3

type AppSettingsContextValue = {
  theme: Theme
  fontScale: number
  accentIntensity: AccentIntensity
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setAccentIntensity: (level: AccentIntensity) => void
  increaseFont: () => void
  decreaseFont: () => void
}

const STORAGE_KEY = 'xy-task-settings'
const MIN_FONT_SCALE = 0.85
const MAX_FONT_SCALE = 1.35
const FONT_STEP = 0.05

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null)

function parseIntensity(value: unknown): AccentIntensity {
  if (value === 1 || value === 3) return value
  return 2
}

function readStoredSettings(): {
  theme: Theme
  fontScale: number
  accentIntensity: AccentIntensity
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { theme: 'dark', fontScale: 1, accentIntensity: 2 }
    const parsed = JSON.parse(raw) as {
      theme?: Theme
      fontScale?: number
      accentIntensity?: unknown
    }
    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      fontScale:
        typeof parsed.fontScale === 'number'
          ? Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, parsed.fontScale))
          : 1,
      accentIntensity: parseIntensity(parsed.accentIntensity),
    }
  } catch {
    return { theme: 'dark', fontScale: 1, accentIntensity: 2 }
  }
}

function applySettingsToDocument(
  theme: Theme,
  fontScale: number,
  accentIntensity: AccentIntensity,
) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.dataset.intensity = String(accentIntensity)
  root.style.setProperty('--font-scale', String(fontScale))
  root.style.fontSize = `${fontScale * 16}px`
}

/** Aplica tema e fonte antes do primeiro render (evita flash). */
export function bootstrapAppSettings() {
  const { theme, fontScale, accentIntensity } = readStoredSettings()
  applySettingsToDocument(theme, fontScale, accentIntensity)
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const initial = readStoredSettings()
  const [theme, setThemeState] = useState<Theme>(() => initial.theme)
  const [fontScale, setFontScale] = useState(() => initial.fontScale)
  const [accentIntensity, setAccentIntensityState] = useState<AccentIntensity>(
    () => initial.accentIntensity,
  )

  useLayoutEffect(() => {
    applySettingsToDocument(theme, fontScale, accentIntensity)
  }, [theme, fontScale, accentIntensity])

  useLayoutEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme, fontScale, accentIntensity }),
    )
  }, [theme, fontScale, accentIntensity])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const setAccentIntensity = useCallback((level: AccentIntensity) => {
    setAccentIntensityState(level)
  }, [])

  const increaseFont = useCallback(() => {
    setFontScale((current) =>
      Math.min(MAX_FONT_SCALE, Number((current + FONT_STEP).toFixed(2))),
    )
  }, [])

  const decreaseFont = useCallback(() => {
    setFontScale((current) =>
      Math.max(MIN_FONT_SCALE, Number((current - FONT_STEP).toFixed(2))),
    )
  }, [])

  const value = useMemo(
    () => ({
      theme,
      fontScale,
      accentIntensity,
      setTheme,
      toggleTheme,
      setAccentIntensity,
      increaseFont,
      decreaseFont,
    }),
    [
      theme,
      fontScale,
      accentIntensity,
      setTheme,
      toggleTheme,
      setAccentIntensity,
      increaseFont,
      decreaseFont,
    ],
  )

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider')
  }
  return context
}
