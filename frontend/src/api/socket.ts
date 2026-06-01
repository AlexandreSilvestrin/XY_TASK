import { io, type Socket } from 'socket.io-client'

export function getSocketUrl(): string {
  const fromEnv = import.meta.env.VITE_SOCKET_URL
  if (fromEnv) return fromEnv
  if (import.meta.env.DEV) return window.location.origin
  return 'http://127.0.0.1:5000'
}

export function createAppSocket(): Socket {
  return io(getSocketUrl(), {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })
}
