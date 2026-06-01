import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { createAppSocket } from '../api/socket'
import type { Socket } from 'socket.io-client'

const AppSocketContext = createContext<Socket | null>(null)

export function AppSocketProvider({ children }: { children: ReactNode }) {
  const [socket] = useState(() => createAppSocket())

  useEffect(() => {
    if (!socket.connected) socket.connect()
    return () => {
      socket.disconnect()
    }
  }, [socket])

  return (
    <AppSocketContext.Provider value={socket}>{children}</AppSocketContext.Provider>
  )
}

export function useAppSocket() {
  const socket = useContext(AppSocketContext)
  if (!socket) {
    throw new Error('useAppSocket must be used within AppSocketProvider')
  }
  return socket
}
