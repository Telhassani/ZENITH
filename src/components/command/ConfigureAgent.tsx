import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, CheckCircle2, ChevronDown } from 'lucide-react'

const AGENTS = [
  { id: 'a1', name: 'Nexus',  role: 'orchestrator', color: '#8b5cf6', lane: 'main' },
  { id: 'a2', name: 'Quill',  role: 'specialist',   color: '#06b6d4', lane: 'main' },
  { id: 'a3', name: 'Scout',  role: 'sub-agent',    color: '#64748b', lane: 'subagent' },
  { id: 'a4', name: 'Forge',  role: 'specialist',   color: '#06b6d4', lane: 'main' },
  { id: 'a5', name: 'Lens',   role: 'monitor',      color: '#10b981', lane: 'subagent' },
]

const MOCK_FILES: Record<string, Record<string, string>> = {
  a1: {
    SOUL: `# Nexus — Orchestrator Soul\n\nYou are Nexus, the primary orchestrator for Tariq's agent fleet.\n\n## Core Directives\n- Decompose complex tasks into atomic sub-tasks\n- Delegate to specialist agents based on capability\n- Never execute tasks yourself that can be delegated\n- Maintain full context across all delegated sessions\n\n## Decision Framework\n1. Assess task complexity and domain\n2. Select appropriate sub-agent(s)\n3. Provide full context on dispatch\n4. Monitor and aggregate results`,
    AGENTS: `# Available Agents\n\n## Quill — Content Specialist\nCapabilities: writing, X/Twitter content, long-form, editing\nTrigger: any content creation or editing task\n\n## Scout — Research Sub-Agent\nCapabilities: web search, data gathering, fact-checking\nTrigger: any research or information retrieval task\n\n## Forge — Engineering Specialist  \nCapabilities: code, architecture, debugging, PRs\nTrigger: any software engineering task\n\n## Lens — Monitor\nCapabilities: system health, metrics, alerts\nTrigger: monitoring and observability tasks`,
    HEARTBEAT: `# Heartbeat Schedule\n\n## Daily (07:00 UTC)\n- Check OpenClaw gateway health\n- Review pending approvals\n- Summarize overnight completions\n- Push digest to Telegram\n\n## Weekly (Monday 08:00 UTC)\n- Audit agent performance metrics\n- Review and update PKOS knowledge\n- Generate weekly activity report`,
    TOOLS: `# Tools Configuration\n\nmcp_pkos:\n  endpoint: https://mcp.tariqvps.com/mcp\n  tools: [search, remember, ask, browse, addDocument, addUrl, getStats, forget]\n\ntelegram:\n  bot: ZENITH_bot\n  chat_id: \${TELEGRAM_CHAT_ID}\n  notify_on: [approval_needed, task_complete, agent_error]\n\nx_api:\n  version: v2\n  auth: oauth2_pkce\n  require_approval: true`,
  },
  a2: {
    SOUL: `# Quill — Content Specialist Soul\n\nYou are Quill, a content creation specialist.\n\n## Core Directives\n- Create high-quality, engaging content\n- Match Tariq's voice and style\n- Always draft before publishing\n- Require human approval for X/Twitter posts\n\n## Content Principles\n- Lead with insight, not information\n- Short sentences. Strong verbs.\n- Build in public, share the process`,
    AGENTS: `# Quill has no sub-agents.\n\nAll content tasks are handled directly.\nFor research support, request Scout via Nexus.`,
    HEARTBEAT: `# No scheduled heartbeat for Quill.\n\nActivated on-demand by Nexus or direct dispatch.`,
    TOOLS: `# Tools\n\nx_api:\n  version: v2\n  post: requires_approval\n  schedule: allowed\n\npkos:\n  search: true\n  remember: true`,
  },
}

const ROLES = ['orchestrator', 'sub-agent', 'specialist', 'monitor']
const ROLE_COLORS: Record<string, string> = {
  orchestrator: 'text-violet-400',
  'sub-agent':  'text-slate-400',
  specialist:   'text-cyan-400',
  monitor:      'text-emerald-400',
}

type SaveState = 'idle' | 'saving' | 'saved'
type FileTab = 'SOUL' | 'AGENTS' | 'HEARTBEAT' | 'TOOLS'
const FILE_TABS: FileTab[] = ['SOUL', 'AGENTS', 'HEARTBEAT', 'TOOLS']

export function ConfigureAgent() {
  const [selectedId, setSelectedId] = useState(AGENTS[0].id)
  const [activeTab, setActiveTab] = useState<FileTab>('SOUL')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [agentRoles, setAgentRoles] = useState<Record<string, string>>(
    Object.fromEntries(AGENTS.map(a => [a.id, a.role]))
  )
  const [fileContents, setFileContents] = useState(MOCK_FILES)

  const agent = AGENTS.find(a => a.id === selectedId)!
  const files = fileContents[selectedId] ?? MOCK_FILES.a1
  const currentRole = agentRoles[selectedId]

  const handleSave = () => {
    setSaveState('saving')
    setTimeout(() => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000) }, 800)
  }

  return (
    <div className="flex h-full">
      {/* Agent list sidebar */}
      <div className="w-20 shrink-0 border-r border-white/6 flex flex-col py-3 gap-1 px-2">
        {AGENTS.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedId(a.id)}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg transition-all cursor-pointer ${
              selectedId === a.id ? 'bg-white/8 border border-white/12' : 'hover:bg-white/4 border border-transparent'
            }`}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: a.color, opacity: selectedId === a.id ? 1 : 0.6 }}
            >
              {a.name[0]}
            </span>
            <span className="text-[10px] text-slate-400 font-medium leading-tight text-center">{a.name}</span>
          </button>
        ))}
      </div>

      {/* Config panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="flex-1 flex flex-col min-w-0"
        >
          {/* Agent header */}
          <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: agent.color }}>
                {agent.name[0]}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">{agent.name}</p>
                <p className="text-[10px] font-mono text-slate-500">{agent.lane} lane</p>
              </div>
            </div>

            {/* Role selector */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/8 transition-colors cursor-pointer ${ROLE_COLORS[currentRole]}`}
              >
                {currentRole}
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showRoleMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-8 z-10 rounded-lg border border-white/10 overflow-hidden"
                    style={{ background: 'rgba(13,13,43,0.95)', backdropFilter: 'blur(16px)' }}
                  >
                    {ROLES.map(r => (
                      <button
                        key={r}
                        onClick={() => { setAgentRoles(prev => ({ ...prev, [selectedId]: r })); setShowRoleMenu(false) }}
                        className={`block w-full text-left px-4 py-2 text-xs hover:bg-white/8 transition-colors cursor-pointer ${ROLE_COLORS[r]}`}
                      >
                        {r}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* File tabs */}
          <div className="flex gap-0.5 px-3 pt-3 pb-2 shrink-0">
            {FILE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white/10 text-slate-100'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Code editor */}
          <div className="flex-1 px-3 pb-3 min-h-0">
            <textarea
              className="w-full h-full rounded-lg p-3 text-xs font-mono text-slate-300 resize-none focus:outline-none focus:border-violet-500/40 border border-white/6 leading-relaxed"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              value={files[activeTab] ?? ''}
              onChange={e => setFileContents(prev => ({
                ...prev,
                [selectedId]: { ...prev[selectedId], [activeTab]: e.target.value }
              }))}
              spellCheck={false}
            />
          </div>

          {/* Save */}
          <div className="px-3 pb-4 shrink-0">
            <motion.button
              onClick={handleSave}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                saveState === 'saved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : saveState === 'saving'
                  ? 'bg-white/8 text-slate-400 border border-white/10 cursor-not-allowed'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25'
              }`}
              disabled={saveState === 'saving'}
            >
              {saveState === 'saved'
                ? <><CheckCircle2 className="w-4 h-4" /> Saved to VPS</>
                : saveState === 'saving'
                ? <>Saving…</>
                : <><Save className="w-4 h-4" /> Save {activeTab}.md</>
              }
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
