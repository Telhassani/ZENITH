import WebSocket from 'ws'
import { getGatewayWs } from './connection'

interface RpcResponse {
  type: 'res'
  id: string
  ok: boolean
  payload?: unknown
  error?: {
    code?: number
    message?: string
  }
}

const pendingRequests = new Map<
  string,
  { resolve: (v: unknown) => void; reject: (e: Error) => void }
>()

let requestIdCounter = 0

export async function rpcCall<T = unknown>(
  method: string,
  params?: Record<string, unknown>
): Promise<T> {
  const ws = getGatewayWs()
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error('OpenClaw Gateway not connected')
  }

  const id = `rpc-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id)
      reject(new Error(`RPC timeout: ${method}`))
    }, 30000)

    pendingRequests.set(id, {
      resolve: (v) => {
        clearTimeout(timeout)
        resolve(v as T)
      },
      reject: (e) => {
        clearTimeout(timeout)
        reject(e)
      },
    })

    ws.send(JSON.stringify({ type: 'req', id, method, params }))
  })
}

export function handleRpcResponse(frame: Record<string, unknown>) {
  const response = frame as unknown as RpcResponse
  const pending = pendingRequests.get(response.id)
  if (!pending) {
    // Handshake response is handled by handshake.ts directly — not an error
    if (response.id !== 'handshake-connect') {
      console.warn(`Unknown RPC response id: ${response.id}`)
    }
    return
  }

  pendingRequests.delete(response.id)

  if (!response.ok) {
    const msg =
      (response.payload as Record<string, unknown>)?.error as string ??
      (response.error?.message) ??
      'RPC call failed'
    pending.reject(new Error(msg))
  } else {
    pending.resolve(response.payload)
  }
}

export { pendingRequests }
