import { EventEmitter } from 'events'
import { handleRpcResponse } from './rpc'

export const gatewayEvents = new EventEmitter()

interface OpenClawEventFrame {
  type: 'event'
  event: string
  payload?: unknown
  id?: string
}

export function handleEvent(frame: unknown) {
  if (typeof frame !== 'object' || frame === null) return

  const f = frame as Record<string, unknown>

  // RPC response
  if (f.type === 'res') {
    handleRpcResponse(f as any)
    return
  }

  // Event frame
  if (f.type === 'event' && typeof f.event === 'string') {
    const eventFrame: OpenClawEventFrame = {
      type: 'event',
      event: f.event,
      payload: f.payload,
      id: f.id as string | undefined,
    }

    // Emit internally for backend processing
    gatewayEvents.emit('gateway:event', eventFrame)

    // Forward to browser relay
    gatewayEvents.emit('browser:relay', eventFrame)
  }
}
