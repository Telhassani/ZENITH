import { WebSocket, WebSocketServer } from 'ws'
import { gatewayEvents } from '../gateway/events'

const browserClients = new Set<WebSocket>()

export function initEventRelay(wss: WebSocketServer) {
  wss.on('connection', (ws) => {
    console.log('Browser client connected to WS relay')
    browserClients.add(ws)

    ws.on('close', () => {
      browserClients.delete(ws)
      console.log('Browser client disconnected')
    })

    ws.on('error', (err) => {
      console.error('Browser WS error:', err.message)
      browserClients.delete(ws)
    })
  })

  // Listen for OpenClaw events and broadcast to all browser clients
  gatewayEvents.on('browser:relay', (eventFrame) => {
    const message = JSON.stringify(eventFrame)
    browserClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  })
}
