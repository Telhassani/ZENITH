import { create } from 'zustand'

interface UiState {
  activePanel: string
  setActivePanel: (panel: string) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'dashboard',
  setActivePanel: (activePanel) => set({ activePanel }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
}))
