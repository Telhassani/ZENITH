import { create } from 'zustand'

type CommandTab = 'projects' | 'agents' | 'spawn'

interface UiState {
  activePanel: string
  setActivePanel: (panel: string) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  commandDrawerOpen: boolean
  commandDrawerTab: CommandTab
  openCommandDrawer: (tab?: CommandTab) => void
  closeCommandDrawer: () => void
  setCommandDrawerTab: (tab: CommandTab) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'dashboard',
  setActivePanel: (activePanel) => set({ activePanel }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  commandDrawerOpen: false,
  commandDrawerTab: 'projects',
  openCommandDrawer: (tab = 'projects') => set({ commandDrawerOpen: true, commandDrawerTab: tab }),
  closeCommandDrawer: () => set({ commandDrawerOpen: false }),
  setCommandDrawerTab: (commandDrawerTab) => set({ commandDrawerTab }),
}))
