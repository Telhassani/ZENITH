# ZENITH — OpenClaw Mission Control Dashboard

## Repo Deployment Steps

**Target repo:** `https://github.com/Telhassani/ZENITH`

1. Create `~/.claude/ZENITH/` directory
2. Copy this plan as `~/.claude/ZENITH/PLAN.md`
3. Write a `README.md` (project overview, stack, quick-start stub)
4. Write a `.gitignore` (node_modules, .env, dist, *.db)
5. `git init` inside `~/.claude/ZENITH/`
6. `git remote add origin https://github.com/Telhassani/ZENITH`
7. `git add -A && git commit -m "feat: initial ZENITH architecture plan"`
8. `git push -u origin main`

---

## Context

ZENITH is a **localhost dashboard that serves as the full control plane** for an OpenClaw instance running on a VPS (tariqvps.com). It monitors all agent work, dispatches tasks, manages agent definitions, handles content pipelines, and provides business/personal task management — all through OpenClaw as the execution engine.

**What ZENITH is:** A mission control UI for your OpenClaw fleet — see agents, send tasks, approve actions, manage content, track business.
**What ZENITH is NOT:** A PAI management tool. It doesn't manage hooks, skills, or local Claude Code infrastructure.

**OpenClaw Architecture (key facts):**
- WebSocket-first Gateway Protocol (port 18789, Protocol v3)
- Agents defined via workspace files: AGENTS.md, SOUL.md, HEARTBEAT.md, IDENTITY.md, USER.md, TOOLS.md
- Lane-based FIFO task queue (main: 4 concurrent, subagent: 8 concurrent)
- Memory stored as Markdown files + SQLite with vector embeddings
- Session transcripts as JSONL files
- 5,700+ community skills marketplace
- Multi-channel: WhatsApp, Telegram, Discord, Slack, Signal, iMessage, WebChat, 50+

---

## Tech Stack

### **Vite + React 19 + Express (Bun) + SQLite**

| Component | Choice | Why |
|-----------|--------|-----|
| Runtime | **Bun** | Fast, already in PAI ecosystem |
| Frontend | **Vite + React 19** | Sub-100ms HMR, no SSR needed for localhost |
| Backend | **Express (Bun)** | WebSocket proxy to OpenClaw Gateway, API aggregation |
| Styling | **Tailwind CSS 4 + shadcn/ui** | Professional dark theme + glassmorphism |
| State | **Zustand** | Lightweight, WebSocket-friendly stores |
| DB | **SQLite (better-sqlite3, WAL)** | Local analytics, dashboard state, cron history |
| Editor | **Monaco Editor** | Edit AGENTS.md, SOUL.md, HEARTBEAT.md files |
| Charts | **Recharts** | Agent performance, task analytics |
| Graph visualization | **D3.js + react-force-graph** | Agent Activity Visualizer (force-directed, physics-based) |
| Animations | **Framer Motion** | Spring physics micro-animations, staggered load, panel transitions |
| Fonts | **Geist + JetBrains Mono** | Dashboard UI + data/code values |
| Telegram | **Telegraf** | Bot notifications + approval callbacks |
| Icons | **Lucide React** | Clean, consistent iconography |

---

## System Architecture

> **Deployment model:** ZENITH runs **on the VPS** alongside OpenClaw — not on a local machine. Access it from any browser at `https://zenith.tariqvps.com`.

```
Browser (any device)
       │ HTTPS / WSS
       ▼
Caddy  :443  (zenith.tariqvps.com)
       │ HTTP proxy + WS upgrade → 127.0.0.1:3002
       ▼
┌─── VPS (tariqvps.com) ───────────────────────────────────────────┐
│                                                                  │
│  ZENITH  :3002  (Docker, network_mode: host)                     │
│  ├── Express REST API  /api/v1/*                                 │
│  │     GET  /agents  → rpcCall('node.list')                      │
│  │     GET  /tasks   → SQLite                                    │
│  │     POST /tasks   → SQLite + rpcCall('sessions.send')         │
│  │     PUT  /tasks/:id/status  → state machine                   │
│  ├── WebSocket relay  /ws  → browser clients                     │
│  ├── Static frontend  /*   → dist/ (React SPA)                   │
│  └── SQLite (WAL)  server/zenith.db                              │
│                │                                                 │
│                │  ws://127.0.0.1:55924/gateway  (same host)      │
│                ▼                                                 │
│  OpenClaw Gateway  :55924  (Protocol v3)                         │
│  ├── RPC methods: node.list, sessions.list, sessions.send, …     │
│  └── Events: node.*, session.*, exec.approval.*                  │
│                                                                  │
│  PKOS MCP  (mcp.tariqvps.com)                                    │
│  OpenClaw Web UI  (oc.tariqvps.com → :55924)                     │
└──────────────────────────────────────────────────────────────────┘
```

### Connection to OpenClaw Gateway

ZENITH Backend maintains a persistent WebSocket connection to the OpenClaw Gateway:

```typescript
// Gateway handshake (Protocol v3)
const ws = new WebSocket('ws://tariqvps.com:18789');

ws.on('message', (data) => {
  const frame = JSON.parse(data);

  if (frame.type === 'event' && frame.event === 'connect.challenge') {
    // Step 1: Receive challenge {nonce, ts}
    ws.send(JSON.stringify({
      type: 'req',
      id: 'handshake-1',
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        auth: { token: process.env.OPENCLAW_GATEWAY_TOKEN },
        deviceInfo: { name: 'ZENITH Dashboard', type: 'dashboard' }
      }
    }));
  }
});

// Step 2: After hello-ok, use RPC methods:
// agent.list, agent.create, session.list, send, exec.approval.resolve, etc.
```

### Key OpenClaw RPC Methods ZENITH Will Use

| Method | Purpose | ZENITH Panel |
|--------|---------|-------------|
| `agent.list` | List all agents | Agent Fleet |
| `agent.create` | Create new agent | Agent Editor |
| `agent.config.get/set` | Read/write agent workspace files | Agent Editor |
| `session.list` | Active sessions | Mission Overview |
| `session.transcript` | Session history | Session Viewer |
| `send` | Send task to agent (with idempotency key) | Task Dispatch |
| `exec.approval.list` | Pending approvals | Approval Queue |
| `exec.approval.resolve` | Approve/reject execution | Approval Queue |
| `tools.catalog` | Available tools inventory | Tools Browser |
| `system-presence` | Connected devices | System Health |
| `channel.list` | Active channels | Channel Manager |

### Event Stream (Real-Time)

OpenClaw pushes events via the WebSocket connection. ZENITH Backend relays these to the frontend:

```typescript
// OpenClaw events → ZENITH WebSocket → Browser
type OpenClawEvent =
  | { event: 'agent.status'; payload: { agentId, status, lane } }
  | { event: 'session.message'; payload: { sessionId, content, role } }
  | { event: 'exec.approval.requested'; payload: { id, tool, args } }
  | { event: 'task.queued'; payload: { taskId, lane, position } }
  | { event: 'task.completed'; payload: { taskId, result } }
  | { event: 'heartbeat.fired'; payload: { jobId, agentId } }
```

---

## Honest Design Evaluation + Creative Vision

### What's Wrong With the Typical Approach

Most "mission control" dashboards look the same: `#0a0a0f` background, white text, neon green dots, flat glassmorphism cards. They're functional but forgettable. ZENITH should feel like the difference between an airline terminal and NASA mission control — same information, completely different *presence*.

The key insight: **glassmorphism only works when there's something beautiful behind the glass.** On a near-black background, glass just looks slightly lighter. On an aurora, it looks alive.

Three common mistakes to avoid:
1. Dark flat background kills the glass effect — glass needs color depth behind it to refract
2. Static glassmorphism (2021-era) — it should respond to light, scroll, interaction
3. Treating the background as "canvas" rather than part of the composition

---

## UI/UX Design: Aurora Cosmos + Liquid Glass

### Background: The Aurora Cosmos

The background is NOT a solid dark color — it is a **living, breathing aurora**: three large radial gradient orbs (violet, cyan, emerald) that drift slowly across a deep indigo base. At 15% opacity with heavy blur, they create depth without distraction. The whole scene shifts over ~30 seconds — imperceptibly slow but unmistakably alive.

```
Base:    #0d0d2b  (deep indigo — not black, not purple, in between)
Orb 1:   radial-gradient(circle, rgba(139, 92, 246, 0.45), transparent 70%)
         — violet, drifts top-left ↔ center-right, 28s cycle
Orb 2:   radial-gradient(circle, rgba(6, 182, 212, 0.35), transparent 70%)
         — cyan, drifts bottom-right ↔ center, 35s cycle
Orb 3:   radial-gradient(circle, rgba(16, 185, 129, 0.30), transparent 70%)
         — emerald, drifts bottom-left ↔ top-right, 42s cycle
Noise:   SVG fractal noise at 3.5% opacity, "Overlay" blend mode — adds realism
```

Result: the background looks like a dark aurora borealis viewed through deep space. Every panel floats over it as genuine glass.

### Glass Panels: Liquid Glass (not static frosted)

Inspired by Apple's 2025 Liquid Glass — panels are physically responsive:

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(24px) saturate(180%) brightness(110%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05) inset,  /* inner highlight */
    0 24px 64px rgba(0,0,0,0.4),              /* depth shadow */
    0 2px 4px rgba(255,255,255,0.08) inset;  /* top specular */
}

/* On hover — glass "tightens" and glows */
.glass-panel:hover {
  background: rgba(255, 255, 255, 0.11);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08) inset,
    0 32px 80px rgba(0,0,0,0.5),
    0 0 24px rgba(139, 92, 246, 0.15);  /* violet glow from aurora behind */
}
```

### Color System

No "primary color" — **colors signal meaning**:

| Color | Hex | Semantic |
|-------|-----|---------|
| Violet | `#8b5cf6` | Orchestrators, delegation, control flow |
| Cyan | `#06b6d4` | Active execution, data flow, live streams |
| Emerald | `#10b981` | Completed, success, healthy systems |
| Amber | `#f59e0b` | Pending approval, warnings, human action needed |
| Rose | `#f43f5e` | Errors, failures, critical alerts |
| Slate | `#94a3b8` | Idle agents, inactive, secondary text |

Text: `#f1f5f9` primary (slate-100, warm white), `#94a3b8` secondary — never pure white.

### Typography: Geist + JetBrains Mono

- **Geist** (Vercel's typeface) — clean, confident, designed for dashboards
- **JetBrains Mono** — for all data values, code, IDs, timestamps
- KPI numbers: `text-4xl font-bold tracking-tight` — big, readable, commanding

### Agent Nodes: Halo-Ring Design

Each agent in the visualizer is a **glowing halo ring** — not a plain circle:

```
Orchestrator (Henry):
  ╔══╗  Bright violet ring, double-width, outer glow pulse
  ║🤖║
  ╚══╝
  Henry

Active sub-agent (Quill):
  ┌──┐  Thin cyan ring, animated rotating dash (clockwise, 3s)
  │✍│
  └──┘
  Quill

Idle agent:
  ┌──┐  Slate ring, no animation, 40% opacity
  │💤│
  └──┘
```

Ring colors = role colors from the semantic system above. Orchestrators get a double-ring (like a bullseye). Active agents have a rotating dash pattern on the outer ring.

### Spatial Depth: Z-Layers

The dashboard is not flat — it has depth:

```
Z-Layer 4 (closest): Command palette, modals, toasts — solid glass with high blur
Z-Layer 3:           Header chrome, sidebar — semi-opaque glass, medium blur
Z-Layer 2:           Main panel cards — light glass, low blur
Z-Layer 1:           Background subtitles, grid lines — barely visible
Z-Layer 0:           Aurora background — deeply blurred color
```

Each layer uses progressively less blur: 40px → 28px → 16px → 8px. This creates a real sense of depth without needing 3D transforms.

### Micro-Animation System

Every state change has a micro-animation:

| Event | Animation |
|-------|-----------|
| Agent comes online | Halo ring expands from 0 to size, opacity fade in (400ms, spring) |
| Task starts | Card slides in from right edge with spring physics (350ms) |
| Task completes | Emerald pulse ripples outward from card center (600ms) |
| Approval arrives | Amber glow pulses on the Approval Queue icon (repeating) |
| Data flows (edge in graph) | Cyan particle travels along edge path, 1.5s, loops while active |
| Panel hover | Glass panel lifts 2px, shadow deepens (150ms ease-out) |
| Error | Red shake + rose glow (400ms) |

Library: **Framer Motion** (replaces basic CSS transitions for complex animations).

### Layout Mockup (Aurora Cosmos aesthetic)

```
╔══════════════════════════════════════════════════════════════════════╗
║  ✦ ZENITH                                 🔍 Cmd+K    14:22:07  ◉  ║
║──────────────────────────────────────────────────────────────────────║
║ [Dashboard] [Agents] [Tasks] [Content] [Business] [Memory] [System] ║
╠═══════╦══════════════════════════════════════════════════════════════╣
║       ║                                                              ║
║  ⬡    ║  ╔════════════════════════╗  ╔═══════════════════════════╗  ║
║ fleet ║  ║                        ║  ║                           ║  ║
║       ║  ║   MISSION OVERVIEW     ║  ║     LIVE FEED             ║  ║
║  ◉    ║  ║                        ║  ║                           ║  ║
║ tasks ║  ║   6          4    2    ║  ║  ◉ Quill: task done       ║  ║
║       ║  ║ agents     active  ⚠  ║  ║  ○ Engineer: executing    ║  ║
║  ⊡    ║  ║                        ║  ║  ⚠ Approval: bash cmd     ║  ║
║ cont. ║  ║ ████████░░  11 queued  ║  ║  ◉ Scout: heartbeat fired ║  ║
║       ║  ╚════════════════════════╝  ╚═══════════════════════════╝  ║
║  ◈    ║                                                              ║
║ apprvl║  ╔═══════════════════════════════════════════════════════╗  ║
║       ║  ║          AGENT ACTIVITY VISUALIZER                    ║  ║
║  ◧    ║  ║                                                       ║  ║
║  pkos ║  ║    (Halo rings floating over aurora background)       ║  ║
║       ║  ║                                                       ║  ║
║  ≡    ║  ║  ◉─ ─ ─ ─ ─✦─ ─ ─ ─ ─◉   ◎ = Orchestrator           ║  ║
║  logs ║  ║          ◎             ◉   ◉ = Active sub-agent       ║  ║
║       ║  ║        ╱   ╲               ○ = Idle                   ║  ║
║       ║  ║      ◉       ○                                        ║  ║
║       ║  ╚═══════════════════════════════════════════════════════╝  ║
╠═══════╩══════════════════════════════════════════════════════════════╣
║  ◉ Gateway: Connected  │  PKOS: Online  │  Telegram: Active  │ 4/26 ║
╚══════════════════════════════════════════════════════════════════════╝

  [Background: aurora orbs drift slowly — violet left, cyan right, emerald low]
  [All panels: glass cards floating over aurora, subtle specular on top edge]
  [Side rail: icons only, 56px, ultra-thin glass strip]
```

### The "Wow" Moment: First Load

When ZENITH opens:
1. Aurora background fades in (800ms)
2. Chrome bar slides down from top (300ms, spring)
3. Panel cards scale in from 95% with staggered delay (each +80ms)
4. Agent nodes pop into the visualizer one by one with halo ring animation
5. Live feed items stream in from the right

Total load animation: ~2.5s. Not a splash screen — the data is loading as the animation plays, so it feels instant and alive simultaneously.

### Main Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  🔥 ZENITH   [Dashboard] [Agents] [Tasks] [Content] [Business] │
│                                   🔍 Cmd+K    12:30:58  ● LIVE  │
├────────┬─────────────────────────────────────────────────────────┤
│        │                                                         │
│  SIDE  │                   MAIN CONTENT                          │
│  RAIL  │                                                         │
│  64px  │   ┌──────────────────────┐  ┌───────────────────────┐  │
│        │   │  MISSION OVERVIEW    │  │  LIVE FEED            │  │
│  Dash  │   │  ┌────────────────┐  │  │  ┌─────────────────┐  │  │
│  Agents│   │  │ 6 Agents Online│  │  │  │ Quill completed │  │  │
│  Tasks │   │  │ 4 Tasks Active │  │  │  │ "X thread draft"│  │  │
│  Cont. │   │  │ 2 Approvals ⚠  │  │  │  ├─────────────────┤  │  │
│  Biz   │   │  │ Queue: 11 jobs │  │  │  │ Engineer started│  │  │
│  Apprvl│   │  └────────────────┘  │  │  │ "API endpoint"  │  │  │
│  Tools │   └──────────────────────┘  │  ├─────────────────┤  │  │
│  Logs  │   ┌──────────────────────────┤  │ ⚠ Approval req │  │  │
│  Set.  │   │       AGENT FLEET       │  │ "Delete file"   │  │  │
│        │   │  ┌────┐ ┌────┐ ┌────┐  │  │ [Approve][Deny] │  │  │
│        │   │  │Quill│ │Engr│ │Arch│  │  └─────────────────┘  │  │
│        │   │  │ ●ON │ │ ●ON│ │ ○  │  │                       │  │
│        │   │  └────┘ └────┘ └────┘  │                       │  │
│        │   └─────────────────────────┘                       │  │
│        │   ┌───────────────────────────────────────────────┐ │  │
│        │   │         TASK QUEUE (Lane View)                │ │  │
│        │   │ main(4)  ████░  │ subagent(8) ██░░░░░░       │ │  │
│        │   │ ┌──────┐ ┌──────┐ ┌──────┐                   │ │  │
│        │   │ │Task 1│ │Task 2│ │Task 3│ ... +11 queued    │ │  │
│        │   │ └──────┘ └──────┘ └──────┘                   │ │  │
│        │   └───────────────────────────────────────────────┘ │  │
├────────┴─────────────────────────────────────────────────────────┤
│ ● OpenClaw: Connected │ Agents: 6/6 │ Queue: 4 active, 11 wait │
└──────────────────────────────────────────────────────────────────┘
```

### Agent Editor (CRUD for OpenClaw Workspace Files)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Fleet    AGENT: Quill (Content Writer)     [Deploy]  │
├───────────┬──────────────────────────────────────────────────────┤
│  Files    │  SOUL.md                                             │
│           │  ┌──────────────────────────────────────────────┐    │
│ ● SOUL.md │  │ # Quill                                      │    │
│   AGENTS  │  │                                              │    │
│   HEART.  │  │ You are Quill, a content writer who          │    │
│   IDENT.  │  │ specializes in X threads about AI            │    │
│   USER.md │  │ infrastructure, developer tools, and         │    │
│   TOOLS   │  │ personal AI systems.                         │    │
│           │  │                                              │    │
│  Stats    │  │ ## Voice                                      │    │
│  ─────    │  │ - Conversational but technical               │    │
│  Tasks: 47│  │ - Thread-native (hooks, not essays)          │    │
│  Success  │  │ - Shows don't tell                           │    │
│  rate: 94%│  │                                              │    │
│  Avg time │  │ ## Rules                                      │    │
│  : 3.2min │  │ - Max 280 chars per tweet                    │    │
│           │  │ - Threads: 3-12 tweets                       │    │
│ [Delete]  │  │ - Always include a hook in tweet 1           │    │
│           │  └──────────────────────────────────────────────┘    │
│           │                                                      │
│           │  [Save to VPS]  [Preview] [Diff from VPS]           │
└───────────┴──────────────────────────────────────────────────────┘
```

### Approval Queue (Human-in-the-Loop)

```
┌──────────────────────────────────────────────────────────────────┐
│  APPROVAL QUEUE    2 pending                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ ⚠ APPROVAL REQUIRED              Priority: HIGH       │      │
│  │                                                        │      │
│  │ Agent: Engineer    Session: api-endpoint-build         │      │
│  │ Tool:  Bash        Command: rm -rf ./build/            │      │
│  │                                                        │      │
│  │ Context: "Cleaning build directory before rebuild.     │      │
│  │ This is a standard build step."                        │      │
│  │                                                        │      │
│  │ [✅ Approve]  [❌ Deny]  [💬 Ask Agent]               │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ ⚠ CONTENT APPROVAL               Priority: MEDIUM     │      │
│  │                                                        │      │
│  │ Agent: Quill       Session: zenith-thread              │      │
│  │ Action: Post to X  Thread: 8 tweets                    │      │
│  │                                                        │      │
│  │ Preview:                                               │      │
│  │ ┌──────────────────────────────────────────────┐      │      │
│  │ │ 1/8: I just built a mission control for my   │      │      │
│  │ │ AI agents. Here's why it changed everything  │      │      │
│  │ │ about how I work 🧵                          │      │      │
│  │ │                                              │      │      │
│  │ │ 2/8: The problem: 14 AI agents running on    │      │      │
│  │ │ my VPS, but no way to see what they're doing │      │      │
│  │ │ ...                                          │      │      │
│  │ └──────────────────────────────────────────────┘      │      │
│  │                                                        │      │
│  │ [✅ Approve & Post]  [✏️ Edit]  [❌ Reject & Redraft] │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### X Content Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│  X CONTENT PIPELINE    Ideas → Drafts → Review → Sched → Live   │
├────────────┬───────────┬───────────┬───────────┬─────────────────┤
│ 💡 Ideas(4)│ ✏️ Draft(2)│ 👁️ Review│ 📅 Sched │ ✅ Published    │
│ ┌────────┐ │ ┌────────┐│ ┌────────┐│ ┌────────┐│ ┌────────┐     │
│ │ZENITH  │ │ │PKOS    ││ │AI agent││ │Thread: ││ │Launch  │     │
│ │launch  │ │ │memory  ││ │spawning││ │ZENITH  ││ │post    │     │
│ │post    │ │ │deep    ││ │demo    ││ │preview ││ │        │     │
│ │        │ │ │dive    ││ │        ││ │3/31 9AM││ │ 127 ♥  │     │
│ │[Assign]│ │ │🤖 Quill││ │[Review]││ │        ││ │  23 RT │     │
│ └────────┘ │ └────────┘│ └────────┘│ └────────┘│ └────────┘     │
│ ┌────────┐ │ ┌────────┐│          │           │                 │
│ │PAI vs  │ │ │Hook    ││          │           │                 │
│ │other   │ │ │system  ││          │           │                 │
│ │frames  │ │ │explain ││          │           │                 │
│ └────────┘ │ └────────┘│          │           │                 │
│ [+ New]    │           │          │           │                 │
│            │           │          │           │                 │
│ "Assign agent" sends   │ Approval │ X API     │ Engagement      │
│ task to OpenClaw       │ gate     │ scheduled │ metrics         │
└────────────┴───────────┴──────────┴───────────┴─────────────────┘
```

### Task Dispatch Panel

```
┌──────────────────────────────────────────────────────────────────┐
│  DISPATCH TASK TO OPENCLAW                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Task: [Write an X thread about ZENITH's real-time monitoring]  │
│                                                                  │
│  Agent:    [Quill ▾]          Lane:  [main ▾]                   │
│  Category: [● Work ○ Personal]  Priority: [● High ○ Med ○ Low] │
│  Mode:     [● steer ○ followup ○ collect]                       │
│                                                                  │
│  Context (attach knowledge):                                    │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ + Add from PKOS knowledge base                         │      │
│  │ + Paste text context                                   │      │
│  │ + Reference another agent's output                     │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
│  Approval required: [☑ Before posting] [☑ Before file ops]     │
│                                                                  │
│  [🚀 Send to OpenClaw]    [💾 Save as Template]                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Business/Personal Task Manager

```
┌──────────────────────────────────────────────────────────────────┐
│  TASK MANAGER    [All] [Work] [Personal]    [+ New Task]        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── Active (dispatched to OpenClaw) ─────────────────────────   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ 🟢 Write ZENITH announcement thread                  │       │
│  │    Agent: Quill │ Lane: main │ Status: Executing     │       │
│  │    Category: Work │ Started: 10 min ago              │       │
│  │    [View Output] [Send Message] [Cancel]             │       │
│  └──────────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ 🟡 Research Morocco tax filing deadlines              │       │
│  │    Agent: Researcher │ Lane: main │ Status: Queued   │       │
│  │    Category: Personal │ Queued: 5 min ago            │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  ── Completed Today ─────────────────────────────────────────   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ ✅ Draft PKOS documentation update                    │       │
│  │    Agent: Engineer │ Duration: 8 min │ ⭐ 9/10       │       │
│  │    [View Result] [Re-run] [Archive]                  │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  ── Inbox (not yet dispatched) ──────────────────────────────   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ 📋 Plan Q2 content calendar                           │       │
│  │    No agent assigned │ Priority: Medium              │       │
│  │    [Assign Agent] [Edit] [Delete]                    │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Agent Activity Visualizer

A dedicated, full-screen panel with smooth, silky animated graphics showing the entire agent fleet, their real-time activity, collaboration links, and task ownership. This is the "wow" panel — the one that makes ZENITH feel like a real mission control.

### Design Principles
- **Force-directed graph** (D3.js or `react-force-graph`) — nodes float and breathe, edges animate data flow
- **Smooth spring physics** — nodes spring into position, edges pulse when data flows
- **Glassmorphic node cards** — each agent is a frosted card with avatar, name, current task, status pulse
- **Clean edge lines** — thin, glowing lines between collaborating agents (color = task type)
- **Sharp typography** — agent names and task labels crisp at all scales
- **No clutter** — only show active relationships; idle agents dim to 20% opacity

### Agent Node Anatomy

```
  ┌────────────────────────┐
  │  ● ACTIVE              │   ← status dot (animated pulse)
  │  ┌──┐                  │
  │  │🤖│  Quill           │   ← avatar + name
  │  └──┘  Content Writer  │   ← role
  │  ─────────────────────  │
  │  "Writing X thread      │   ← current task (live, updates)
  │   about ZENITH"        │
  │  ─────────────────────  │
  │  ⏱ 4m  ✅ 12  ❌ 1    │   ← running time, success/fail counts
  └────────────────────────┘
```

### Collaboration Edge Types

```
Orchestrator → Sub-agent:   thick white pulse (task delegation)
Sub-agent → Sub-agent:      thin cyan arc (data handoff)
Agent → Approval Queue:     amber dashed line (pending approval)
Agent → External (X/TG):    purple dotted line (output)
Orchestrator distributing:  fan of lines from center node to all sub-agents
```

### Mockup

```
┌──────────────────────────────────────────────────────────────────────┐
│  AGENT ACTIVITY    [Graph] [Timeline] [Matrix]   ⏸ [Live]  Export  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                    ╔══════════════╗                                  │
│                    ║  ORCHESTRATOR║                                  │
│                    ║   (Henry)    ║──────────────┐                   │
│                    ╚══════╦═══════╝              │                   │
│                           │  ╔═══════╗           │                   │
│              ┌────────────┤  ║ Scout ║           │                   │
│              │            │  ║Trend  ║           │                   │
│              ▼            │  ╚═══════╝           ▼                   │
│    ╔══════════════╗        │              ╔══════════════╗            │
│    ║    Quill     ║        │              ║   Engineer   ║            │
│    ║  ● writing   ║        │              ║  ● building  ║            │
│    ║ X thread...  ║◄───────┘              ║  API route   ║            │
│    ╚══════════════╝                       ╚══════════════╝            │
│           │                                       │                  │
│           │ (purple dotted)                       │ (amber dashed)   │
│           ▼                                       ▼                  │
│       [X Post]                            [Approval Queue]          │
│                                                                      │
│  ── Task Ownership Log ─────────────────────────────────────────   │
│  Quill      → "ZENITH thread"     ✅ 12:30 → 12:38  8m           │
│  Engineer   → "API endpoint"      🔄 12:40 → now    4m running   │
│  Scout      → "Trend analysis"    ✅ 12:15 → 12:22  7m           │
└──────────────────────────────────────────────────────────────────────┘
```

### Timeline View (alternate)

```
AGENT         12:00    12:15    12:30    12:45    NOW
──────────────┼────────┼────────┼────────┼────────┼
Quill         │        │████████████████ │        │
Engineer      │        │        │        │████████│
Scout         │████████│        │        │        │
Architect     │        │        │████    │        │
              │        │        │        │        │
              ■ = active task   (hover = task name)
```

### Matrix View (alternate — task × agent ownership)

```
              Quill  Engr  Scout  Arch  QA
ZENITH thread   ■                        ■
API endpoint           ■
Trend analysis               ■
PKOS docs              ■           ■
Content review  ■                       ■
```

---

## Orchestrator Pattern

ZENITH models a clear distinction between orchestrators and sub-agents. This is reflected in both the data model and the UI.

### Agent Roles

```typescript
type AgentRole =
  | 'orchestrator'   // Receives tasks from user, decomposes, delegates to sub-agents
  | 'sub-agent'      // Executes specific work packages assigned by orchestrator
  | 'specialist'     // Called by orchestrators or sub-agents for specific capabilities
  | 'monitor'        // Passive — observes and reports, no task execution

// Stored in agent workspace IDENTITY.md under ## Role
```

### Orchestration Flow

```
User (ZENITH Dispatch) → Orchestrator Agent
         ↓
   Decompose task into sub-tasks
   ├── Sub-task A → Sub-agent 1 (main lane)
   ├── Sub-task B → Sub-agent 2 (subagent lane)
   └── Sub-task C → Sub-agent 3 (subagent lane)
         ↓
   Collect results from sub-agents
   ├── Validate completeness
   ├── Request revisions if needed
   └── Return consolidated result to user

ZENITH UI shows:
  - Orchestrator card at top (highlighted, different border)
  - Fan of delegation lines to sub-agents
  - Sub-task cards on each sub-agent
  - Consolidation arrow back to orchestrator
  - Final result in session viewer
```

### Kanban with Task Routing Logic

**The Kanban and task routing are coupled by a shared state machine. UI columns ARE the routing states — they never diverge.**

```typescript
// Single source of truth — TaskState drives BOTH column placement AND routing
type TaskState =
  | 'inbox'          // Created, not yet dispatched
  | 'routing'        // Being assigned to agent/lane (brief)
  | 'queued'         // In OpenClaw lane queue
  | 'executing'      // Agent actively working
  | 'waiting_approval' // Agent paused, waiting for exec approval
  | 'waiting_review' // Task output awaiting human review (content)
  | 'completed'      // Done, result available
  | 'failed'         // Error, may be retried
  | 'archived'       // Done and archived

// Kanban columns map 1:1 to task states — no translation layer
const KANBAN_COLUMNS: Record<TaskState, ColumnConfig> = {
  inbox:            { label: 'Inbox',    color: 'zinc' },
  routing:          { label: 'Routing',  color: 'blue', ephemeral: true },
  queued:           { label: 'Queued',   color: 'indigo' },
  executing:        { label: 'Executing',color: 'emerald', animated: true },
  waiting_approval: { label: 'Approval', color: 'amber', urgent: true },
  waiting_review:   { label: 'Review',   color: 'orange' },
  completed:        { label: 'Done',     color: 'green' },
  failed:           { label: 'Failed',   color: 'red' },
  archived:         { label: 'Archive',  color: 'zinc', collapsed: true },
};

// Routing transitions — enforced on backend, visualized by frontend
const TRANSITIONS: Partial<Record<TaskState, TaskState[]>> = {
  inbox:            ['routing', 'archived'],
  routing:          ['queued', 'failed'],
  queued:           ['executing', 'failed'],
  executing:        ['waiting_approval', 'waiting_review', 'completed', 'failed'],
  waiting_approval: ['executing', 'failed'],
  waiting_review:   ['completed', 'executing'],  // executing = sent back for revision
  completed:        ['archived'],
  failed:           ['inbox', 'archived'],  // retry puts it back in inbox
};
// Invalid state transitions rejected by backend — UI disables drag to invalid columns
```

---

## PKOS Integration (Full)

ZENITH integrates deeply with PKOS — not just a search panel, but a system-wide memory and knowledge layer accessible from every part of the dashboard.

### PKOS Tools Available in ZENITH

| Tool | Where Used | Purpose |
|------|-----------|---------|
| `pkos_remember` | Task Dispatch, Agent Editor | Add knowledge before dispatching |
| `pkos_search` | Global Search, Task Dispatch context | Find relevant memories |
| `pkos_ask` | PKOS Chat panel | Natural language Q&A over knowledge |
| `pkos_browse` | Memory Browser panel | Explore knowledge domains |
| `pkos_add_document` | Anywhere with file upload | Add documents to knowledge base |
| `pkos_add_url` | Content Pipeline | Save URLs for agent reference |
| `pkos_get_stats` | Analytics panel, System Health | Knowledge base statistics |
| `pkos_forget` | Memory Manager | Remove stale knowledge |

### How PKOS Integrates Per Panel

- **Task Dispatch:** "Add from PKOS" button attaches relevant memories as context before sending to OpenClaw
- **Agent Editor:** Attach PKOS documents to agent's USER.md or TOOLS.md context
- **Content Pipeline:** When creating X content ideas, search PKOS for past content, engagement data
- **Session Viewer:** After session completes, offer to save key insights back to PKOS
- **Global Search:** Search bar queries both OpenClaw sessions AND PKOS knowledge simultaneously
- **Mission Overview:** PKOS stat widget showing total memories, recent additions

### PKOS Memory System Integration

```typescript
// PKOS MCP connection (already configured at mcp.tariqvps.com)
class PKOSService {
  private mcp: MCPClient;

  async searchForTask(taskDescription: string): Promise<PKOSResult[]> {
    return this.mcp.call('pkos_search', { query: taskDescription, limit: 5 });
  }

  async enrichDispatch(task: Task): Promise<Task & { context: PKOSResult[] }> {
    const memories = await this.searchForTask(task.description);
    return { ...task, context: memories };
  }

  async saveSessionInsight(session: Session, insight: string): Promise<void> {
    await this.mcp.call('pkos_remember', { content: insight, tags: [session.agentId] });
  }
}
```

---

## Telegram Integration

ZENITH connects to Telegram as a notification and command channel — bidirectional.

### What ZENITH Uses Telegram For

| Direction | Use Case |
|-----------|---------|
| ZENITH → Telegram | Notify when approvals are needed, tasks complete, agent errors |
| Telegram → ZENITH | Receive quick commands: approve/reject, dispatch quick tasks |

### Integration Architecture

```
OpenClaw already supports Telegram as a channel (built-in).
ZENITH adds:
  1. A Telegram bot for ZENITH-specific notifications (separate from OpenClaw agent channel)
  2. Approval shortcut buttons in Telegram (inline keyboard: ✅ Approve / ❌ Deny)
  3. Quick task dispatch via Telegram message → ZENITH backend → OpenClaw
```

### Telegram Notification Flow

```
Agent completes task → OpenClaw event → ZENITH backend
  → SQLite log
  → WebSocket push to browser
  → Telegram bot sends message:
    "✅ Quill finished: ZENITH announcement thread
     [View in ZENITH] [Approve for X] [Dismiss]"

Approval requested → ZENITH backend
  → Browser notification (Approval Queue panel)
  → Telegram bot sends:
    "⚠️ Approval needed: Engineer wants to run rm -rf ./build/
     [✅ Approve] [❌ Deny]"
    → User taps in Telegram → webhook → ZENITH → OpenClaw Gateway
```

### Telegram Bot Setup

```typescript
// server/services/TelegramService.ts
import { Telegraf } from 'telegraf';

class TelegramService {
  private bot: Telegraf;

  notify(event: ZenithEvent): void {
    // Format event as Telegram message with inline keyboard
    this.bot.telegram.sendMessage(CHAT_ID, formatEvent(event), {
      reply_markup: buildInlineKeyboard(event),  // Approve/Deny/View buttons
    });
  }

  // Webhook receives button presses → routes to approval or task service
  handleCallback(callbackQuery: CallbackQuery): void { ... }
}
```

Configuration: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` in `.env`.

---

## Feature Catalog (26 Panels)

| # | Panel | Description | Data Source |
|---|-------|-------------|-------------|
| 1 | **Mission Overview** | Active agents, task queue depth, pending approvals, system status | OpenClaw: system-presence, session.list |
| 2 | **Agent Fleet** | All agents with status, lane, current task, role (orchestrator/sub-agent) | OpenClaw: agent.list + events |
| 3 | **Agent Activity Visualizer** | Force-directed live graph: nodes=agents, edges=collaboration, task ownership | OpenClaw: event stream |
| 4 | **Agent Editor** | Edit SOUL.md, AGENTS.md, HEARTBEAT.md, IDENTITY.md per agent | OpenClaw: agent.config.get/set |
| 5 | **Task Kanban** | State-machine kanban (8 columns), routing-aware, drag transitions validated | OpenClaw + SQLite |
| 6 | **Task Dispatch** | Send tasks to orchestrators with PKOS context enrichment | OpenClaw: send + PKOS |
| 7 | **Approval Queue** | Pending exec approvals + content approvals with Telegram shortcut | OpenClaw: exec.approval.list |
| 8 | **Live Feed** | Real-time event stream from all agents | OpenClaw: event stream |
| 9 | **Session Viewer** | Full session transcripts per agent, save insights to PKOS | OpenClaw: session.transcript |
| 10 | **X Content Pipeline** | Ideas→Drafts→Review→Scheduled→Published for X posts | SQLite + X API |
| 11 | **Task Manager** | Work + personal task inbox, dispatch to orchestrator agents | SQLite + OpenClaw |
| 12 | **Agent Teams** | Named persistent teams, one-click deploy, orchestrator designation | teams.json |
| 13 | **Tools Browser** | Browse 5,700+ OpenClaw skills/tools available to agents | OpenClaw: tools.catalog |
| 14 | **Heartbeat Manager** | Visual cron editor for HEARTBEAT.md automation schedules | OpenClaw: agent.config |
| 15 | **Channel Manager** | View/configure message channels including Telegram | OpenClaw: channel.list |
| 16 | **Memory Browser** | Browse agent memory (vector markdown) + PKOS knowledge | OpenClaw + PKOS MCP |
| 17 | **Analytics Dashboard** | Task metrics, agent performance, orchestrator efficiency, cost | SQLite aggregates |
| 18 | **System Health** | OpenClaw Gateway, PKOS MCP, Telegram bot, queue health | Multiple sources |
| 19 | **Notification Center** | Approvals, completions, errors — browser + Telegram sync | Event stream + SQLite |
| 20 | **Settings** | Gateway URL, PKOS config, Telegram bot token, X API keys | .env + local config |
| 21 | **Global Search** | Search OpenClaw sessions AND PKOS knowledge simultaneously | SQLite FTS5 + PKOS |
| 22 | **PKOS Chat** | Natural language Q&A over PKOS knowledge base (`pkos_ask`) | PKOS MCP |
| 23 | **PKOS Memory Manager** | Browse/add/remove PKOS memories, view stats, bulk import docs | PKOS MCP |
| 24 | **Telegram Manager** | Bot config, notification rules, message history, command setup | TelegramService |
| 25 | **Logs** | Detailed execution logs, error traces, audit trail | OpenClaw events + SQLite |
| 26 | **Orchestrator View** | Dedicated view showing orchestrator→sub-agent delegation trees | OpenClaw: session graph |

---

## Agent Teams

Persistent team definitions stored in `~/.claude/zenith/teams.json`:

```json
{
  "teams": [
    {
      "id": "content-team",
      "name": "Content Team",
      "description": "X content creation and publishing",
      "agents": [
        { "agentId": "quill", "role": "lead", "lane": "main" },
        { "agentId": "artist", "role": "support", "lane": "subagent" },
        { "agentId": "qa", "role": "reviewer", "lane": "subagent" }
      ],
      "workflow": "lead drafts → support creates visuals → reviewer checks",
      "lastDeployed": "2026-03-30T14:00:00Z"
    },
    {
      "id": "research-squad",
      "name": "Research Squad",
      "description": "Multi-source deep research",
      "agents": [
        { "agentId": "claude-researcher", "role": "lead" },
        { "agentId": "gemini-researcher", "role": "support" },
        { "agentId": "grok-researcher", "role": "support" },
        { "agentId": "perplexity-researcher", "role": "support" }
      ]
    }
  ]
}
```

Deploy a team = dispatch coordinated tasks to all team agents via OpenClaw.

---

## X API Integration (Human-in-the-Loop)

```
Content Lifecycle:
  1. Idea created in ZENITH (manual or from agent suggestion)
  2. Task dispatched to Quill agent via OpenClaw: "Draft X thread about [topic]"
  3. Quill drafts content → result appears in "Drafts" column
  4. Content moves to "Review" → ZENITH shows preview with:
     - Character count per tweet
     - Thread structure visualization
     - Media attachment slots
  5. USER APPROVES in approval queue:
     [✅ Approve & Schedule] [✏️ Edit] [❌ Reject → agent redrafts]
  6. On approve → X API v2 posts/schedules the thread
  7. Published content shows engagement metrics (likes, RTs, views)

X API Configuration:
  - API keys stored in ~/.claude/zenith/.env
  - OAuth 2.0 with PKCE for user authentication
  - Rate limiting: 50 tweets/day (free tier) or 100/day (basic)
```

---

## Data Flow

### ZENITH Backend Role

The backend is a **proxy + aggregator**:

1. **WebSocket proxy:** Maintains persistent connection to OpenClaw Gateway, relays events to browser
2. **API aggregator:** Wraps OpenClaw RPC methods as REST endpoints for the frontend
3. **Local state:** SQLite stores dashboard-specific data (tasks, content pipeline, teams, analytics)
4. **X API client:** Handles OAuth, posting, engagement tracking

### What's Stored Where

| Data | Storage | Why |
|------|---------|-----|
| Agent definitions | OpenClaw VPS (workspace files) | Source of truth for execution |
| Agent status/events | OpenClaw Gateway (real-time) | Live state |
| Task inbox/backlog | ZENITH SQLite | Pre-dispatch, dashboard-only |
| Content pipeline | ZENITH SQLite | Workflow state with X API integration |
| Team definitions | ZENITH `teams.json` | Dashboard configuration |
| Analytics/metrics | ZENITH SQLite | Aggregated from OpenClaw events |
| Session transcripts | OpenClaw VPS (JSONL) | Source of truth |
| UI preferences | ZENITH localStorage + SQLite | Dashboard config |

---

## Networking: VPS Connection

OpenClaw Gateway binds to port 18789. Options for ZENITH to connect:

| Method | Pros | Cons |
|--------|------|------|
| **Direct expose (recommended)** | Simple, low latency | Requires firewall + auth token |
| **SSH tunnel** | Secure, no port exposure | Adds latency, tunnel maintenance |
| **Reverse proxy (nginx)** | TLS, domain name, standard ports | Extra config layer |
| **Cloudflare Tunnel** | Zero exposed ports, TLS free | Cloudflare dependency, latency |

**Recommended:** Expose port 18789 with firewall rules (allow only your IP) + `OPENCLAW_GATEWAY_TOKEN` authentication. The Gateway Protocol already supports token-based auth in the handshake.

---

## Project Structure

```
~/.claude/zenith/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── .env                          # OPENCLAW_GATEWAY_URL, OPENCLAW_TOKEN, X_API_*,
│                               #   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
│                               #   PKOS_MCP_URL (mcp.tariqvps.com/mcp)
│
├── server/
│   ├── index.ts                  # Express + WebSocket server
│   ├── config.ts                 # Env var loading, defaults
│   ├── gateway/
│   │   ├── connection.ts         # OpenClaw WebSocket connection manager
│   │   ├── handshake.ts          # Protocol v3 handshake
│   │   ├── rpc.ts                # RPC request/response handler
│   │   └── events.ts             # Event stream handler
│   ├── routes/
│   │   ├── agents.ts             # Proxy to agent.* RPC methods
│   │   ├── tasks.ts              # Local task CRUD + OpenClaw dispatch
│   │   ├── content.ts            # X content pipeline CRUD
│   │   ├── approvals.ts          # Proxy to exec.approval.* methods
│   │   ├── teams.ts              # Team CRUD (local)
│   │   ├── analytics.ts          # SQLite aggregate queries
│   │   ├── search.ts             # FTS5 search
│   │   └── system.ts             # Health, presence, config
│   ├── services/
│   │   ├── XApiService.ts        # X/Twitter API v2 client
│   │   ├── TelegramService.ts    # Telegraf bot, approval callbacks, notifications
│   │   ├── PKOSService.ts        # PKOS MCP client wrapper (all 8 tools)
│   │   ├── OrchestrationService.ts # Track orchestrator→sub-agent delegation trees
│   │   ├── EventLogger.ts        # Persist events to SQLite
│   │   └── AnalyticsService.ts   # Compute metrics from events
│   ├── db/
│   │   ├── schema.sql            # Tasks, content, analytics tables
│   │   └── sqlite.ts             # DB connection
│   └── types/
│       └── openclaw.ts           # OpenClaw Protocol v3 type definitions
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── stores/
│   │   ├── gatewayStore.ts       # OpenClaw connection state
│   │   ├── agentStore.ts         # Agent fleet state + role (orchestrator/sub-agent)
│   │   ├── taskStore.ts          # Task state machine (TaskState enum) + routing
│   │   ├── contentStore.ts       # X content pipeline
│   │   ├── approvalStore.ts      # Pending approvals
│   │   ├── teamStore.ts          # Team compositions
│   │   ├── eventStore.ts         # Live event feed
│   │   ├── pkosStore.ts          # PKOS search results, stats, chat history
│   │   ├── orchestrationStore.ts # Delegation trees for orchestrator→sub-agent
│   │   └── uiStore.ts            # UI state, active panel
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Shell.tsx         # App shell with chrome + sidebar
│   │   │   ├── SideRail.tsx      # Navigation rail
│   │   │   └── StatusBar.tsx     # Bottom status bar
│   │   ├── panels/
│   │   │   ├── MissionOverview.tsx
│   │   │   ├── AgentFleet.tsx
│   │   │   ├── AgentActivityVisualizer.tsx  # D3 force-directed graph
│   │   │   ├── AgentActivityTimeline.tsx    # Timeline + Matrix views
│   │   │   ├── AgentEditor.tsx
│   │   │   ├── OrchestratorView.tsx         # Delegation tree visualization
│   │   │   ├── TaskKanban.tsx               # State-machine kanban (8 cols)
│   │   │   ├── TaskDispatch.tsx
│   │   │   ├── ApprovalQueue.tsx
│   │   │   ├── LiveFeed.tsx
│   │   │   ├── SessionViewer.tsx
│   │   │   ├── PKOSChat.tsx
│   │   │   ├── PKOSMemoryManager.tsx
│   │   │   ├── TelegramManager.tsx
│   │   │   ├── ContentPipeline.tsx
│   │   │   ├── TaskManager.tsx
│   │   │   ├── AgentTeams.tsx
│   │   │   ├── ToolsBrowser.tsx
│   │   │   ├── HeartbeatManager.tsx
│   │   │   ├── ChannelManager.tsx
│   │   │   ├── MemoryBrowser.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── SystemHealth.tsx
│   │   │   ├── NotificationCenter.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── GlobalSearch.tsx
│   │   │   ├── PKOSKnowledge.tsx
│   │   │   └── Logs.tsx
│   │   ├── shared/
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── MonacoEditor.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── LaneIndicator.tsx
│   │   │   └── ApprovalCard.tsx
│   │   └── ui/                   # shadcn/ui components
│   ├── hooks/
│   │   ├── useGateway.ts         # OpenClaw WebSocket hook
│   │   ├── useApprovals.ts       # Approval polling/events
│   │   └── useKeyboard.ts       # Keyboard shortcuts
│   └── lib/
│       ├── api.ts                # REST API client
│       ├── gateway.ts            # WebSocket client
│       └── utils.ts
│
└── public/
    └── favicon.svg
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Project scaffolding (Vite + React + Express + Bun)
- OpenClaw Gateway connection (WebSocket handshake, Protocol v3 RPC wrapper)
- Agent Fleet panel with role badges (orchestrator / sub-agent)
- Live Feed panel (event stream relay)
- Dark theme shell with glassmorphism
- System Health (Gateway + PKOS + Telegram status)
- SQLite schema (tasks, events, content, analytics)

### Phase 2: Task Kanban + Orchestration (Week 3-4)
- TaskState machine (8 states, validated transitions)
- Task Kanban — columns are routing states, drag enforces valid transitions
- Task Dispatch with PKOS context enrichment
- Approval Queue (exec.approval.list/resolve) — also sends Telegram notification
- Orchestrator View — delegation tree visualization
- OrchestrationService — track orchestrator→sub-agent relationships from events

### Phase 3: Agent Activity Visualizer (Week 5-6)
- D3 force-directed graph (react-force-graph) with spring physics
- Agent nodes: glassmorphic cards, status pulse, live task label
- Collaboration edges: animated, color-coded by type
- Task Ownership Log (scrollable history below graph)
- Timeline View (horizontal gantt per agent)
- Matrix View (task × agent ownership grid)
- Agent Editor (SOUL.md, AGENTS.md, HEARTBEAT.md via Monaco)
- Agent Teams (CRUD + deploy)
- Heartbeat Manager (visual cron editor)

### Phase 4: PKOS + Telegram (Week 7-8)
- PKOSService connecting to mcp.tariqvps.com/mcp (all 8 tools)
- PKOS Chat panel (pkos_ask natural language Q&A)
- PKOS Memory Manager panel (browse/add/remove/stats)
- Global Search querying both OpenClaw sessions AND PKOS
- TelegramService (Telegraf bot, approval inline keyboard)
- Telegram Manager panel (bot config, notification rules)
- Approval Queue → push Telegram notification when new approval arrives

### Phase 5: Content + Analytics (Week 9-10)
- X Content Pipeline (Ideas→Drafts→Review→Scheduled→Published Kanban)
- X API integration (OAuth 2.0 PKCE, post/schedule, engagement metrics)
- Human-in-the-loop approval gate for X posts
- Session Viewer (transcripts + save to PKOS)
- Analytics Dashboard (metrics from SQLite aggregates)
- Task Manager (personal + work inbox)

### Phase 6: Polish (Week 11-12)
- Command Palette (Cmd+K — search agents, tasks, PKOS, sessions)
- Keyboard shortcuts (j/k navigation, Enter to open, Esc to close)
- Notification Center (aggregated from all sources)
- Logs panel (audit trail)
- Channel Manager
- Tools Browser
- Performance: virtualized lists, lazy panel loading, D3 canvas rendering

---

## Verification Plan

1. OpenClaw Gateway handshake succeeds → Agent Fleet populates
2. Agent Activity Visualizer shows live nodes, edges animate on events
3. Task state machine: create task → route through all states → verify transitions enforced
4. Dispatch task → orchestrator receives → delegates to sub-agent → Orchestrator View shows delegation tree
5. Approval Queue triggers Telegram message → user taps Approve in Telegram → OpenClaw execution resumes
6. PKOS search from Task Dispatch returns relevant memories and attaches as context
7. pkos_ask in PKOS Chat returns correct answer from knowledge base
8. Agent Editor reads SOUL.md from VPS → edits in Monaco → saves back to VPS
9. X Content Pipeline: idea created → Quill drafts → approval gate → X API posts → engagement metrics populate
10. Agent Teams deployed → coordinated multi-agent task starts with correct orchestrator routing

---

# OPENCLAW IMPLEMENTATION BRIEF
## Token-Optimized Subagent Delegation Plan

**Orchestrator instruction:** Read this section and delegate each numbered task to a subagent in parallel. Each subagent works in `~/.claude/zenith/`. Subagents may run concurrently except where marked `[DEPENDS ON]`. Subagents must not exceed their scope. When all subagents complete, orchestrator runs final integration check.

---

### CONTEXT BLOCK (inject into every subagent)
```
PROJECT: ZENITH — OpenClaw mission control dashboard
STACK: Bun runtime, Vite+React 19 frontend (port 3000), Express backend (port 3001)
STYLING: Tailwind CSS 4, shadcn/ui, Framer Motion, Lucide React icons, Geist+JetBrains Mono fonts
STATE: Zustand stores
DB: better-sqlite3 (WAL mode) at server/zenith.db
THEME: Aurora cosmos background (deep indigo #0d0d2b base, 3 animated radial gradient orbs: violet #8b5cf6/0.45, cyan #06b6d4/0.35, emerald #10b981/0.30). Glass panels: rgba(255,255,255,0.07) + backdrop-blur-24px + top specular border.
COLORS: violet=orchestrators, cyan=active/flow, emerald=success, amber=approval, rose=error, slate=idle
AGENT NODES: halo rings (orchestrator=double violet ring, active=rotating cyan dash, idle=slate 40%)
ROOT: ~/.claude/zenith/
```

---

### TASK 1 — Foundation & Backend Scaffold
**Agent:** Engineer
**Scope:** Project setup, Express server, OpenClaw Gateway connection

```
Create ~/.claude/zenith/ with this exact structure:
  package.json (bun, scripts: dev/build/start)
  tsconfig.json, vite.config.ts, tailwind.config.ts
  .env.example (OPENCLAW_GATEWAY_URL, OPENCLAW_GATEWAY_TOKEN, PKOS_MCP_URL,
                TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, X_API_KEY, X_API_SECRET)
  server/index.ts — Express on port 3001, serves /api/v1/*, upgrades /ws
  server/config.ts — env loading with zod validation
  server/gateway/connection.ts — WebSocket to OPENCLAW_GATEWAY_URL, auto-reconnect
  server/gateway/handshake.ts — OpenClaw Protocol v3 challenge-response:
    receive connect.challenge {nonce,ts} →
    send {type:req,method:connect,params:{minProtocol:3,maxProtocol:3,
    role:operator,scopes:[operator.read,operator.write],
    auth:{token:OPENCLAW_GATEWAY_TOKEN},deviceInfo:{name:ZENITH,type:dashboard}}} →
    handle hello-ok (store deviceToken)
  server/gateway/rpc.ts — rpcCall(method,params):Promise<any> with pending Map
  server/gateway/events.ts — parse {type:event} frames, emit to EventEmitter
  server/ws/relay.ts — relay OpenClaw events to browser WebSocket clients
  server/db/sqlite.ts — better-sqlite3 WAL, run schema.sql on init
  server/db/schema.sql — tables: tasks, content_items, teams, events_log, analytics
  server/routes/system.ts — GET /api/v1/health (gateway status, process uptime)

VERIFY: bun run dev starts without error, /api/v1/health returns {gateway:"connected"}
```

---

### TASK 2 — Frontend Shell + Aurora Background
**Agent:** Designer
**[DEPENDS ON: TASK 1 scaffold]**
**Scope:** App shell, aurora background, glass panel system, navigation

```
src/main.tsx — React 19, strict mode, router
src/App.tsx — Shell layout
src/router.tsx — react-router v7, routes for each view
src/styles/globals.css — Tailwind base + aurora CSS variables + glass utility classes

Aurora background (src/components/layout/AuroraBackground.tsx):
  Fixed fullscreen div, z-0, pointer-events-none
  Base: bg-[#0d0d2b]
  3 absolutely positioned divs with radial-gradient orbs:
    Orb1: violet rgba(139,92,246,0.45), 600px circle, blur-[120px], animate float-1 28s
    Orb2: cyan rgba(6,182,212,0.35), 700px circle, blur-[140px], animate float-2 35s
    Orb3: emerald rgba(16,185,129,0.30), 500px circle, blur-[100px], animate float-3 42s
  Noise overlay: SVG fractal noise at 3.5% opacity, mix-blend-mode overlay
  Keyframes: float-1/2/3 translate across different paths, smooth infinite loop

Glass utilities (tailwind.config.ts extend):
  glass-panel: bg-white/7 backdrop-blur-2xl saturate-180 border border-white/12
               rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_24px_64px_rgba(0,0,0,0.4)]
  glass-panel-hover: hover:bg-white/11 hover:border-white/22

Shell layout (src/components/layout/Shell.tsx):
  z-10 relative flex flex-col h-screen
  Chrome bar: 56px, glass-panel, flex items-center, "✦ ZENITH" logo (Geist bold),
    nav pills [Dashboard|Agents|Tasks|Content|Business|Memory|System],
    right: search icon (Cmd+K), clock (JetBrains Mono), live dot (cyan pulse)
  Body: flex flex-row flex-1 overflow-hidden
  SideRail: 56px wide glass-panel, icon-only navigation with Framer Motion tooltips
  Main: flex-1 overflow-auto p-4 grid gap-4

Status bar: 36px bottom glass strip, monospace, shows:
  gateway status dot + label | PKOS status | Telegram status | queue depth

Framer Motion entrance: panels use variants={fadeIn} with staggerChildren 0.08s

VERIFY: `bun run dev` shows aurora background, glass chrome bar, side rail icons visible
```

---

### TASK 3 — Agent Fleet + Activity Visualizer
**Agent:** Engineer (senior)
**[DEPENDS ON: TASK 1, TASK 2]**
**Scope:** Agent Fleet panel, D3 force graph visualizer, agent state tracking

```
server/routes/agents.ts:
  GET /api/v1/agents — calls rpc agent.list, returns parsed list with role field
  GET /api/v1/agents/:id/config — calls rpc agent.config.get for all workspace files
  PUT /api/v1/agents/:id/config — calls rpc agent.config.set (body: {file, content})

src/stores/agentStore.ts (Zustand):
  agents: AgentState[]  — populated from /api/v1/agents + WS events
  AgentState: {id, name, role:'orchestrator'|'sub-agent'|'specialist'|'monitor',
               status:'active'|'idle'|'error', lane, currentTask, color, stats}
  updateFromEvent(event) — handler for agent.status WS events

src/components/panels/AgentFleet.tsx:
  Grid of agent cards (glass-panel, 2-4 cols responsive)
  Each card: colored halo ring (Framer Motion animate), agent name+role badge,
    current task text (truncated, live), status dot, mini stats bar
  Halo ring: orchestrator=double ring violet, active=rotating dash cyan, idle=slate 40%
  Click → navigate to AgentEditor

src/components/panels/AgentActivityVisualizer.tsx:
  react-force-graph-2d (ForceGraph2D component)
  Nodes: agents (color=role, size=12 base, +4 if active)
  Links: collaboration edges from orchestrationStore (color by type: delegation/handoff/approval)
  nodeCanvasObject: draw halo rings, name label, status pulse using canvas API
  linkDirectionalParticles: 3 particles, speed 0.004, color=link.color (data flow animation)
  linkDirectionalArrowLength: 6 for delegation links
  Below graph: Task Ownership Log table (agent | task | start | end | duration | status)
  Tab switcher: [Graph] [Timeline] [Matrix]

AgentActivityTimeline.tsx:
  Horizontal bar chart (Recharts GanttChart-style)
  X-axis: time (last 2h), Y-axis: agents
  Bars: colored by task status, hover tooltip shows task name
  Live: new bars append as tasks start

AgentActivityMatrix.tsx:
  Table: rows=tasks (last 20), cols=agents
  Cell: ■ (agent handled this task), color=role color
  Sortable by time, task name, agent

VERIFY: Fleet shows all agents from OpenClaw. Visualizer renders force graph.
  Nodes animate when events arrive via WebSocket. Timeline updates in real-time.
```

---

### TASK 4 — Task System (State Machine + Kanban)
**Agent:** Engineer
**[DEPENDS ON: TASK 1, TASK 2]**
**Scope:** Task state machine, Kanban with routing enforcement, dispatch

```
TASK STATE MACHINE (shared between server and client):
  shared/taskStates.ts:
    type TaskState = 'inbox'|'routing'|'queued'|'executing'|
                    'waiting_approval'|'waiting_review'|'completed'|'failed'|'archived'
    TRANSITIONS: Record<TaskState, TaskState[]>  (see plan for full map)
    COLUMN_CONFIG: Record<TaskState, {label,color,animated?,urgent?,collapsed?}>
    isValidTransition(from,to): boolean

server/routes/tasks.ts:
  GET/POST/PUT/DELETE /api/v1/tasks — CRUD against tasks SQLite table
  POST /api/v1/tasks/:id/dispatch — validate state→routing, call rpc send with
    idempotency key, update state→queued on success
  POST /api/v1/tasks/:id/transition — validate via isValidTransition, reject if invalid

server/routes/approvals.ts:
  GET /api/v1/approvals — rpc exec.approval.list
  POST /api/v1/approvals/:id/resolve — rpc exec.approval.resolve {approved:bool,reason}

src/stores/taskStore.ts:
  tasks: Task[], getByState(state):Task[]
  transition(id,to): calls /api/v1/tasks/:id/transition, optimistic update + rollback

src/components/panels/TaskKanban.tsx:
  @dnd-kit/core for drag-and-drop
  9 columns (TaskState values), horizontal scroll
  canDrop(from,to): uses isValidTransition — invalid targets show red overlay + tooltip
  Task card: glass-panel compact, title, agent badge, priority dot, time elapsed
  Animated: Framer Motion layoutId for smooth card movement between columns
  'executing' column: animated cyan glow border, cards show live progress

src/components/panels/TaskDispatch.tsx:
  Form: task title textarea, agent selector (from agentStore), lane, priority, mode
  PKOS context section: "Enrich with PKOS" button → calls pkosService.searchForTask(title)
    → shows memory results as selectable chips (selected = attached as context)
  Approval toggles: [before file ops] [before posting] [before destructive cmds]
  Submit → POST /api/v1/tasks (creates in inbox) → auto-dispatch if agent selected

src/components/panels/ApprovalQueue.tsx:
  Live list from /api/v1/approvals + WS exec.approval.requested events
  ApprovalCard: amber glass-panel, agent name+session, tool+args, context excerpt
  Content approval (X posts): shows full thread preview with char counts
  Actions: Approve / Deny / Ask Agent (sends message back to session)
  Amber pulse animation on side rail icon when queue > 0

VERIFY: Tasks flow through all states. Invalid drags are blocked.
  Dispatch sends to OpenClaw. Approval card appears when exec.approval event arrives.
```

---

### TASK 5 — PKOS + Telegram Integrations
**Agent:** Engineer
**[DEPENDS ON: TASK 1]**
**Scope:** PKOS service layer, Telegram bot, notification system

```
server/services/PKOSService.ts:
  MCP HTTP client to PKOS_MCP_URL (/mcp endpoint)
  Methods wrapping all 8 tools:
    search(query,limit=5): pkos_search
    remember(content,tags?): pkos_remember
    ask(question): pkos_ask
    browse(domain?): pkos_browse
    addDocument(path): pkos_add_document
    addUrl(url): pkos_add_url
    getStats(): pkos_get_stats
    forget(id): pkos_forget

server/services/TelegramService.ts:
  Telegraf bot with TELEGRAM_BOT_TOKEN
  notify(event:ZenithEvent): format → sendMessage to TELEGRAM_CHAT_ID
    - Task completed: "✅ {agent}: {task}\n[View Result]"
    - Approval needed: "⚠️ {agent} needs approval: {tool} {args}\n✅ Approve  ❌ Deny"
      Uses inline keyboard with callback_data: "approve:{id}" / "deny:{id}"
  handleCallback(query): parse callback_data → POST /api/v1/approvals/:id/resolve
  Commands: /status → returns current agent fleet + queue depth

server/routes/pkos.ts — REST wrapper for all PKOSService methods
server/routes/telegram.ts — POST /api/v1/telegram/notify (internal trigger)

src/stores/pkosStore.ts:
  chatHistory: Message[], searchResults: PKOSResult[], stats: PKOSStats
  ask(q): calls /api/v1/pkos/ask, appends to chatHistory

src/components/panels/PKOSChat.tsx:
  Chat interface: glass-panel, message list (user=right, pkos=left), input box
  Messages animate in with Framer Motion (slide up + fade)
  Each AI response has "Save to PKOS" button (pkos_remember)

src/components/panels/PKOSMemoryManager.tsx:
  Stats bar: total memories, recent adds, domain counts (from pkos_get_stats)
  Browse view: domain tree from pkos_browse
  Search + Forget: search then mark entries for deletion

src/components/panels/TelegramManager.tsx:
  Bot status indicator, chat ID display
  Notification rule toggles (which events trigger Telegram messages)
  Recent messages log (last 20 notifications sent)
  Test button: sends test message to TELEGRAM_CHAT_ID

VERIFY: pkos_search returns results. Telegram bot sends message on task complete.
  Approval inline keyboard in Telegram resolves approval in ZENITH.
```

---

### TASK 6 — Content Pipeline + X API
**Agent:** Engineer
**[DEPENDS ON: TASK 1, TASK 4]**
**Scope:** X content Kanban, X API v2 client, engagement tracking

```
Content item states: idea→drafting→draft→review→scheduled→published→archived

server/services/XApiService.ts:
  OAuth 2.0 PKCE client (x-api key/secret from .env)
  tweet(text): POST /2/tweets
  scheduleTweet(text, scheduledFor): POST /2/tweets with scheduled_at
  getEngagement(tweetId): GET /2/tweets/:id with expansions
  parseThread(content): split on \n\n into individual tweets, validate 280 chars each

server/routes/content.ts:
  CRUD for content_items SQLite table
  POST /api/v1/content/:id/dispatch — assign OpenClaw agent (Quill) to draft
  POST /api/v1/content/:id/approve — moves to scheduled or published + calls XApiService
  GET /api/v1/content/:id/metrics — polls XApiService for engagement

src/components/panels/ContentPipeline.tsx:
  5-column Kanban (idea|draft|review|scheduled|published)
  Column header: count badge
  Content card: title, stage badge, agent (if assigned), char count meter (for drafts)
  Draft column: shows "[Agent] drafting..." with spinner
  Review column: card expands to show full thread preview with:
    - Character count bar per tweet (green <280, red if over)
    - Thread numbering (1/8, 2/8...)
    - [Approve & Post] [Edit] [Reject → Redraft] buttons
  Published column: engagement metrics (♥ RT 👁 impressions)
  "New Idea" button: opens modal with title + "Generate with Quill" shortcut

VERIFY: Create idea → assign to Quill → content appears in Draft → approve → X API called.
```

---

### TASK 7 — Agent Editor + Heartbeat Manager
**Agent:** Engineer
**[DEPENDS ON: TASK 1, TASK 3]**
**Scope:** Agent workspace file editor, Monaco, HEARTBEAT cron UI

```
src/components/panels/AgentEditor.tsx:
  Two-panel layout: left=file tree + stats, right=Monaco editor
  File tree lists all workspace files for selected agent:
    SOUL.md, AGENTS.md, HEARTBEAT.md, IDENTITY.md, USER.md, TOOLS.md
    (fetched from GET /api/v1/agents/:id/config)
  Monaco editor: language=markdown, theme=custom dark (aurora colors)
    tokenizer highlights YAML frontmatter in SOUL.md
  Bottom toolbar: [Save to VPS] [Preview] [Diff from VPS] [Discard]
  Stats sidebar: total tasks run, success rate, avg duration (from analytics)
  Save: PUT /api/v1/agents/:id/config {file, content}

src/components/panels/HeartbeatManager.tsx:
  Parse HEARTBEAT.md content (fetched via agent.config)
  Visual cron table: columns=agent, schedule, description, last_run, next_run, status
  "Edit" opens inline cron expression builder:
    dropdowns for minute/hour/day/month/weekday + natural language input
    "every weekday at 9am" → parses to "0 9 * * 1-5"
  Preview: "Next 5 runs:" list
  Save writes back to HEARTBEAT.md via agent.config.set

VERIFY: SOUL.md loads in Monaco. Edit and save round-trips to VPS unchanged except edit.
  Heartbeat cron table shows all agents' scheduled tasks.
```

---

### TASK 8 — Analytics, Search, Session Viewer
**Agent:** Engineer
**[DEPENDS ON: TASK 1, TASK 4]**
**Scope:** Analytics aggregation, global search, session transcript viewer

```
server/services/AnalyticsService.ts:
  All queries against events_log SQLite table (populated by EventLogger)
  getTaskMetrics(days): {total,completed,failed,avgDuration,byAgent}
  getAgentPerformance(): {agentId,successRate,avgDuration,taskCount}[]
  getQueueHealth(): {mainLane,subagentLane,avgWait}
  getCostEstimate(): based on model usage from session events

src/components/panels/Analytics.tsx:
  4 KPI cards (Recharts ResponsiveContainer): tasks/day, success rate, avg duration, queue
  Bar chart: task completion by agent (last 7 days)
  Line chart: task volume over time
  Pie chart: task states distribution
  All charts: glass-panel background, aurora color palette

src/components/panels/GlobalSearch.tsx:
  Command-K palette (Framer Motion modal, center screen, glass-panel large)
  Input: searches simultaneously:
    - SQLite FTS5: tasks, agents, content items
    - /api/v1/pkos/search (PKOS memories)
    - session transcripts
  Results grouped by type with icons
  Arrow keys navigate, Enter opens result

src/components/panels/SessionViewer.tsx:
  Select agent → GET /api/v1/sessions?agentId=X (proxies rpc session.list)
  Select session → GET transcript → render as chat (user=right, agent=left glass bubbles)
  "Save insight to PKOS" button: selects text → POST /api/v1/pkos/remember

server/routes/sessions.ts:
  GET /api/v1/sessions — rpc session.list
  GET /api/v1/sessions/:id/transcript — rpc session.transcript

VERIFY: Analytics charts populate from event data. Cmd+K searches across all sources.
  Session transcript displays correctly.
```

---

### FINAL INTEGRATION (Orchestrator runs after all tasks complete)

```
1. Merge all panel components into src/components/panels/ index.ts
2. Wire all stores: confirm no circular dependencies
3. Add panels to router: each view imports correct panels
4. Add Framer Motion stagger to all panel entry animations
5. Test full flow:
   a. Open ZENITH → aurora loads → chrome appears → panels stagger in
   b. Agent fleet populates from OpenClaw
   c. Activity visualizer shows agents with halo rings
   d. Create task → dispatch → approve → complete → X posts
   e. Telegram sends approval notification
   f. PKOS chat answers question
6. bun run build — verify no type errors
7. Add to ~/.claude/launch.json as "ZENITH" server entry
```

---

### OPENCLAW MEMORY USAGE (QMD Pattern)

**Principle:** Agents never receive long context injections. Instead, every decision, output, and interface contract is written to OpenClaw memory (vector-indexed markdown). Downstream agents query memory to get exactly what they need. This keeps every agent prompt minimal and makes the build resilient to session interruptions.

#### Memory Schema (written by agents as they work)

```
Tag taxonomy:
  #zenith       — all ZENITH build memories
  #schema       — DB schema, types, contracts
  #api          — API routes + response shapes
  #stores       — Zustand store shapes
  #ui           — Component contracts + props
  #decisions    — Architectural decisions + reasons
  #blockers     — Issues to flag to orchestrator
  #done         — Completed milestones

Memory entries agents write:
  TASK 1 → writes:
    "ZENITH API base URL and port config" #zenith #api
    "SQLite schema: tasks, events_log, content, teams tables" #zenith #schema
    "OpenClaw RPC wrapper: rpcCall(method,params) returns Promise<any>" #zenith #api
    "WebSocket relay: broadcasts {type,event,payload} to all browser clients" #zenith #api

  TASK 2 → reads: #zenith #api (for env vars, ports)
  TASK 2 → writes:
    "Glass panel CSS classes: glass-panel, glass-panel-hover" #zenith #ui
    "Aurora animation CSS keyframes: float-1/2/3" #zenith #ui
    "Shell layout: AuroraBackground→Shell→SideRail+Main" #zenith #ui
    "Color semantic map: violet=orchestrators cyan=active emerald=success..." #zenith #ui #decisions

  TASK 3 → reads: #zenith #api (agent endpoints), #zenith #ui (glass classes)
  TASK 3 → writes:
    "AgentState type: {id,name,role,status,lane,currentTask,color,stats}" #zenith #schema
    "AgentStore.updateFromEvent: handles agent.status WS events" #zenith #stores

  TASK 4 → reads: #zenith #schema #zenith #api
  TASK 4 → writes:
    "TaskState machine: 9 states, TRANSITIONS map, isValidTransition fn" #zenith #schema
    "Task CRUD: POST /api/v1/tasks, PUT /api/v1/tasks/:id/transition" #zenith #api
    "Dispatch flow: inbox→routing (validate)→rpc send→queued" #zenith #decisions

  TASK 5 → reads: #zenith #api
  TASK 5 → writes:
    "PKOSService methods: search/remember/ask/browse/addDocument/addUrl/getStats/forget" #zenith #api
    "TelegramService: notify(event) sends formatted message + inline keyboard" #zenith #api
    "Approval callback: Telegram 'approve:{id}' → POST /api/v1/approvals/:id/resolve" #zenith #api

  TASK 6 → reads: #zenith #schema (tasks), #zenith #api (dispatch)
  TASK 7 → reads: #zenith #api (agent.config endpoints)
  TASK 8 → reads: #zenith #schema, #zenith #api
```

#### Orchestrator Memory Queries (at each wave transition)

```
Wave 1 complete → Orchestrator queries: "ZENITH API contract" → feeds into Wave 2 agent prompts
Wave 2 complete → Orchestrator queries: "ZENITH glass classes + TaskState schema" → feeds TASK 3
Wave 3 complete → Orchestrator queries: all #zenith #blockers → resolve before final integration
Final:          → Orchestrator queries: all #zenith #decisions → writes project summary memory
```

#### Token Efficiency Gain

Without QMD: each agent needs 3,000-5,000 tokens of context injection.
With QMD: each agent needs only 200-400 tokens (task brief + 2-3 memory queries).
**~10x reduction in per-agent token cost for the entire build.**

#### Memory Persistence Benefit

If any agent session dies mid-task, the next session picks up from the last `#done` memory entry. No work is lost. The orchestrator can ask: *"What's the last completed step for TASK 4?"* and resume from there.

---

### DEPENDENCY GRAPH (for parallel execution)

```
TASK 1 (Foundation) ──► TASK 2 (UI Shell) ──► TASK 3 (Visualizer)
                    └──► TASK 4 (Tasks)    └──► TASK 5 (PKOS/TG)
                    └──► TASK 6 (Content)
                    └──► TASK 7 (Editors)
                    └──► TASK 8 (Analytics)

TASK 1 must complete first.
TASK 2 must complete before TASK 3.
TASKS 4-8 can run in parallel after TASK 1.
FINAL runs after all tasks.

Recommended parallel schedule:
  Wave 1: TASK 1 (blocking)
  Wave 2: TASK 2 + TASK 4 + TASK 5 + TASK 6 + TASK 7 + TASK 8 (parallel)
  Wave 3: TASK 3 (needs 1+2)
  Wave 4: FINAL INTEGRATION
```
