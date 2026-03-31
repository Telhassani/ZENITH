# ZENITH

**OpenClaw Mission Control Dashboard** — a localhost control plane for your OpenClaw agent fleet running on a VPS.

## What it does

- Monitor all OpenClaw agents in real-time (Agent Fleet + Activity Visualizer)
- Dispatch tasks to agents with PKOS memory context enrichment
- Human-in-the-loop approval queue (exec approvals + X content)
- X (Twitter) content pipeline: Ideas → Drafts → Review → Scheduled → Published
- Full agent CRUD: edit SOUL.md, AGENTS.md, HEARTBEAT.md via Monaco editor
- Named persistent agent teams with one-click deploy
- Orchestrator → sub-agent delegation tree visualization
- PKOS knowledge base integration (all 8 tools)
- Telegram bot for approvals and notifications
- Analytics, global search, session viewer

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Bun |
| Frontend | Vite + React 19 + Zustand |
| Backend | Express (Bun) |
| Styling | Tailwind CSS 4 + shadcn/ui + Framer Motion |
| DB | SQLite (WAL, better-sqlite3) |
| Editor | Monaco Editor |
| Graph | D3.js + react-force-graph |
| Fonts | Geist + JetBrains Mono |
| Telegram | Telegraf |

## Visual Design

**Aurora Cosmos + Liquid Glass** — deep indigo base (`#0d0d2b`) with three animated radial gradient orbs (violet, cyan, emerald) drifting as a living aurora. All panels are liquid glass cards floating over the aurora. Colors are semantic: violet = orchestrators, cyan = active, emerald = success, amber = approval, rose = error.

## Architecture

```
ZENITH (localhost:3000/3001) ──WebSocket──► OpenClaw Gateway (VPS:18789)
                             ──MCP──────► PKOS (mcp.tariqvps.com)
                             ──Bot──────► Telegram
                             ──API──────► X (Twitter) v2
```

## Quick Start (once implementation begins)

```bash
cd ~/.claude/zenith
cp .env.example .env   # fill in OPENCLAW_GATEWAY_URL, tokens, etc.
bun install
bun run dev            # starts frontend :3000 + backend :3001
```

## Implementation Plan

See [PLAN.md](./PLAN.md) for the full architecture, UI design, OpenClaw subagent delegation brief, and QMD memory usage pattern.
