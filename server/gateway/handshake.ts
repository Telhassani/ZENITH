import WebSocket from 'ws'
import { env } from '../config'

export async function handleHandshake(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        ws.removeListener('message', handleMessage)
        reject(new Error('Handshake timeout'))
      }
    }, 10000)

    const handleMessage = (data: WebSocket.Data) => {
      try {
        const frame = JSON.parse(data.toString()) as Record<string, unknown>

        // Step 1: Challenge received — send connect request
        if (frame.type === 'event' && frame.event === 'connect.challenge') {
          const connectRequest = {
            type: 'req',
            id: 'handshake-connect',
            method: 'connect',
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              role: 'operator',
              scopes: ['operator.read', 'operator.write', 'operator.admin'],
              auth: { token: env.OPENCLAW_GATEWAY_TOKEN },
              client: {
                id: 'openclaw-control-ui',
                version: '1.0.0',
                platform: 'linux',
                mode: 'ui',
              },
            },
          }
          ws.send(JSON.stringify(connectRequest))
          console.log('Sent connect request')
          return
        }

        // Step 2a: Server responds with event hello.ok
        if (frame.type === 'event' && frame.event === 'hello.ok') {
          clearTimeout(timeout)
          ws.removeListener('message', handleMessage)
          resolved = true
          console.log('Handshake complete - Protocol v3 (hello.ok event)')
          resolve()
          return
        }

        // Step 2b: Server responds with res type for the connect request
        if (frame.type === 'res' && frame.id === 'handshake-connect') {
          const res = frame as { type: string; id: string; result?: unknown; error?: { message: string } }
          if (res.error) {
            clearTimeout(timeout)
            ws.removeListener('message', handleMessage)
            reject(new Error(`Connect rejected: ${res.error.message}`))
            return
          }
          clearTimeout(timeout)
          ws.removeListener('message', handleMessage)
          resolved = true
          console.log('Handshake complete - Protocol v3 (res response)')
          resolve()
        }
      } catch (err) {
        console.error('Handshake parse error:', err)
      }
    }

    ws.on('message', handleMessage)
  })
}
