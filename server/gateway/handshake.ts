import WebSocket from 'ws'
import { env } from '../config'

interface ConnectChallenge {
  type: 'event'
  event: 'connect.challenge'
  payload: {
    nonce: string
    ts: number
  }
}

interface HelloOk {
  type: 'event'
  event: 'hello.ok'
  payload: {
    deviceToken?: string
    protocol: number
  }
}

export async function handleHandshake(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        reject(new Error('Handshake timeout'))
      }
    }, 10000)

    const handleMessage = (data: WebSocket.Data) => {
      try {
        const frame: ConnectChallenge | HelloOk = JSON.parse(data.toString())

        if (frame.type === 'event' && frame.event === 'connect.challenge') {
          // Step 1: Received challenge — send connect request
          const connectRequest = {
            type: 'req',
            id: 'handshake-connect',
            method: 'connect',
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              role: 'operator',
              scopes: ['operator.read', 'operator.write'],
              auth: { token: env.OPENCLAW_GATEWAY_TOKEN },
              deviceInfo: {
                name: 'ZENITH Dashboard',
                type: 'dashboard',
              },
            },
          } as const

          ws.send(JSON.stringify(connectRequest))
          console.log('Sent connect request')
        } else if (frame.type === 'event' && frame.event === 'hello.ok') {
          // Step 2: Handshake complete
          console.log('Handshake complete - Protocol v3')
          clearTimeout(timeout)
          ws.removeListener('message', handleMessage)
          resolved = true
          resolve()
        }
      } catch (err) {
        console.error('Handshake parse error:', err)
      }
    }

    ws.on('message', handleMessage)
  })
}
