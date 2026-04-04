# ZENITH — Claude Code Instructions

## What This Project Is

ZENITH is a **VPS-hosted mission control dashboard** for an OpenClaw agent fleet running on `tariqvps.com`. It is deployed on the same VPS as OpenClaw and served at `https://zenith.tariqvps.com` via Caddy. It is the UI and control plane — OpenClaw is the execution engine.

**Key distinction:** ZENITH does NOT manage local PAI/Claude Code infrastructure (hooks, skills, agents/*.md). It connects to OpenClaw on the VPS and manages everything through the OpenClaw Gateway Protocol.

Full architecture, UI design, and feature spec: see `PLAN.md`.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | **Bun** |
| Frontend | **Vite + React 19** — `src/` — port 3000 |
| Backend | **Express (Bun)** — `server/` — port 3002 |
| Styling | **Tailwind CSS 4 + shadcn/ui** |
| Animations | **Framer Motion** |
| State | **Zustand** stores in `src/stores/` |
| DB | **SQLite** (bun:sqlite, WAL) at `server/zenith.db` |
| Editor | **Monaco Editor** (lazy-loaded) |
| Graph | **D3.js + react-force-graph** |
| Fonts | **Geist** (UI) + **JetBrains Mono** (data/code) |
| Telegram | **Telegraf** |
| Icons | **Lucide React** |

---

## Project Structure

```
~/.claude/ZENITH/
├── CLAUDE.md           ← you are here
├── PLAN.md             ← full architecture + subagent build brief
├── README.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env                ← never commit (see .env.example)
│
├── server/             ← Express backend (Bun)
│   ├── index.ts        ← entrypoint, port 3001
│   ├── config.ts       ← env loading (zod validated)
│   ├── gateway/        ← OpenClaw WebSocket connection
│   │   ├── connection.ts   ← persistent WS to OpenClaw Gateway
│   │   ├── handshake.ts    ← Protocol v3 challenge-response
│   │   ├── rpc.ts          ← rpcCall(method, params): Promise<any>
│   │   └── events.ts       ← event frame parser + emitter
│   ├── routes/         ← REST API under /api/v1/
│   ├── services/       ← XApiService, TelegramService, PKOSService, etc.
│   ├── ws/relay.ts     ← relays OpenClaw events to browser WS clients
│   └── db/             ← SQLite schema + connection
│
└── src/                ← Vite + React frontend
    ├── stores/         ← Zustand (agentStore, taskStore, etc.)
    ├── components/
    │   ├── layout/     ← Shell, AuroraBackground, SideRail, StatusBar
    │   ├── panels/     ← one file per dashboard panel
    │   └── shared/     ← CommandPalette, MonacoEditor, StatusBadge, etc.
    └── lib/
        ├── api.ts      ← REST client (fetch wrapper for /api/v1/*)
        └── gateway.ts  ← browser WebSocket client
```

---

## Dev Commands

```bash
bun run dev       # start both frontend (:3000) and backend (:3001) concurrently
bun run dev:fe    # frontend only
bun run dev:be    # backend only
bun run build     # production build
bun run typecheck # tsc --noEmit
```

---

## Environment Variables

All env vars live in `.env` (never committed). See `.env.example` for the full list.

| Variable | Purpose |
|----------|---------|
| `OPENCLAW_GATEWAY_URL` | `ws://127.0.0.1:55924/gateway` |
| `OPENCLAW_GATEWAY_TOKEN` | Auth token for Protocol v3 handshake |
| `PKOS_MCP_URL` | `https://mcp.tariqvps.com/mcp` |
| `TELEGRAM_BOT_TOKEN` | Telegraf bot token |
| `TELEGRAM_CHAT_ID` | Target chat ID for notifications |
| `X_API_KEY` | X/Twitter API v2 key |
| `X_API_SECRET` | X/Twitter API v2 secret |

---

## OpenClaw Gateway Protocol

The backend maintains a **single persistent WebSocket** to OpenClaw. All communication goes through it.

**Handshake (Protocol v3):**
1. Server sends `connect.challenge {nonce, ts}`
2. Client replies with `{type:"req", method:"connect", params:{minProtocol:3, maxProtocol:3, role:"operator", scopes:["operator.read","operator.write"], auth:{token}, deviceInfo:{name:"ZENITH",type:"dashboard"}}}`
3. Server responds `hello-ok`

**RPC pattern:**
```typescript
// server/gateway/rpc.ts
const result = await rpcCall('agent.list', {});
const result = await rpcCall('send', { sessionId, message, idempotencyKey });
```

**Key methods used:**
- `agent.list` / `agent.create` / `agent.config.get` / `agent.config.set`
- `session.list` / `session.transcript`
- `send` (requires idempotency key — always generate with `crypto.randomUUID()`)
- `exec.approval.list` / `exec.approval.resolve`
- `tools.catalog` / `system-presence` / `channel.list`

**Events** are pushed by OpenClaw and relayed to browser clients via the WS relay.

---

## UI Design System

**Background:** Aurora Cosmos — animated radial gradient orbs on `#0d0d2b` base. Never use solid black.

```css
/* Glass panel — standard card */
background: rgba(255, 255, 255, 0.07);
backdrop-filter: blur(24px) saturate(180%) brightness(110%);
border: 1px solid rgba(255, 255, 255, 0.12);
border-radius: 20px;
```

**Semantic color system — always use these, never arbitrary colors:**

| Color | Tailwind | Meaning |
|-------|----------|---------|
| Violet | `violet-500` `#8b5cf6` | Orchestrators, control flow |
| Cyan | `cyan-500` `#06b6d4` | Active execution, data flow |
| Emerald | `emerald-500` `#10b981` | Success, healthy, complete |
| Amber | `amber-500` `#f59e0b` | Pending approval, human action |
| Rose | `rose-500` `#f43f5e` | Error, failure, critical |
| Slate | `slate-400` `#94a3b8` | Idle, inactive, secondary |

**Typography:**
- UI text: Geist font family
- Data values, IDs, timestamps, code: JetBrains Mono
- Primary text: `text-slate-100` — never pure white (`#ffffff`)
- Secondary text: `text-slate-400`

**Animations:** Use Framer Motion for all transitions. Spring physics for entrances (`type: "spring", stiffness: 300, damping: 30`). Stagger children with `staggerChildren: 0.08`.

---

## Task State Machine

Tasks follow a strict state machine — **never bypass transitions**:

```
inbox → routing → queued → executing → waiting_approval → completed
                                     → waiting_review   → completed
                                     → failed → inbox (retry)
completed → archived
```

Transitions are defined in `shared/taskStates.ts`. The backend enforces valid transitions — reject invalid ones with 400. The Kanban UI disables drag to invalid columns.

---

## PKOS Integration

`server/services/PKOSService.ts` wraps all 8 PKOS MCP tools:
`search`, `remember`, `ask`, `browse`, `addDocument`, `addUrl`, `getStats`, `forget`

When dispatching a task, always call `PKOSService.searchForTask(description)` first and attach results as context. This is the QMD memory pattern — agents read from memory rather than needing large context injections.

---

## Telegram (Human-in-the-Loop)

`TelegramService` sends notifications on:
- Task completion
- Approval needed (with inline `✅ Approve / ❌ Deny` keyboard)
- Agent errors

Telegram approval callbacks hit `POST /api/v1/approvals/:id/resolve` — same as browser approval.

---

## X Content Pipeline

Content state: `idea → drafting → draft → review → scheduled → published`

- Assign agent to a content item → dispatches to OpenClaw (Quill agent)
- Draft comes back → moves to review
- User approves in the Approval Queue → `XApiService.tweet()` or `scheduleTweet()` called
- Never post to X without explicit user approval in the UI

---

## Critical Rules

1. **Never post to X without user approval** — always gate through the Approval Queue
2. **Always use idempotency keys** for `send` RPC calls — `crypto.randomUUID()`
3. **Never hardcode gateway URL or tokens** — always from `config.ts` → `.env`
4. **Task transitions must go through the state machine** — no direct state writes
5. **Glass panels only on aurora background** — never flat dark backgrounds
6. **Use semantic colors only** — no ad-hoc hex values or arbitrary Tailwind colors
7. **Framer Motion for all animations** — no raw CSS transitions for component state changes
8. **JetBrains Mono for all data** — timestamps, IDs, counts, code snippets
9. **PKOS search before dispatch** — enrich every task with memory context before sending to OpenClaw
10. **No PAI file system access** — ZENITH never reads `~/.claude/agents/`, hooks, or skills

---

## Key Reference

- **Full architecture + UI mockups:** `PLAN.md`
- **OpenClaw Protocol v3 docs:** https://docs.openclaw.ai/gateway/protocol
- **PKOS MCP:** `https://mcp.tariqvps.com/mcp`
- **OpenClaw Gateway:** `ws://127.0.0.1:55924/gateway`
- **GitHub repo:** https://github.com/Telhassani/ZENITH
