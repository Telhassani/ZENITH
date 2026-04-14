import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database, Search, ExternalLink, ChevronDown,
  Circle, CheckCircle2, Clock, Brain, Zap,
  FolderOpen, Bookmark, Save
} from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TASKS = [
  { id: '1', text: 'Push ZENITH light mode branch to GitHub', done: false },
  { id: '2', text: 'Wire real OpenClaw Gateway connection', done: false },
  { id: '3', text: 'Add react-force-graph for agent visualizer', done: false },
  { id: '4', text: 'Write Agent Activity Visualizer component', done: false },
  { id: '5', text: 'Set up Telegram bot for approval notifications', done: true },
  { id: '6', text: 'Deploy ZENITH to tariqvps.com via Caddy', done: true },
]

const MOCK_PROJECTS = [
  { id: 'zenith',    name: 'ZENITH',           entries: 24, color: '#8b5cf6', updated: '2m ago' },
  { id: 'dermaai',   name: 'DermaAI',          entries: 11, color: '#06b6d4', updated: '1h ago' },
  { id: 'aimem',     name: 'aimem-dashboard',  entries: 18, color: '#10b981', updated: '3h ago' },
  { id: 'pkos',      name: 'PKOS',             entries: 31, color: '#f59e0b', updated: '1d ago' },
  { id: 'homelab',   name: 'Homelab',          entries: 8,  color: '#94a3b8', updated: '2d ago' },
  { id: 'content',   name: 'AI Pulse Tracker', entries: 15, color: '#f43f5e', updated: '3d ago' },
]

const MOCK_SEARCH_RESULTS = [
  {
    id: '1',
    file: '03-memory/decisions-log.md',
    line: 42,
    content: 'Memory system rebuilt on OpenClaw builtin memory. Rejected custom memory_manager.py (4 unresolved issues, extra infrastructure, exposed credentials).',
    type: 'decision',
  },
  {
    id: '2',
    file: '02-projects/zenith.md',
    line: 87,
    content: 'COMMAND MODE drawer implementation completed — 32/32 ISC criteria verified. Files: CommandDrawer.tsx, CreateProject.tsx, ConfigureAgent.tsx, SpawnAgent.tsx.',
    type: 'note',
  },
  {
    id: '3',
    file: '03-memory/patterns.md',
    line: 14,
    content: 'PATTERN: Wrapper > Symlink for SCRIPT_DIR scripts — when a bash script uses BASH_SOURCE[0] to locate sibling lib files, symlinks break. Use a wrapper script that calls the absolute path instead.',
    type: 'pattern',
  },
]

const MOCK_ACTIVE_MEMORY = [
  'User currently building ZENITH mission control dashboard for OpenClaw VPS fleet',
  'aimem-dashboard is live Phase 3 at aimem.tariqvps.com — Next.js 16 + Tremor v3',
  'Dreaming enabled every 4h, auto-promotes short-term to MEMORY.md',
  'Light mode Aurora Dawn design decided — glass bg rgba(255,255,255,0.62) on #f4f1ff',
]

const CAPTURE_TYPES = ['decision', 'note', 'pattern', 'task', 'project'] as const
type CaptureType = typeof CAPTURE_TYPES[number]

const TYPE_COLORS: Record<CaptureType | string, string> = {
  decision: 'text-violet-400',
  note:     'text-cyan-400',
  pattern:  'text-emerald-400',
  task:     'text-amber-400',
  project:  'text-slate-400',
}

const RESULT_TYPE_COLORS: Record<string, string> = {
  decision: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  note:     'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  pattern:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
}

// ─── Animations ───────────────────────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] font-mono text-slate-600">{count}</span>
      )}
    </div>
  )
}

function StatusDot({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className="text-[11px] font-mono text-slate-500">{value}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MemoryVault() {
  const [query, setQuery] = useState('')
  const [captureType, setCaptureType] = useState<CaptureType>('decision')
  const [captureText, setCaptureText] = useState('')
  const [captureDropdownOpen, setCaptureDropdownOpen] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [tasks, setTasks] = useState(MOCK_TASKS)
  const [showResults, setShowResults] = useState(false)

  const openCount = tasks.filter(t => !t.done).length

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setShowResults(e.target.value.length > 1)
  }

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const handleSave = () => {
    if (!captureText.trim()) return
    setSavedId(captureType)
    setTimeout(() => {
      setSavedId(null)
      setCaptureText('')
    }, 2000)
  }

  return (
    <motion.div
      className="flex flex-col h-full gap-0"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-4 px-0.5">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-violet-400" />
          <h1 className="text-sm font-semibold text-slate-200">Memory Vault</h1>
          <span className="text-[10px] font-mono text-slate-600 px-1.5 py-0.5 rounded bg-white/5 border border-white/8">
            QMD v2.1.0
          </span>
        </div>
        <a
          href="https://aimem.tariqvps.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 border border-white/10 hover:bg-white/8 hover:text-white transition-all group"
        >
          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
          Open full browser
        </a>
      </motion.div>

      {/* ── Main two-column layout ───────────────────────────────────────────── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* ── Left Panel ───────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto">

          {/* Search */}
          <div className="glass-panel p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search vault..."
                value={query}
                onChange={handleSearch}
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs text-slate-200 placeholder-slate-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="glass-panel p-3">
            <SectionHeader label="Status" />
            <div className="divide-y divide-white/5">
              <StatusDot color="bg-emerald-400 animate-pulse" label="Dreaming" value="2h ago" />
              <StatusDot color="bg-cyan-400"                  label="Active Memory" value="3 fragments" />
              <StatusDot color="bg-violet-400"                label="Memory Flush" value="42% context" />
              <StatusDot color="bg-slate-500"                 label="Vault entries" value="127 total" />
            </div>
          </div>

          {/* Tasks */}
          <div className="glass-panel p-3 overflow-y-auto" style={{ minHeight: '180px', maxHeight: '220px' }}>
            <SectionHeader label="Open Tasks" count={openCount} />
            <div className="flex flex-col gap-1">
              {tasks.filter(t => !t.done).map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-2 py-1.5 text-left group w-full"
                >
                  <Circle className="w-3 h-3 mt-0.5 shrink-0 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">{task.text}</span>
                </button>
              ))}
              {tasks.filter(t => t.done).slice(0, 2).map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-2 py-1.5 text-left group w-full opacity-40"
                >
                  <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
                  <span className="text-[11px] text-slate-500 line-through leading-relaxed">{task.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="glass-panel p-3">
            <SectionHeader label="Projects" count={MOCK_PROJECTS.length} />
            <div className="flex flex-col gap-1">
              {MOCK_PROJECTS.map(project => (
                <div
                  key={project.id}
                  className="flex items-center gap-2 py-1.5 rounded-lg px-1 hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: project.color }}
                  />
                  <span className="flex-1 text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors truncate">{project.name}</span>
                  <span className="text-[10px] font-mono text-slate-600 shrink-0">{project.entries}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Right Panel ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">

          {/* Search Results / Active Memory toggle */}
          <motion.div variants={fadeUp} className="glass-panel p-4 flex-1 min-h-0 overflow-y-auto">
            <AnimatePresence mode="wait">
              {showResults ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-300">Results for "{query}"</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600">{MOCK_SEARCH_RESULTS.length} matches</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {MOCK_SEARCH_RESULTS.map(result => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl border border-white/6 hover:border-white/12 hover:bg-white/4 transition-all cursor-pointer group"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${RESULT_TYPE_COLORS[result.type] || 'bg-slate-500/15 text-slate-400 border-slate-500/25'}`}>
                            {result.type}
                          </span>
                          <span className="text-[10px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors truncate">
                            {result.file}:{result.line}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed line-clamp-3">
                          {result.content}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-300">Active Memory</span>
                    <span className="text-[10px] font-mono text-slate-600">recent · balanced · 15s</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {MOCK_ACTIVE_MEMORY.map((fragment, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 26 }}
                        className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                        style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}
                      >
                        <Zap className="w-3 h-3 mt-0.5 shrink-0 text-cyan-500" />
                        <p className="text-xs text-slate-300 leading-relaxed">{fragment}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Dreaming info card */}
                  <div
                    className="mt-4 p-3 rounded-xl flex items-center gap-3"
                    style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-violet-300 font-medium mb-0.5">Dreaming Engine</p>
                      <p className="text-[10px] text-slate-500">Next consolidation in ~2h · Last run promoted 4 fragments to MEMORY.md</p>
                    </div>
                    <Clock className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  </div>

                  {/* Recent recalls */}
                  <div className="mt-4">
                    <SectionHeader label="Recent Vault Activity" />
                    <div className="flex flex-col gap-1.5">
                      {[
                        { action: 'decision', text: 'Light mode chosen for ZENITH glassmorphism', ago: '14m ago' },
                        { action: 'note',     text: 'PATTERN: Wrapper > Symlink for SCRIPT_DIR scripts', ago: '2h ago' },
                        { action: 'note',     text: 'aimem-dashboard deployed live Phase 3', ago: '4h ago' },
                        { action: 'task',     text: 'Wire real OpenClaw backend to ZENITH', ago: '6h ago' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 py-1">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${RESULT_TYPE_COLORS[item.action] || 'bg-slate-500/15 text-slate-400 border-slate-500/25'}`}>
                            {item.action}
                          </span>
                          <span className="flex-1 text-[11px] text-slate-400 truncate">{item.text}</span>
                          <span className="text-[10px] font-mono text-slate-600 shrink-0">{item.ago}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Capture Bar */}
          <motion.div variants={fadeUp} className="glass-panel p-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest shrink-0">Quick Capture</span>
              <span className="text-[10px] font-mono text-slate-700 shrink-0">⌘⇧M</span>

              {/* Type selector */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setCaptureDropdownOpen(v => !v)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-white/10 hover:bg-white/8 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <span className={`font-mono text-[11px] ${TYPE_COLORS[captureType]}`}>{captureType}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>
                <AnimatePresence>
                  {captureDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full mb-1 left-0 rounded-xl overflow-hidden z-50"
                      style={{ background: 'rgba(13,13,43,0.97)', border: '1px solid rgba(255,255,255,0.1)', minWidth: '100px', backdropFilter: 'blur(16px)' }}
                    >
                      {CAPTURE_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => { setCaptureType(type); setCaptureDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-1.5 text-[11px] font-mono hover:bg-white/8 transition-colors ${TYPE_COLORS[type]}`}
                        >
                          {type}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input */}
              <input
                type="text"
                placeholder={`Add ${captureType}...`}
                value={captureText}
                onChange={e => setCaptureText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-xs text-slate-200 placeholder-slate-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />

              {/* Save button */}
              <motion.button
                onClick={handleSave}
                whileTap={{ scale: 0.93 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all"
                style={
                  savedId
                    ? { background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }
                    : { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }
                }
              >
                {savedId ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    Save
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
