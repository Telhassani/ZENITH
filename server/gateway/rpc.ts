import WebSocket from 'ws'
import { getGatewayWs } from './connection'

interface RpcResponse {
  type: 'res'
  id: string
  result?: unknown
  error?: {
    code: number
    message: string
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

    const request = {
      type: 'req',
      id,
      method,
      params,
    }

    ws.send(JSON.stringify(request))
  })
}

export function handleRpcResponse(response: RpcResponse) {
  const pending = pendingRequests.get(response.id)
  if (!pending) {
    console.warn(`Unknown RPC response id: ${response.id}`)
    return
  }

  pendingRequests.delete(response.id)

  if (response.error) {
    pending.reject(new Error(response.error.message))
  } else {
    pending.resolve(response.result)
  }
}

export { pendingRequests }
