import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import path from 'path'
import { env } from './config'
import { initGatewayConnection } from './gateway/connection'
import { initEventRelay } from './ws/relay'
import { initDb } from './db/sqlite'
import agentsRouter from './routes/agents'
import tasksRouter from './routes/tasks'
import systemRouter from './routes/system'

const app = express()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

app.use(express.json())

// API routes
app.use('/api/v1', systemRouter)
app.use('/api/v1/agents', agentsRouter)
app.use('/api/v1/tasks', tasksRouter)

// Serve built frontend (production)
const distPath = path.join(process.cwd(), 'dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

async function start() {
  initDb()
  initEventRelay(wss)

  // Non-fatal: app stays up even if OpenClaw is unreachable at startup
  initGatewayConnection().catch((err: Error) => {
    console.warn(`[gateway] Not available at startup: ${err.message}`)
    console.warn('[gateway] Retrying every 5s automatically...')
  })

  const PORT = parseInt(env.PORT, 10)
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ZENITH listening on :${PORT} (${env.NODE_ENV})`)
  })
}

start()
