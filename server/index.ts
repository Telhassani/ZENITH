import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import path from 'path'
import { setupMockBackend } from './mock'

const app = express()
const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

app.use(express.json())

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../dist')))

setupMockBackend(app, wss)

const PORT = 3002
httpServer.listen(PORT, '0.0.0.0', () => console.log(`ZENITH Backend (Mock) listening on :${PORT}`))
