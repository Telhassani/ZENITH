/**
 * OpenClaw Gateway Protocol v3 type definitions
 */

export interface OpenClawDevice {
  id: string
  name: string
  type: string
  connected: boolean
  lastSeen: string
}

export interface OpenClawAgent {
  id: string
  name: string
  status: 'active' | 'idle' | 'error'
  lane: string
  currentTask?: string
}

export interface OpenClawSession {
  id: string
  agentId: string
  status: 'active' | 'completed'
  messageCount: number
}

export interface OpenClawApproval {
  id: string
  sessionId: string
  tool: string
  args: Record<string, unknown>
  context: string
  createdAt: string
}

export interface OpenClawEvent {
  type: 'event'
  event: string
  payload?: unknown
}

export interface RpcRequest {
  type: 'req'
  id: string
  method: string
  params?: Record<string, unknown>
}

export interface RpcResponse {
  type: 'res'
  id: string
  result?: unknown
  error?: { code: number; message: string }
}
