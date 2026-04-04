import { Router } from 'express'
import { rpcCall } from '../gateway/rpc'
import { isGatewayConnected } from '../gateway/connection'

const router = Router()

// GET /api/v1/agents
router.get('/', async (_req, res) => {
  if (!isGatewayConnected()) {
    return res.status(503).json({ error: 'OpenClaw Gateway not connected', agents: [] })
  }
  try {
    const result = await rpcCall<{ nodes: unknown[] }>('node.list', {})
    res.json(result?.nodes ?? [])
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
