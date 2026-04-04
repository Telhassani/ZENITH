import { Router } from 'express'
import { isGatewayConnected } from '../gateway/connection'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    gateway: isGatewayConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

export default router
