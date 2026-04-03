import WebSocket from 'ws'
import { env } from '../config'
import { handleHandshake } from './handshake'
import { handleEvent } from './events'

let gatewayWs: WebSocket | null = null
let reconnectTimer: NodeJS.Timeout | null = null
const RECONNECT_DELAY = 5000

export function getGatewayWs(): WebSocket | null {
  return gatewayWs
}

export function isGatewayConnected(): boolean {
  return gatewayWs !== null && gatewayWs.readyState === WebSocket.OPEN
}

declare global {
  var gatewayConnected: boolean
}

export async function initGatewayConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      gatewayWs = new WebSocket(env.OPENCLAW_GATEWAY_URL)

      gatewayWs.on('open', async () => {
        console.log('Connected to OpenClaw Gateway')
        try {
          await handleHandshake(gatewayWs!)
          global.gatewayConnected = true
          resolve()
        } catch (err) {
          console.error('Handshake failed:', err)
          reject(err)
        }
      })

      gatewayWs.on('message', (data: WebSocket.Data) => {
        try {
          const frame = JSON.parse(data.toString())
          handleEvent(frame)
        } catch (err) {
          console.error('Error parsing Gateway message:', err)
        }
      })

      gatewayWs.on('close', () => {
        console.log('OpenClaw Gateway disconnected')
        global.gatewayConnected = false
        scheduleReconnect()
      })

      gatewayWs.on('error', (err) => {
        console.error('OpenClaw Gateway error:', err.message)
        global.gatewayConnected = false
      })
    } catch (err) {
      reject(err)
    }
  })
}

function scheduleReconnect() {
  if (reconnectTimer) return
  console.log(`Reconnecting in ${RECONNECT_DELAY / 1000}s...`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    initGatewayConnection().catch(console.error)
  }, RECONNECT_DELAY)
}

if (typeof global.gatewayConnected === 'undefined') {
  global.gatewayConnected = false
}


