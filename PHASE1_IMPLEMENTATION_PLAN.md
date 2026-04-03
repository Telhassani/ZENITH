# ZENITH — Phase 1 Implementation Plan

> **OpenClaw Mission Control Dashboard**  
> **Foundation Scaffold: Backend + Frontend Shell + OpenClaw Gateway Connection**  
> **Repository:** https://github.com/Telhassani/ZENITH  
> **Author:** Tariq (Neo)  
> **Created:** 2026-04-03  
> **Last Updated:** 2026-04-03

---

## Phase 1 Overview

**Goal:** Build the foundation scaffold — project setup, Express backend scaffold, OpenClaw Gateway WebSocket connection (Protocol v3), first UI shell with Aurora Cosmos background and glassmorphic chrome bar.

**Deliverables by end of Phase 1:**
1. Full project scaffold with `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`
2. `.env.example` with all required environment variables
3. Express backend on port 3001 serving `/api/v1/*` REST endpoints
4. OpenClaw Gateway WebSocket connection manager with auto-reconnect
5. Protocol v3 handshake (challenge-response + hello-ok)
6. RPC wrapper for calling OpenClaw Gateway methods (`agent.list`, `send`, etc.)
7. Event stream parser relaying OpenClaw events to browser WebSocket clients
8. SQLite database (WAL mode) with schema for tasks, content_items, teams, events_log, analytics
9. Vite + React 19 frontend on port 3000 with glassmorphic shell layout
10. Aurora Cosmos animated background (3 drifting radial gradient orbs on `#0d0d2b`)
11. Shell layout: chrome bar (56px), side rail (56px), main content area, status bar (36px)
12. Zustand stores: `gatewayStore` (connection state), `agentStore` (agent fleet with role enum)
13. `/api/v1/health` endpoint returning gateway status + process uptime
14. Framer Motion entrance animations for all panels
15. Geist + JetBrains Mono font loading, Lucide React icons

**What is NOT in Phase 1:**
- AgentActivityVisualizer (D3 force graph) — Phase 3
- Task Kanban + state machine — Phase 2
- PKOS service integration — Phase 4
- Telegram bot — Phase 4
- X Content Pipeline — Phase 5
- Analytics charts — Phase 5
- Session Viewer — Phase 5
- Command Palette, Global Search — Phase 6
- Monaco Editor, Agent Teams, Heartbeat Manager — Phase 3+

---

## Tech Stack (Confirmed)

| Layer | Choice | Version |
|-------|--------|---------|
| Runtime | Bun | >= 1.1 |
| Frontend | Vite + React 19 | vite 5.x, react 19.x |
| Backend | Express | express 4.x (Bun compatible) |
| Styling | Tailwind CSS 4 + shadcn/ui | tailwindcss 4.x |
| Animations | Framer Motion | framer-motion 11.x |
| State | Zustand | zustand 4.x |
| DB | better-sqlite3 (WAL mode) | better-sqlite3 9.x |
| Editor | Monaco Editor | @monaco-editor/react 4.x |
| Graph | react-force-graph | react-force-graph-2d 1.x |
| Charts | Recharts | recharts 2.x |
| Fonts | Geist + JetBrains Mono | @fontsource/geist, @fontsource/jetbrains-mono |
| Icons | Lucide React | lucide-react 0.x |
| Telegram | Telegraf | telegraf 4.x (Phase 4) |
| WebSocket | ws | ws 8.x |
| HTTP Client | node-fetch (built into Bun) | native |

---

## File Structure (Phase 1 Deliverable)

```
~/.claude/zenith/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .env                    # NEVER commit — filled from .env.example
├── .env.example            # Template with all required variables
├── .gitignore
├── README.md
├── CLAUDE.md
├── PLAN.md
├── IMPLEMENTATION.md
├── PHASE1_IMPLEMENTATION_PLAN.md  # THIS FILE
│
├── server/
│   ├── index.ts                  # Express entrypoint, port 3001, WS upgrade
│   ├── config.ts                 # Zod-validated env config loader
│   ├── gateway/
│   │   ├── connection.ts         # WebSocket manager to OpenClaw Gateway
│   │   ├── handshake.ts          # Protocol v3 challenge-response
│   │   ├── rpc.ts                # rpcCall(method, params): Promise<any>
│   │   └── events.ts             # Event frame parser → EventEmitter
│   ├── ws/
│   │   └── relay.ts              # Relay OpenClaw events → browser WS clients
│   ├── routes/
│   │   └── system.ts             # GET /api/v1/health
│   ├── db/
│   │   ├── sqlite.ts             # better-sqlite3 WAL connection
│   │   └── schema.sql            # Initial schema (tasks, events_log, content_items, teams, analytics)
│   └── types/
│       └── openclaw.ts           # OpenClaw Protocol v3 type definitions
│
├── src/
│   ├── main.tsx                  # React 19 entrypoint
│   ├── App.tsx                   # Root App component (Shell wrapper)
│   ├── router.tsx                # react-router v7 routes (stubbed)
│   ├── styles/
│   │   └── globals.css           # Tailwind base + aurora CSS vars + glass utilities
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AuroraBackground.tsx  # 3 animated radial orbs
│   │   │   ├── Shell.tsx             # Main layout shell
│   │   │   ├── ChromeBar.tsx         # Top bar: logo, nav, clock, live dot
│   │   │   ├── SideRail.tsx          # Left icon rail with tooltips
│   │   │   └── StatusBar.tsx         # Bottom status strip
│   │   └── panels/
│   │       ├── MissionOverview.tsx   # Placeholder panel (Phase 2)
│   │       └── AgentFleet.tsx        # Agent grid (Phase 2, stub here)
│   ├── stores/
│   │   ├── gatewayStore.ts       # OpenClaw connection WS state
│   │   ├── agentStore.ts         # Agent fleet + role enum
│   │   └── uiStore.ts            # UI state: active panel, modals
│   ├── hooks/
│   │   ├── useGateway.ts         # OpenClaw WebSocket hook
│   │   └── useKeyboard.ts        # Keyboard shortcuts (stub for Phase 6)
│   └── lib/
│       ├── api.ts                # REST client (fetch wrapper /api/v1/*)
│       └── utils.ts              # cn() utility, helper fns
│
└── public/
    ├── favicon.svg
    └── fonts/                    # Geist + JetBrains Mono (or use @fontsource CDN)
```

---

## Task 1: Project Scaffold & Configuration

### 1.1 `package.json`
```json
{
  "name": "zenith-dashboard",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --bun concurrently \"bun run dev:fe\" \"bun run dev:be\"",
    "dev:fe": "vite",
    "dev:be": "bun --watch server/index.ts",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src server --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "zustand": "^4.5.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "@fontsource/geist": "^5.0.0",
    "@fontsource/jetbrains-mono": "^5.0.0",
    "tailwind-merge": "^2.0.0",
    "clsx": "^2.0.0",
    "better-sqlite3": "^9.0.0",
    "ws": "^8.16.0",
    "express": "^4.18.0",
    "zod": "^3.22.0",
    "recharts": "^2.12.0",
    "react-force-graph-2d": "^1.25.0",
    "@monaco-editor/react": "^4.6.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/express": "^4.17.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/ws": "^8.5.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "concurrently": "^8.2.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 1.2 `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "server", "shared"]
}
```

### 1.3 `vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
})
```

### 1.4 `tailwind.config.ts`
```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}', './server/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        aurora: {
          base: '#0d0d2b',
          violet: 'rgba(139, 92, 246, 0.45)',
          cyan: 'rgba(6, 182, 212, 0.35)',
          emerald: 'rgba(16, 185, 129, 0.30)',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.07)',
          hover: 'rgba(255, 255, 255, 0.11)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float-1': 'float1 28s ease-in-out infinite',
        'float-2': 'float2 35s ease-in-out infinite',
        'float-3': 'float3 42s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float1: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(30vw, -20vh)' },
        },
        float2: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-25vw, 15vh)' },
        },
        float3: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(20vw, 25vh)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

### 1.5 `.env.example`
```env
# OpenClaw Gateway Connection
OPENCLAW_GATEWAY_URL=ws://tariqvps.com:18789
OPENCLAW_GATEWAY_TOKEN=your-gateway-token-here

# PKOS MCP Server
PKOS_MCP_URL=https://mcp.tariqvps.com/mcp

# Telegram Bot (Phase 4)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# X/Twitter API (Phase 5)
X_API_KEY=your-api-key
X_API_SECRET=your-api-secret

# Server
PORT=3001
NODE_ENV=development
```

### 1.6 `.gitignore`
```
node_modules/
.env
*.db
*.db-wal
*.db-shm
dist/
build/
*.log
.DS_Store
```

---

## Task 2: Backend Scaffold

### 2.1 `server/config.ts`
```ts
import { z } from 'zod'

const envSchema = z.object({
  OPENCLAW_GATEWAY_URL: z.string().url(),
  OPENCLAW_GATEWAY_TOKEN: z.string().min(1),
  PKOS_MCP_URL: z.string().url().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  X_API_KEY: z.string().optional(),
  X_API_SECRET: z.string().optional(),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.format())
    process.exit(1)
  }
  return parsed.data
}

export const env = loadEnv()
```

### 2.2 `server/index.ts`
```ts
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
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
app.get('/api/v1/health', (req, res) => {
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
  await initGatewayConnection()

  // Set up event relay to browser clients
  initEventRelay(wss)

  const PORT = parseInt(env.PORT, 10)
  httpServer.listen(PORT, () => {
    console.log(`🚀 ZENITH Backend listening on :${PORT}`)
    console.log(`📡 OpenClaw Gateway: ${env.OPENCLAW_GATEWAY_URL}`)
  })
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err)
  process.exit(1)
})
```

### 2.3 `server/gateway/connection.ts` — OpenClaw WebSocket Manager
```ts
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

export async function initGatewayConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      gatewayWs = new WebSocket(env.OPENCLAW_GATEWAY_URL)

      gatewayWs.on('open', async () => {
        console.log('🔗 Connected to OpenClaw Gateway')
        try {
          await handleHandshake(gatewayWs!)
          global.gatewayConnected = true
          resolve()
        } catch (err) {
          console.error('❌ Handshake failed:', err)
          reject(err)
        }
      })

      gatewayWs.on('message', (data: WebSocket.Data) => {
        try {
          const frame = JSON.parse(data.toString())
          handleEvent(frame)
        } catch (err) {
          console.error('❌ Error parsing Gateway message:', err)
        }
      })

      gatewayWs.on('close', () => {
        console.log('🔌 OpenClaw Gateway disconnected')
        global.gatewayConnected = false
        scheduleReconnect()
      })

      gatewayWs.on('error', (err) => {
        console.error('❌ OpenClaw Gateway error:', err.message)
        global.gatewayConnected = false
      })
    } catch (err) {
      reject(err)
    }
  })
}

function scheduleReconnect() {
  if (reconnectTimer) return
  console.log(`🔄 Reconnecting in ${RECONNECT_DELAY / 1000}s...`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    initGatewayConnection().catch(console.error)
  }, RECONNECT_DELAY)
}

// Make connection status globally accessible
declare global {
  var gatewayConnected: boolean
}
global.gatewayConnected = false
```

### 2.4 `server/gateway/handshake.ts` — Protocol v3 Challenge-Response
```ts
import WebSocket from 'ws'
import { env } from '../config'
import { pendingRequests, sendRpcRequest } from './rpc'

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
          console.log('📨 Sent connect request')
        } else if (frame.type === 'event' && frame.event === 'hello.ok') {
          // Step 2: Handshake complete
          console.log('✅ Handshake complete — Protocol v3')
          clearTimeout(timeout)
          ws.removeListener('message', handleMessage)
          resolved = true
          resolve()
        }
      } catch (err) {
        console.error('❌ Handshake parse error:', err)
      }
    }

    ws.on('message', handleMessage)
  })
}
```

### 2.5 `server/gateway/rpc.ts` — RPC Call Wrapper
```ts
import WebSocket from 'ws'
import { getGatewayWs } from './connection'

interface RpcRequest {
  type: 'req'
  id: string
  method: string
  params?: Record<string, unknown>
}

interface RpcResponse {
  type: 'res'
  id: string
  result?: unknown
  error?: {
    code: number
    message: string
  }
}

const pendingRequests = new Map<
  string,
  { resolve: (v: unknown) => void; reject: (e: Error) => void }
>()

let requestIdCounter = 0

export async function rpcCall<T = unknown>(
  method: string,
  params?: Record<string, unknown>
): Promise<T> {
  const ws = getGatewayWs()
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error('OpenClaw Gateway not connected')
  }

  const id = `rpc-${++requestIdCounter}`

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id)
      reject(new Error(`RPC timeout: ${method}`))
    }, 30000)

    pendingRequests.set(id, {
      resolve: (v) => {
        clearTimeout(timeout)
        resolve(v as T)
      },
      reject: (e) => {
        clearTimeout(timeout)
        reject(e)
      },
    })

    const request: RpcRequest = {
      type: 'req',
      id,
      method,
      params,
    }

    ws.send(JSON.stringify(request))
  })
}

export function handleRpcResponse(response: RpcResponse) {
  const pending = pendingRequests.get(response.id)
  if (!pending) {
    console.warn(`⚠️ Unknown RPC response id: ${response.id}`)
    return
  }

  pendingRequests.delete(response.id)

  if (response.error) {
    pending.reject(new Error(response.error.message))
  } else {
    pending.resolve(response.result)
  }
}

export { pendingRequests }
```

### 2.6 `server/gateway/events.ts` — Event Frame Parser + EventEmitter
```ts
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

// Key events ZENITH cares about:
// - agent.status
// - session.message
// - exec.approval.requested
// - task.queued / task.completed
// - heartbeat.fired
```

### 2.7 `server/ws/relay.ts` — Relay OpenClaw Events to Browser Clients
```ts
import { WebSocket, WebSocketServer } from 'ws'
import { gatewayEvents } from '../gateway/events'

const browserClients = new Set<WebSocket>()

export function initEventRelay(wss: WebSocketServer) {
  wss.on('connection', (ws) => {
    console.log('🌐 Browser client connected to WS relay')
    browserClients.add(ws)

    ws.on('close', () => {
      browserClients.delete(ws)
      console.log('🌐 Browser client disconnected')
    })

    ws.on('error', (err) => {
      console.error('❌ Browser WS error:', err.message)
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
```

### 2.8 `server/routes/system.ts`
```ts
import { Router } from 'express'

const router = Router()

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gateway: global.gatewayConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

export default router
```

### 2.9 `server/db/sqlite.ts`
```ts
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function initDb() {
  const dbPath = resolve(process.cwd(), 'server', 'zenith.db')
  db = new Database(dbPath)

  // Enable WAL mode
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Run schema
  const schemaPath = resolve(__dirname, 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  db.exec(schema)

  console.log('💾 SQLite initialized (WAL mode)')
}
```

### 2.10 `server/db/schema.sql`
```sql
-- Tasks table (Phase 2 will expand this)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  state TEXT NOT NULL DEFAULT 'inbox',
  agent_id TEXT,
  lane TEXT,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  context_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  error TEXT
);

-- Content pipeline items (Phase 5)
CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'idea',
  agent_id TEXT,
  content_json TEXT,
  scheduled_for TEXT,
  published_at TEXT,
  engagement_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Agent teams (Phase 3)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  agents_json TEXT NOT NULL,
  workflow TEXT,
  last_deployed TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Event log for analytics (Phase 5)
CREATE TABLE IF NOT EXISTS events_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  agent_id TEXT,
  session_id TEXT,
  payload_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Analytics cache
CREATE TABLE IF NOT EXISTS analytics_cache (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks(state);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_content_stage ON content_items(stage);
CREATE INDEX IF NOT EXISTS idx_events_type ON events_log(event_type);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events_log(agent_id);
```

### 2.11 `server/types/openclaw.ts`
```ts
/**
 * OpenClaw Gateway Protocol v3 type definitions
 */

export interface OpenClawDevice {
  id: string
  name: string
  type: string
  connected: boolean
  lastSeen: string
}

export interface OpenClawAgent {
  id: string
  name: string
  status: 'active' | 'idle' | 'error'
  lane: string
  currentTask?: string
}

export interface OpenClawSession {
  id: string
  agentId: string
  status: 'active' | 'completed'
  messageCount: number
}

export interface OpenClawApproval {
  id: string
  sessionId: string
  tool: string
  args: Record<string, unknown>
  context: string
  createdAt: string
}

export interface OpenClawEvent {
  type: 'event'
  event: string
  payload?: unknown
}

export interface RpcRequest {
  type: 'req'
  id: string
  method: string
  params?: Record<string, unknown>
}

export interface RpcResponse {
  type: 'res'
  id: string
  result?: unknown
  error?: { code: number; message: string }
}
```

---

## Task 3: Frontend Shell + Aurora Background

### 3.1 `src/main.tsx`
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

### 3.2 `src/App.tsx`
```tsx
import { Routes, Route } from 'react-router-dom'
import { AuroraBackground } from './components/layout/AuroraBackground'
import { Shell } from './components/layout/Shell'
import { MissionOverview } from './components/panels/MissionOverview'
import { AgentFleet } from './components/panels/AgentFleet'

export default function App() {
  return (
    <AuroraBackground>
      <Shell>
        <Routes>
          <Route path="/" element={<MissionOverview />} />
          <Route path="/agents" element={<AgentFleet />} />
          {/* More routes added in subsequent phases */}
        </Routes>
      </Shell>
    </AuroraBackground>
  )
}
```

### 3.3 `src/router.tsx`
```tsx
import { createBrowserRouter } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { AuroraBackground } from './components/layout/AuroraBackground'
import { MissionOverview } from './components/panels/MissionOverview'
import { AgentFleet } from './components/panels/AgentFleet'

export const router = createBrowserRouter([
  {
    element: (
      <AuroraBackground>
        <Shell />
      </AuroraBackground>
    ),
    children: [
      { path: '/', element: <MissionOverview /> },
      { path: '/agents', element: <AgentFleet /> },
    ],
  },
])
```

### 3.4 `src/styles/globals.css`
```css
@import 'tailwindcss';

@theme {
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --color-aurora-base: #0d0d2b;
  --color-aurora-violet: rgba(139, 92, 246, 0.45);
  --color-aurora-cyan: rgba(6, 182, 212, 0.35);
  --color-aurora-emerald: rgba(16, 185, 129, 0.30);

  --color-glass: rgba(255, 255, 255, 0.07);
  --color-glass-hover: rgba(255, 255, 255, 0.11);
  --color-glass-border: rgba(255, 255, 255, 0.12);

  --animate-float-1: float1 28s ease-in-out infinite;
  --animate-float-2: float2 35s ease-in-out infinite;
  --animate-float-3: float3 42s ease-in-out infinite;
  --animate-pulse-slow: pulse 3s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30vw, -20vh); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-25vw, 15vh); }
}

@keyframes float3 {
  0%, 100% { transform: translate(0, 0); }
 50% { transform: translate(20vw, 25vh); }
}

/* Global defaults */
body {
  font-family: var(--font-sans);
  background: var(--color-aurora-base);
  color: #f1f5f9;
  overflow: hidden;
}

/* Glass panel utility */
.glass-panel {
  background: var(--color-glass);
  backdrop-filter: blur(24px) saturate(180%) brightness(110%);
  border: 1px solid var(--color-glass-border);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 24px 64px rgba(0, 0, 0, 0.4),
    0 2px 4px rgba(255, 255, 255, 0.08) inset;
}

.glass-panel:hover {
  background: var(--color-glass-hover);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 32px 80px rgba(0, 0, 0, 0.5),
    0 0 24px rgba(139, 92, 246, 0.15);
}

/* Semantic color classes */
.text-violet-role { color: #8b5cf6; }
.text-cyan-active { color: #06b6d4; }
.text-emerald-success { color: #10b981; }
.text-amber-approval { color: #f59e0b; }
.text-rose-error { color: #f43f5e; }
.text-slate-idle { color: #94a3b8; }

/* Mono for data values */
.font-data {
  font-family: var(--font-mono);
}
```

### 3.5 `src/components/layout/AuroraBackground.tsx`
```tsx
import { motion } from 'framer-motion'

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d0d2b]">
      {/* Aurora Orb 1 — Violet */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-45"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.45), transparent 70%)',
          top: '10%',
          left: '10%',
        }}
        animate={{
          x: [0, 300, 0],
          y: [0, -150, 0],
        }}
        transition={{
          duration: 28,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Aurora Orb 2 — Cyan */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full blur-[140px] opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35), transparent 70%)',
          bottom: '10%',
          right: '10%',
        }}
        animate={{
          x: [0, -250, 0],
          y: [0, 120, 0],
        }}
        transition={{
          duration: 35,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Aurora Orb 3 — Emerald */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.30), transparent 70%)',
          bottom: '20%',
          left: '30%',
        }}
        animate={{
          x: [0, 200, 0],
          y: [0, 200, 0],
        }}
        transition={{
          duration: 42,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
```

### 3.6 `src/components/layout/Shell.tsx`
```tsx
import { ChromeBar } from './ChromeBar'
import { SideRail } from './SideRail'
import { StatusBar } from './StatusBar'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <ChromeBar />
      <div className="flex flex-1 overflow-hidden">
        <SideRail />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
      <StatusBar />
    </div>
  )
}
```

### 3.7 `src/components/layout/ChromeBar.tsx`
```tsx
import { useState, useEffect } from 'react'
import { Search, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

export function ChromeBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Agents', path: '/agents' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Content', path: '/content' },
    { label: 'Business', path: '/business' },
    { label: 'Memory', path: '/memory' },
    { label: 'System', path: '/system' },
  ]

  return (
    <motion.header
      className="h-14 glass-panel mx-4 mt-4 flex items-center justify-between px-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">✦ ZENITH</span>
      </div>

      {/* Nav pills */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className="px-3 py-1.5 rounded-full text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <Search className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-mono text-sm text-slate-300 font-data">{time}</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-slow" />
          <span className="text-xs text-cyan-400 font-mono">LIVE</span>
        </div>
      </div>
    </motion.header>
  )
}
```

### 3.8 `src/components/layout/SideRail.tsx`
```tsx
import { Home, Users, CheckSquare, FileText, Briefcase, Bell, Database, Settings, Terminal, Activity, Search, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Agents', path: '/agents' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: FileText, label: 'Content', path: '/content' },
  { icon: Briefcase, label: 'Business', path: '/business' },
  { icon: Database, label: 'Memory', path: '/memory' },
  { icon: Activity, label: 'Agents', path: '/agents' },
  { icon: Bell, label: 'Approvals', path: '/approvals', urgent: true },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Wrench, label: 'Tools', path: '/tools' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export function SideRail() {
  return (
    <motion.aside
      className="w-14 glass-panel mx-2 mt-4 mb-4 flex flex-col items-center py-2 gap-1"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
    >
      {navItems.map((item, i) => (
        <Tooltip key={item.path} label={item.label}>
          <button
            className={`p-2.5 rounded-xl transition-colors relative group ${
              item.urgent ? 'hover:bg-amber-500/20' : 'hover:bg-white/10'
            }`}
          >
            <item.icon className={`w-5 h-5 ${
              item.urgent ? 'text-amber-400' : 'text-slate-300 group-hover:text-white'
            }`} />
            {item.urgent && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            )}
          </button>
        </Tooltip>
      ))}
    </motion.aside>
  )
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </div>
    </div>
  )
}
```

### 3.9 `src/components/layout/StatusBar.tsx`
```tsx
import { useGatewayStore } from '../../stores/gatewayStore'

export function StatusBar() {
  const { connected, gatewayUrl } = useGatewayStore()

  return (
    <footer className="h-9 glass-panel mx-4 mb-4 flex items-center px-4 gap-4 text-xs font-mono text-slate-400">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        <span>OpenClaw: {connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <span className="text-slate-600">|</span>
      <span>PKOS: Checking...</span>
      <span className="text-slate-600">|</span>
      <span>Telegram: Not configured</span>
      <span className="text-slate-600">|</span>
      <span className="ml-auto">Queue: —</span>
    </footer>
  )
}
```

### 3.10 `src/components/panels/MissionOverview.tsx` (Placeholder)
```tsx
import { motion } from 'framer-motion'

export function MissionOverview() {
  return (
    <motion.div
      className="glass-panel p-6 max-w-2xl mx-auto mt-8"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
    >
      <h1 className="text-2xl font-bold mb-2">Mission Overview</h1>
      <p className="text-slate-400">
        Phase 1 scaffold — Agent Fleet, Activity Visualizer, Task Kanban coming in Phase 2-3.
      </p>
      <div className="mt-4 flex gap-4 text-sm font-mono text-slate-500">
        <div>Agents: Loading...</div>
        <div>Active Tasks: —</div>
        <div>Pending Approvals: —</div>
      </div>
    </motion.div>
  )
}
```

### 3.11 `src/components/panels/AgentFleet.tsx` (Stub)
```tsx
import { motion } from 'framer-motion'
import { useAgentStore } from '../../stores/agentStore'

export function AgentFleet() {
  const { agents } = useAgentStore()

  return (
    <motion.div
      className="glass-panel p-6"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-4">Agent Fleet</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {agents.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 py-8">
            No agents loaded. Connect to OpenClaw Gateway to populate.
          </div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="glass-panel p-4">
              <div className="font-bold">{agent.name}</div>
              <div className="text-xs text-slate-400">{agent.role}</div>
              <div className="text-xs text-cyan-400 mt-1">● {agent.status}</div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}
```

---

## Task 4: Zustand Stores

### 4.1 `src/stores/gatewayStore.ts`
```ts
import { create } from 'zustand'

interface GatewayState {
  connected: boolean
  gatewayUrl: string
  connectTime: string | null
  error: string | null
  setConnected: (connected: boolean) => void
  setGatewayUrl: (url: string) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useGatewayStore = create<GatewayState>((set) => ({
  connected: false,
  gatewayUrl: '',
  connectTime: null,
  error: null,
  setConnected: (connected) => set({ connected, connectTime: connected ? new Date().toISOString() : null }),
  setGatewayUrl: (gatewayUrl) => set({ gatewayUrl }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
```

### 4.2 `src/stores/agentStore.ts`
```ts
import { create } from 'zustand'

export type AgentRole = 'orchestrator' | 'sub-agent' | 'specialist' | 'monitor'

export interface AgentState {
  id: string
  name: string
  role: AgentRole
  status: 'active' | 'idle' | 'error'
  lane?: string
  currentTask?: string
  stats?: {
    totalTasks: number
    successRate: number
    avgDuration: number
  }
}

interface AgentStoreState {
  agents: AgentState[]
  setAgents: (agents: AgentState[]) => void
  updateAgent: (id: string, updates: Partial<AgentState>) => void
  getAgent: (id: string) => AgentState | undefined
  getOrchestrators: () => AgentState[]
  getActiveAgents: () => AgentState[]
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  agents: [],
  setAgents: (agents) => set({ agents }),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  getAgent: (id) => get().agents.find((a) => a.id === id),
  getOrchestrators: () => get().agents.filter((a) => a.role === 'orchestrator'),
  getActiveAgents: () => get().agents.filter((a) => a.status === 'active'),
}))
```

### 4.3 `src/stores/uiStore.ts`
```ts
import { create } from 'zustand'

interface UiState {
  activePanel: string
  setActivePanel: (panel: string) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePanel: 'dashboard',
  setActivePanel: (activePanel) => set({ activePanel }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
}))
```

---

## Task 5: Hooks & Utilities

### 5.1 `src/hooks/useGateway.ts`
```ts
import { useEffect, useRef } from 'react'
import { useGatewayStore } from '../stores/gatewayStore'

export function useGateway() {
  const wsRef = useRef<WebSocket | null>(null)
  const { setConnected, setGatewayUrl } = useGatewayStore()

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('🌐 Connected to backend WS relay')
      setConnected(true)
      setGatewayUrl(wsUrl)
    }

    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data)
        // Handle events in Phase 2 (agent.status, etc.)
        console.log('📨 WS event:', frame.event)
      } catch (err) {
        console.error('❌ WS message parse error:', err)
      }
    }

    ws.onclose = () => {
      console.log('🔌 Backend WS disconnected')
      setConnected(false)
    }

    ws.onerror = (err) => {
      console.error('❌ WS error:', err)
    }

    return () => {
      ws.close()
    }
  }, [setConnected, setGatewayUrl])

  return { ws: wsRef.current }
}
```

### 5.2 `src/lib/api.ts`
```ts
const API_BASE = '/api/v1'

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
}
```

### 5.3 `src/lib/utils.ts`
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
}
```

---

## Task 6: Font Loading

Add `@fontsource` imports to `src/main.tsx`:

```tsx
import '@fontsource/geist/400.css'
import '@fontsource/geist/500.css'
import '@fontsource/geist/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
```

---

## Verification Checklist

After completing Phase 1, run through these checks:

### Backend
- [ ] `bun run dev:be` starts Express on port 3001 without errors
- [ ] `GET /api/v1/health` returns `{ status: "ok", gateway: "connected" | "disconnected", uptime: <number> }`
- [ ] OpenClaw Gateway WebSocket connects and completes Protocol v3 handshake
- [ ] `agent.list` RPC call succeeds (test manually if needed)
- [ ] SQLite database created at `server/zenith.db` with WAL mode
- [ ] All tables exist: tasks, content_items, teams, events_log, analytics_cache

### Frontend
- [ ] `bun run dev:fe` starts Vite on port 3000
- [ ] Aurora background renders with 3 animated orbs
- [ ] Chrome bar displays ZENITH logo, nav pills, clock updating every second
- [ ] Side rail displays all nav icons with tooltips on hover
- [ ] Glass panels render with correct backdrop-blur and border
- [ ] StatusBar shows current gateway connection status
- [ ] Framer Motion entrance animations play on load (aurora → chrome → panels → status bar)
- [ ] MissionOverview panel renders placeholder content
- [ ] AgentFleet panel renders (empty state when no agents connected)

### Integration
- [ ] `bun run dev` starts both frontend and backend concurrently
- [ ] Browser WS connection to `/ws` succeeds
- [ ] Zustand stores initialize with correct default values
- [ ] No console errors or TypeScript warnings in either process
- [ ] Font families load correctly (Geist for UI, JetBrains Mono for data)

---

## Known Limitations of Phase 1

- Agent data does not yet populate from OpenClaw `agent.list` — requires Phase 2 agent route
- WebSocket events arrive but are not yet consumed by stores — requires Phase 2 event handlers
- Panels are placeholders — real content comes in Phases 2-5
- No PKOS, Telegram, or X integration yet — Phases 4-5
- No Monaco editor, command palette, or keyboard shortcuts — Phase 3, 6

---

## Next Steps (Phase 2 Preview)

After Phase 1 verification passes:
1. Implement TaskState machine in `shared/taskStates.ts`
2. Create `/api/v1/tasks` CRUD routes with dispatch logic
3. Build TaskKanban component with @dnd-kit drag-and-drop
4. Add TaskDispatch form with PKOS context enrichment
5. Implement approval queue from `exec.approval.list/resolve`
6. Wire agent fleet to actually call `agent.list` from OpenClaw Gateway

This document will be committed to the repo alongside the Phase 1 code.
