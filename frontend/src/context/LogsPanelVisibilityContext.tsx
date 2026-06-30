import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type LogsPanelVisibilityContextValue = {
  isHidden: boolean
  registerHidden: () => () => void
}

const LogsPanelVisibilityContext = createContext<LogsPanelVisibilityContextValue | null>(null)

export function LogsPanelVisibilityProvider({ children }: { children: ReactNode }) {
  const [hiddenCount, setHiddenCount] = useState(0)

  const registerHidden = useCallback(() => {
    setHiddenCount((current) => current + 1)
    return () => setHiddenCount((current) => Math.max(0, current - 1))
  }, [])

  const value = useMemo(
    () => ({
      isHidden: hiddenCount > 0,
      registerHidden,
    }),
    [hiddenCount, registerHidden],
  )

  return (
    <LogsPanelVisibilityContext.Provider value={value}>
      {children}
    </LogsPanelVisibilityContext.Provider>
  )
}

export function useLogsPanelVisibility() {
  const context = useContext(LogsPanelVisibilityContext)
  if (!context) {
    throw new Error('useLogsPanelVisibility must be used within LogsPanelVisibilityProvider')
  }
  return context
}

export function useHideLogsPanel() {
  const { registerHidden } = useLogsPanelVisibility()

  useEffect(() => registerHidden(), [registerHidden])
}
