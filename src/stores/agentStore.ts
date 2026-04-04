import { create } from 'zustand'

export type AgentRole = 'orchestrator' | 'sub-agent' | 'specialist' | 'monitor'

export interface AgentState {
  id: string
  name: string
  role: AgentRole
  status: 'active' | 'idle' | 'error'
  lane?: string
  currentTask?: string
  stats?: {
    totalTasks: number
    successRate: number
    avgDuration: number
  }
}

interface AgentStoreState {
  agents: AgentState[]
  setAgents: (agents: AgentState[]) => void
  updateAgent: (id: string, updates: Partial<AgentState>) => void
  getAgent: (id: string) => AgentState | undefined
  getOrchestrators: () => AgentState[]
  getActiveAgents: () => AgentState[]
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  agents: [],
  setAgents: (agents) => set({ agents }),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  getAgent: (id) => get().agents.find((a) => a.id === id),
  getOrchestrators: () => get().agents.filter((a) => a.role === 'orchestrator'),
  getActiveAgents: () => get().agents.filter((a) => a.status === 'active'),
}))
