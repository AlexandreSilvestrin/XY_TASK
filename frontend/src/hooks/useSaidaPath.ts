import { useCallback, useState } from 'react'
import {
  getStoredSaidaPath,
  setStoredSaidaPath,
  type SaidaPersistModule,
} from '../lib/saidaPathStorage'

export function useSaidaPath(module: SaidaPersistModule) {
  const [saida, setSaidaState] = useState(() => getStoredSaidaPath(module))

  const setSaida = useCallback((value: string) => {
    setSaidaState(value)
  }, [])

  /** Salva no estado e no localStorage (seleção de pasta ou blur do campo). */
  const persistSaida = useCallback(
    (path: string) => {
      setSaidaState(path)
      setStoredSaidaPath(module, path)
    },
    [module],
  )

  const commitSaidaOnBlur = useCallback(() => {
    setStoredSaidaPath(module, saida)
  }, [module, saida])

  return { saida, setSaida, persistSaida, commitSaidaOnBlur }
}
