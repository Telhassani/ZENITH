# ZENITH — VPS Deployment & Phase 1 Completion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get ZENITH running and accessible at `zenith.tariqvps.com` with real OpenClaw data replacing the mock backend, deployed via Docker Compose on the VPS.

**Architecture:** ZENITH is deployed **on the VPS** (tariqvps.com) alongside OpenClaw — not on a local machine. The Express backend (port 3002) serves both the REST API and the built React frontend as static files. Caddy reverse-proxies `zenith.tariqvps.com → 127.0.0.1:3002` with Cloudflare TLS. The backend connects to OpenClaw via `ws://127.0.0.1:18789` (same host). Browser clients receive live OpenClaw events over `wss://zenith.tariqvps.com/ws` via the relay.

**Tech Stack:** Bun 1.x, Express 4, React 19 + Vite 5, Tailwind 4, Zustand, better-sqlite3, ws 8, Docker Compose

---

## Corrected Architecture Diagram

```
┌─── VPS (tariqvps.com) ─────────────────────────────────────────────┐
│                                                                     │
│  Browser → HTTPS → Caddy :443                                       │
│           zenith.tariqvps.com ──────────────────────────────┐       │
│                                                             ▼       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ZENITH (Docker, network_mode: host)                         │   │
│  │                                                              │   │
│  │  Express :3002                                               │   │
│  │  ├── GET  /api/v1/agents   → rpcCall('agent.list')           │   │
│  │  ├── GET  /api/v1/tasks    → SQLite                          │   │
│  │  ├── POST /api/v1/tasks    → SQLite + rpcCall('send')        │   │
│  │  ├── PUT  /api/v1/tasks/:id/status → state machine           │   │
│  │  ├── GET  /api/v1/health   → status                          │   │
│  │  ├── WS   /ws              → browser relay                   │   │
│  │  └── *    /*               → dist/ (React SPA)               │   │
│  │                                                              │   │
│  │  SQLite (WAL): server/zenith.db                              │   │
│  └─────────────────────────────────┬────────────────────────────┘   │
│                                    │ ws://127.0.0.1:18789            │
│  ┌─────────────────────────────────▼────────────────────────────┐   │
│  │  OpenClaw Gateway (Protocol v3)                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `.env` | Runtime secrets (never committed) |
| Create | `docker-compose.yml` | Container definition for VPS deployment |
| Modify | `server/index.ts` | Wire gateway + db + relay + real routes |
| Create | `server/routes/agents.ts` | GET /api/v1/agents via rpcCall |
| Create | `server/routes/tasks.ts` | CRUD tasks — SQLite + state machine |
| Modify | `server/routes/system.ts` | Include gateway connection status in health |
| Create | `src/hooks/useAppData.ts` | Fetch agents + tasks on mount, populate stores |
| Modify | `src/App.tsx` | Mount useAppData, mount useGateway |
| Modify | `PLAN.md` | Replace localhost architecture with VPS-hosted diagram |

---

## Task 1: Create `.env` file

**Files:**
- Create: `.env`

- [ ] **Step 1: Create .env with correct values for VPS deployment**

```bash
cat > /home/tariq/zenith/.env << 'EOF'
PORT=3002
NODE_ENV=production
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=NM7YyJl8ohC7TKLlZhUnbqEfS0Fk3FrN
PKOS_MCP_URL=https://mcp.tariqvps.com/mcp
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
X_API_KEY=
X_API_SECRET=
EOF
```

> **Note:** `OPENCLAW_GATEWAY_TOKEN` default is already in `server/config.ts`. If OpenClaw is using a different token, replace the value. `ws://127.0.0.1:18789` is correct because ZENITH and OpenClaw run on the same host — no need to go over the public internet.

- [ ] **Step 2: Verify .env is in .gitignore**

```bash
grep '\.env' /home/tariq/zenith/.gitignore
```

Expected: `.env` appears in the output. If not, add it.

---

## Task 2: Create `docker-compose.yml`

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Write docker-compose.yml**

```yaml
services:
  zenith:
    build: .
    container_name: zenith
    restart: unless-stopped
    network_mode: host
    env_file:
      - .env
    volumes:
      - ./server/zenith.db:/app/server/zenith.db
```

> `network_mode: host` is required so the container can reach OpenClaw on `127.0.0.1:18789` and serve on port 3002 (matching the Caddy config).
>
> The volume bind-mounts `server/zenith.db` so the SQLite database persists across container rebuilds. Create the empty file first if it doesn't exist: `touch server/zenith.db`

- [ ] **Step 2: Verify Docker is available on the VPS**

```bash
docker --version
```

Expected: `Docker version 24.x.x` or similar.

---

## Task 3: Rewrite `server/index.ts` — wire real infrastructure

**Files:**
- Modify: `server/index.ts`

The current file calls `setupMockBackend()` and hardcodes port 3002. Replace it entirely.

- [ ] **Step 1: Rewrite server/index.ts**

```typescript
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
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd /home/tariq/zenith && bun tsc --noEmit 2>&1 | head -30
```

Expected: No errors related to server/index.ts. (Unrelated pre-existing errors are OK for now.)

---

## Task 4: Create `server/routes/agents.ts`

**Files:**
- Create: `server/routes/agents.ts`

- [ ] **Step 1: Write agents route**

```typescript
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
    const agents = await rpcCall<unknown[]>('agent.list', {})
    res.json(agents)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
```

---

## Task 5: Create `server/routes/tasks.ts`

**Files:**
- Create: `server/routes/tasks.ts`

- [ ] **Step 1: Write tasks route**

```typescript
import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../db/sqlite'
import { canTransition, TaskState } from '../../shared/taskStates'

const router = Router()

// GET /api/v1/tasks
router.get('/', (_req, res) => {
  const tasks = getDb()
    .prepare('SELECT * FROM tasks ORDER BY created_at DESC')
    .all()
  res.json(tasks)
})

// POST /api/v1/tasks — create a new task in backlog
router.post('/', (req, res) => {
  const { title, description, priority = 'medium', agent_id } = req.body
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' })
  }

  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO tasks (id, title, description, state, agent_id, priority, created_at, updated_at)
     VALUES (?, ?, ?, 'backlog', ?, ?, ?, ?)`
  ).run(id, title, description ?? null, agent_id ?? null, priority, now, now)

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  res.status(201).json(task)
})

// PUT /api/v1/tasks/:id/status — transition task state
router.put('/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.body as { status: TaskState }

  const db = getDb()
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, string> | undefined
  if (!task) return res.status(404).json({ error: 'Task not found' })

  if (!canTransition(task.state as TaskState, status)) {
    return res.status(400).json({
      error: `Invalid transition: ${task.state} → ${status}`,
      allowed: Object.fromEntries(
        Object.entries(require('../../shared/taskStates').TRANSITIONS)
      ),
    })
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE tasks SET state = ?, updated_at = ? WHERE id = ?').run(status, now, id)

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  res.json(updated)
})

export default router
```

- [ ] **Step 2: Fix the require() call — use a static import instead**

Replace the `require()` in the error response with a static import. Add this at the top of the file (after the existing imports):

```typescript
import { TRANSITIONS } from '../../shared/taskStates'
```

Then in the `canTransition` error block, change:
```typescript
      allowed: Object.fromEntries(
        Object.entries(require('../../shared/taskStates').TRANSITIONS)
      ),
```
to:
```typescript
      allowed: TRANSITIONS,
```

---

## Task 6: Update `server/routes/system.ts` — include gateway status in health

**Files:**
- Modify: `server/routes/system.ts`

- [ ] **Step 1: Read current file**

Current content:
```typescript
import { Router } from 'express'
const router = Router()
router.get('/health', (req, res) => res.json({ status: 'ok', gateway: 'connected', uptime: process.uptime() }))
export default router
```

- [ ] **Step 2: Replace with real gateway status**

```typescript
import { Router } from 'express'
import { isGatewayConnected } from '../gateway/connection'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    gateway: isGatewayConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  })
})

export default router
```

---

## Task 7: Create `src/hooks/useAppData.ts` — initial data fetch

**Files:**
- Create: `src/hooks/useAppData.ts`

- [ ] **Step 1: Write useAppData hook**

```typescript
import { useEffect } from 'react'
import { useAgentStore } from '../stores/agentStore'
import { useTaskStore } from '../stores/taskStore'

export function useAppData() {
  const setAgents = useAgentStore((s) => s.setAgents)
  const setTasks = useTaskStore((s) => s.setTasks)

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, tasksRes] = await Promise.all([
          fetch('/api/v1/agents'),
          fetch('/api/v1/tasks'),
        ])
        if (agentsRes.ok) {
          const agents = await agentsRes.json()
          setAgents(Array.isArray(agents) ? agents : [])
        }
        if (tasksRes.ok) {
          const tasks = await tasksRes.json()
          setTasks(Array.isArray(tasks) ? tasks : [])
        }
      } catch (err) {
        console.error('[useAppData] Failed to load initial data:', err)
      }
    }
    load()
  }, [setAgents, setTasks])
}
```

---

## Task 8: Mount hooks in `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add useGateway and useAppData to App**

```typescript
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuroraBackground } from './components/layout/AuroraBackground'
import { useGateway } from './hooks/useGateway'
import { useAppData } from './hooks/useAppData'

function AppInner() {
  useGateway()
  useAppData()
  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <AuroraBackground>
      <AppInner />
    </AuroraBackground>
  )
}
```

> `useGateway` and `useAppData` must be inside a component rendered within the React tree (not in App itself before RouterProvider renders) — the inner `AppInner` component handles this cleanly.

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /home/tariq/zenith && bun tsc --noEmit 2>&1 | head -30
```

---

## Task 9: Build and deploy

- [ ] **Step 1: Create empty db file so Docker volume mount works**

```bash
touch /home/tariq/zenith/server/zenith.db
```

- [ ] **Step 2: Build and start with Docker Compose**

```bash
cd /home/tariq/zenith && docker compose up -d --build
```

Expected: Build succeeds, container starts. Check logs:

```bash
docker logs zenith --tail 30
```

Expected output includes:
```
SQLite initialized (WAL mode)
ZENITH listening on :3002 (production)
```

And either:
```
Connected to OpenClaw Gateway
Handshake complete - Protocol v3
```
or (if OpenClaw not yet available):
```
[gateway] Not available at startup: ...
[gateway] Retrying every 5s automatically...
```

- [ ] **Step 3: Reload Caddy to pick up the config change**

```bash
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Expected: `Successfully loaded config`

- [ ] **Step 4: Smoke test the health endpoint**

```bash
curl -s https://zenith.tariqvps.com/api/v1/health | jq .
```

Expected:
```json
{
  "status": "ok",
  "gateway": "disconnected",
  "uptime": 5.2
}
```
(or `"connected"` if OpenClaw responded)

- [ ] **Step 5: Open the dashboard in a browser**

Navigate to `https://zenith.tariqvps.com`

Expected: Aurora background loads, shell renders with chrome bar + side rail + status bar. Status bar shows OpenClaw connection status.

---

## Task 10: Verify OpenClaw connection

> This task requires knowing the correct OpenClaw WebSocket port. The Caddy config shows `oc.tariqvps.com → 127.0.0.1:55924` (HTTP interface). The WebSocket gateway may be on a different port. Check OpenClaw docs or running processes.

- [ ] **Step 1: Find the OpenClaw WebSocket port**

```bash
ss -tlnp | grep -E '18789|55924'
```

If port 18789 is listening, the default `.env` value is correct. If a different port is shown, update `OPENCLAW_GATEWAY_URL` in `.env` and rebuild.

- [ ] **Step 2: Rebuild after env change (if needed)**

```bash
cd /home/tariq/zenith && docker compose up -d --build
```

- [ ] **Step 3: Check gateway status**

```bash
curl -s https://zenith.tariqvps.com/api/v1/health | jq .gateway
```

Expected: `"connected"`

- [ ] **Step 4: Test agents endpoint**

```bash
curl -s https://zenith.tariqvps.com/api/v1/agents | jq .
```

Expected: Array of agents from OpenClaw, or `503` with `{"error": "OpenClaw Gateway not connected"}` if still disconnected.

---

## Task 11: Update PLAN.md architecture section

**Files:**
- Modify: `PLAN.md`

- [ ] **Step 1: Replace the System Architecture diagram in PLAN.md**

Find the section starting with `## System Architecture` (around line 59) and replace the entire ASCII diagram and the paragraph below it with:

```markdown
## System Architecture

> **Deployment model:** ZENITH runs **on the VPS** alongside OpenClaw — not on a local machine. Access it from any browser at `https://zenith.tariqvps.com`.

```
Browser (any device)
       │ HTTPS / WSS
       ▼
Caddy  :443  (zenith.tariqvps.com)
       │ HTTP proxy + WS upgrade
       ▼
ZENITH Backend  :3002  (Docker, network_mode: host)
  ├── Express REST API  /api/v1/*
  ├── WebSocket relay   /ws
  ├── Static frontend   /*  (dist/)
  └── SQLite (WAL)      server/zenith.db
       │
       │ ws://127.0.0.1:18789
       ▼
OpenClaw Gateway  (same host)
  └── Protocol v3  (challenge → connect → hello.ok)
```

### Connection to OpenClaw Gateway

ZENITH Backend connects to OpenClaw on startup via WebSocket. The connection URL is `ws://127.0.0.1:18789` — both processes run on the same VPS, so no public internet exposure is needed for this link.
```

- [ ] **Step 2: Update the port reference in CLAUDE.md**

In `CLAUDE.md`, under the Project Structure table, the backend port is listed as `port 3001`. Change it to `port 3002`:

Find:
```
| Backend | **Express (Bun)** — `server/` — port 3001 |
```
Replace with:
```
| Backend | **Express (Bun)** — `server/` — port 3002 |
```

Also update the system architecture comment in the same file:
```
│  localhost:3001     │
```
→
```
│  :3002 (VPS)        │
```

- [ ] **Step 3: Commit the documentation update**

```bash
cd /home/tariq/zenith
git add PLAN.md CLAUDE.md
git commit -m "docs: correct architecture — ZENITH is VPS-hosted on :3002, not localhost"
```

---

## Task 12: Commit all Phase 1 completion changes

- [ ] **Step 1: Stage and commit all server-side changes**

```bash
cd /home/tariq/zenith
git add server/index.ts server/routes/agents.ts server/routes/tasks.ts server/routes/system.ts
git commit -m "feat: wire real infrastructure — gateway + db + relay + agent/task routes"
```

- [ ] **Step 2: Commit frontend data-loading**

```bash
git add src/hooks/useAppData.ts src/App.tsx src/hooks/useGateway.ts vite.config.ts
git commit -m "feat: load real agents and tasks from API on app mount"
```

- [ ] **Step 3: Commit deployment files**

```bash
git add docker-compose.yml
git commit -m "chore: add docker-compose for VPS deployment"
```

---

## Troubleshooting Reference

| Symptom | Check | Fix |
|---------|-------|-----|
| `curl: (6) Could not resolve host` | DNS | Check Cloudflare DNS for zenith.tariqvps.com |
| `502 Bad Gateway` from Caddy | ZENITH not running | `docker ps` → `docker compose up -d` |
| `503` from `/api/v1/agents` | OpenClaw port wrong | `ss -tlnp` → fix `OPENCLAW_GATEWAY_URL` in `.env` |
| `Handshake timeout` in logs | Wrong token or port | Check `OPENCLAW_GATEWAY_TOKEN` |
| `SQLite not initialized` error | startup order bug | Confirm `initDb()` is called before routes in `server/index.ts` |
| `dist/index.html not found` | Build not run | `docker compose up -d --build` |
| Browser WS keeps reconnecting | `/ws` not proxied | Caddy 2 handles WS upgrades automatically; check Caddy logs |

---

## What Comes Next (Phase 2 Priorities)

Once ZENITH is accessible with real data, the next highest-value additions are:

1. **Task dispatch to OpenClaw** — `POST /api/v1/tasks/dispatch` calls `rpcCall('send', { sessionId, message, idempotencyKey })` with PKOS context enrichment
2. **Real-time task state updates** — handle `task.updated` events from OpenClaw relay in `useGateway.ts` and call `taskStore.updateTaskStatus()`
3. **Approval queue panel** — show `awaiting_approval` tasks with approve/deny buttons
4. **Session viewer** — `rpcCall('session.transcript', { sessionId })` displayed in a scrollable panel

These 4 items deliver the core control-plane value of ZENITH. The 26-panel spec in PLAN.md represents months of work — build these foundations first before adding D3 graphs, Monaco editor, or the X content pipeline.
