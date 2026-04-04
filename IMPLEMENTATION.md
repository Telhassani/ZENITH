# ZENITH — Implementation Plan

> OpenClaw Mission Control Dashboard  
> **Repository:** https://github.com/Telhassani/ZENITH  
> **Architect:** Tariq  
> **Last updated:** 2026-04-02

---

## What ZENITH Is (and Isn't)

**ZENITH is:** A mission control UI for your OpenClaw fleet — see agents, send tasks, approve actions, manage content, track business.

**ZENITH is NOT:** A PAI management tool. It doesn't manage hooks, skills, or local Claude Code infrastructure.

Full architecture + UI design in [PLAN.md](./PLAN.md).

---

## Architecture Summary

```
ZENITH (localhost:3000/3001) ──WebSocket──► OpenClaw Gateway (tariqvps.com:18789)
                             ──MCP───────► PKOS (mcp.tariqvps.com)
                             ──Bot───────► Telegram
                             ──API───────► X (Twitter) v2
```

| Layer | Choice |
|-------|--------|
| Runtime | Bun |
| Frontend | Vite + React 19 (port 3000) |
| Backend | Express (Bun, port 3001) |
| Styling | Tailwind CSS 4 + shadcn/ui + Framer Motion |
| State | Zustand stores |
| DB | SQLite (WAL, better-sqlite3) at `server/zenith.db` |
| Editor | Monaco Editor |
| Graph | D3.js + react-force-graph |
| Fonts | Geist + JetBrains Mono |
| Telegram | Telegraf |

**Design:** Aurora Cosmos + Liquid Glass — deep indigo `#0d0d2b` base, three animated radial gradient orbs (violet, cyan, emerald), all panels are liquid glass cards floating over the aurora.

---

## Phase 0: Architecture & Planning ✅

**Status:** Complete — 2026-04-02

| Deliverable | File | Notes |
|-------------|------|-------|
| Full architecture + UI mockups | `PLAN.md` | 26 panels, OpenClaw subagent brief, QMD memory pattern |
| Claude Code instructions | `CLAUDE.md` | Tech stack, semantic colors, task state machine, critical rules |
| Project overview | `README.md` | Stack, architecture, quick-start stub |
| Git scaffolding | `.gitignore` | node_modules, .env, dist, *.db |
| Repo deployment | GitHub | https://github.com/Telhassani/ZENITH — 3 commits on `main` |

---

## Phase 1: Foundation (Week 1-2)

**Goal:** Project scaffolding, backend scaffold, OpenClaw Gateway connection, first UI shell.

### Task 1 — Foundation & Backend Scaffold
| Status | Task |
|--------|------|
| ⏳ | `package.json` — Bun, scripts: dev/build/start (concurrent FE+BE) |
| ⏳ | `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts` |
| ⏳ | `.env.example` — OPENCLAW_GATEWAY_URL, OPENCLAW_GATEWAY_TOKEN, PKOS_MCP_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, X_API_KEY, X_API_SECRET |
| ⏳ | `server/index.ts` — Express on port 3001, `/api/v1/*`, WebSocket upgrade `/ws` |
| ⏳ | `server/config.ts` — env loading with zod validation (NEVER hardcode tokens) |
| ⏳ | `server/gateway/connection.ts` — WebSocket to OPENCLAW_GATEWAY_URL, auto-reconnect |
| ⏳ | `server/gateway/handshake.ts` — Protocol v3 challenge-response handshake |
| ⏳ | `server/gateway/rpc.ts` — `rpcCall(method, params)`: Promise<any> with pending Map |
| ⏳ | `server/gateway/events.ts` — Event frame parser + EventEmitter |
| ⏳ | `server/ws/relay.ts` — Relay OpenClaw events to browser WS clients |
| ⏳ | `server/db/sqlite.ts` — better-sqlite3 WAL, run schema.sql on init |
| ⏳ | `server/db/schema.sql` — tables: tasks, content_items, teams, events_log, analytics |
| ⏳ | `server/routes/system.ts` — GET `/api/v1/health` |

**VERIFY:** `bun run dev` starts, `/api/v1/health` returns gateway status

### Task 2 — Frontend Shell + Aurora Background
| Status | Task | Depends On |
|--------|------|------------|
| ⏳ | `src/main.tsx` — React 19, strict mode, router | Task 1 scaffold |
| ⏳ | `src/App.tsx` — Shell layout | Task 1 scaffold |
| ⏳ | `src/router.tsx` — react-router v7, route stubs | Task 1 scaffold |
| ⏳ | `src/styles/globals.css` — Tailwind + aurora CSS + glass utilities | Task 1 scaffold |
| ⏳ | `src/components/layout/AuroraBackground.tsx` — 3 animated radial orbs on #0d0d2b | Task 1 scaffold |
| ⏳ | `src/components/layout/Shell.tsx` — Chrome bar (56px, ZENITH logo, nav, clock) | AuroraBackground |
| ⏳ | `src/components/layout/SideRail.tsx` — 56px icon rail + tooltips | Shell |
| ⏳ | `src/components/layout/StatusBar.tsx` — Gateway status, PKOS status, queue depth | Shell |
| ⏳ | `src/stores/gatewayStore.ts` — connection state + event log | Task 1 scaffold |
| ⏳ | `src/stores/agentStore.ts` — agent list + role enum | Task 1 scaffold |

**VERIFY:** `bun run dev` shows aurora background, glass chrome bar, side rail

---

## Phase 2: Task Kanban + Orchestration (Week 3-4)

| Status | Task | Depends On |
|--------|------|------------|
| ⏳ | `shared/taskStates.ts` — 9-state TaskState machine, TRANSITIONS map | Phase 1 |
| ⏳ | `server/routes/tasks.ts` — CRUD + dispatch (rpc `send` with idempotency key) | Phase 1 |
| ⏳ | `server/routes/approvals.ts` — `exec.approval.list` / `exec.approval.resolve` | Phase 1 |
| ⏳ | `src/stores/taskStore.ts` — Zustand store with optimistic updates + rollback | Phase 1 |
| ⏳ | `src/components/panels/TaskKanban.tsx` — @dnd-kit, 9 columns, validated transitions | taskStates.ts |
| ⏳ | `src/components/panels/TaskDispatch.tsx` — Form + PKOS context enrichment | Agent store |
| ⏳ | `src/components/panels/ApprovalQueue.tsx` — Live approvals + content preview | approvals route |
| ⏳ | `src/components/panels/AgentFleet.tsx` — Agent cards with halo ring design | Phase 1 |
| ⏳ | `src/components/panels/OrchestratorView.tsx` — Delegation tree visualization | Task system |
| ⏳ | `server/services/OrchestrationService.ts` — Track orchestrator→sub-agent trees | Task system |

**VERIFY:** Tasks flow through all 9 states, invalid drays blocked, dispatch → OpenClaw

---

## Phase 3: Agent Activity Visualizer (Week 5-6)

| Status | Task | Depends On |
|--------|------|------------|
| ⏳ | `src/components/panels/AgentActivityVisualizer.tsx` — Force-directed graph (react-force-graph) | Phase 1 + 2 |
| ⏳ | `src/components/panels/AgentActivityTimeline.tsx` — Gantt chart (Recharts) | Phase 1 + 2 |
| ⏳ | `src/components/panels/AgentActivityMatrix.tsx` — Task × agent grid | Phase 1 + 2 |
| ⏳ | `src/components/panels/AgentEditor.tsx` — Monaco editor for workspace files | Agent fleet |
| ⏳ | `src/components/panels/AgentTeams.tsx` — CRUD + deploy | Agent fleet |
| ⏳ | `src/components/panels/HeartbeatManager.tsx` — Visual cron editor | Agent editor |
| ⏳ | `server/routes/agents.ts` — `agent.list`, `agent.config.get/set` proxy | Phase 1 |

**VERIFY:** Fleet shows agents from OpenClaw, visualizer renders live graph

---

## Phase 4: PKOS + Telegram (Week 7-8)

| Status | Task | Depends On |
|--------|------|------------|
| ⏳ | `server/services/PKOSService.ts` — All 8 PKOS MCP tools | Phase 1 |
| ⏳ | `server/services/TelegramService.ts` — Telegraf bot, inline keywords | Phase 1 |
| ⏳ | `server/routes/pkos.ts` — REST wrapper | PKOSService |
| ⏳ | `server/routes/telegram.ts` — POST internal trigger | TelegramService |
| ⏳ | `src/stores/pkosStore.ts` — chatHistory, searchResults, stats | Phase 1 |
| ⏳ | `src/components/panels/PKOSChat.tsx` — Natural language Q&A (pkos_ask) | PKOS store |
| ⏳ | `src/components/panels/PKOSMemoryManager.tsx` — Stats, browse, forget | PKOS store |
| ⏳ | `src/components/panels/GlobalSearch.tsx` — SQLite FTS5 + PKOS simultaneous | Multiple |
| ⏳ | `src/components/panels/TelegramManager.tsx` — Bot config, notification rules | TelegramService |

**VERIFY:** PKOS search returns results, Telegram sends approval notifications

---

## Phase 5: Content + Analytics (Week 9-10)

| Status | Task | Depends On |
|--------|------|------------|
| ⏳ | `server/services/XApiService.ts` — OAuth 2.0 PKCE, tweet/schedule/engagement | Phase 1 |
| ⏳ | `server/routes/content.ts` — Content CRUD + dispatch + approve | XApiService |
| ⏳ | `src/components/panels/ContentPipeline.tsx` — 5-column Kanban | Content routes |
| ⏳ | `src/components/panels/SessionViewer.tsx` — Transcripts + save to PKOS | Phase 1 |
| ⏳ | `server/services/AnalyticsService.ts` — SQLite aggregate queries | Phase 1 |
| ⏳ | `src/components/panels/Analytics.tsx` — Recharts KPI cards | AnalyticsService |
| ⏳ | `src/components/panels/TaskManager.tsx` — Work + personal inbox | Phase 2 |

**VERIFY:** Idea → draft → approve → X post → engagement metrics

---

## Phase 6: Polish (Week 11-12)

| Status | Task | Depends On |
|--------|------|------------|
| ⏳ | `src/components/panels/NotificationCenter.tsx` | Phase 4 + 5 |
| ⏳ | `src/components/panels/Logs.tsx` — Audit trail | Phase 1 |
| ⏳ | `src/components/panels/ChannelManager.tsx` | Phase 1 |
| ⏳ | `src/components/panels/ToolsBrowser.tsx` | Phase 1 |
| ⏳ | `src/components/shared/CommandPalette.tsx` — Cmd+K global search | All phases |
| ⏳ | `src/hooks/useKeyboard.ts` — j/k navigation | All phases |
| ⏳ | Performance: virtualized lists, lazy panel loading, D3 canvas | All phases |

---

## Build Order (Dependency Graph)

```
Phase 1 (Foundation) ──┬──► Phase 2 (Kanban + Orchestration)
                       ├──► Phase 3 (Visualizer + Editor)
                       ├──► Phase 4 (PKOS + Telegram)
                       ├──► Phase 5 (Content + Analytics)
                       └──► Phase 6 (Polish)
```

**Parallelization:** After Phase 1 scaffolding, Phases 2-5 can largely run in parallel. Phase 6 is final polish.

---

## Security Rules

1. **Never hardcode tokens** — `OPENCLAW_GATEWAY_TOKEN` required via `.env`, no defaults
2. **`.env` in `.gitignore`** — only `.env.example` tracked
3. **SSH auth for git** — no PATs in remote URLs
4. **Push after every phase** — this file IS the session memory
5. **Commit after every sub-phase** — each numbered task gets its own commit

---

## Progress Tracker

| Phase | Status | Started | Completed | Commits | Pushed |
|-------|--------|---------|-----------|---------|--------|
| Phase 0: Architecture | ✅ Done | 2026-03-30 | 2026-04-02 | 3 | ✅ |
| Phase 1: Foundation | ⏳ Next | — | — | 0 | — |
| Phase 2: Task Kanban | ⏸️ Waiting | — | — | 0 | — |
| Phase 3: Visualizer | ⏸️ Waiting | — | — | 0 | — |
| Phase 4: PKOS + Telegram | ⏸️ Waiting | — | — | 0 | — |
| Phase 5: Content + Analytics | ⏸️ Waiting | — | — | 0 | — |
| Phase 6: Polish | ⏸️ Waiting | — | — | 0 | — |
