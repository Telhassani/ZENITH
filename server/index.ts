import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { env } from './config'
import { initGatewayConnection } from './gateway/connection'
import { initEventRelay } from './ws/relay'
import { initDb } from './db/sqlite'
import systemRouter from './routes/system'

const app = express()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

app.use(express.json())

// API Routes
app.use('/api/v1/system', systemRouter)

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    gateway: global.gatewayConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// Initialize components
async function bootstrap() {
  // Init SQLite
  initDb()

  // Connect to OpenClaw Gateway
  try {
    await initGatewayConnection()
  } catch (err) {
    console.error('Gateway connection failed, will retry in background:', err)
  }

  // Set up event relay to browser clients
  initEventRelay(wss)

  // Override PORT from env (default 55924 is for OpenClaw Control UI)
  const PORT = 3001
  httpServer.listen(PORT, () => {
    console.log(`ZENITH Backend listening on :${PORT}`)
    console.log(`OpenClaw Gateway: ${env.OPENCLAW_GATEWAY_URL}`)
  })
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err)
  process.exit(1)
})
