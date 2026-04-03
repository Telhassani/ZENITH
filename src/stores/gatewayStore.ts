import { create } from 'zustand'

interface GatewayState {
  connected: boolean
  gatewayUrl: string
  connectTime: string | null
  error: string | null
  setConnected: (connected: boolean) => void
  setGatewayUrl: (url: string) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useGatewayStore = create<GatewayState>((set) => ({
  connected: false,
  gatewayUrl: '',
  connectTime: null,
  error: null,
  setConnected: (connected) => set({ connected, connectTime: connected ? new Date().toISOString() : null }),
  setGatewayUrl: (gatewayUrl) => set({ gatewayUrl }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
