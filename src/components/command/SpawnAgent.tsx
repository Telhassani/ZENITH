import { useState } from 'react'
import { motion } from 'framer-motion'
import { Network, Bot, Cpu, Eye, Zap, CheckCircle2 } from 'lucide-react'

const ROLES = [
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    icon: Network,
    color: '#8b5cf6',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    desc: 'Decomposes tasks, delegates to sub-agents, owns project outcomes',
  },
  {
    id: 'sub-agent',
    label: 'Sub-Agent',
    icon: Bot,
    color: '#64748b',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    desc: 'Executes specific tasks assigned by an orchestrator',
  },
  {
    id: 'specialist',
    label: 'Specialist',
    icon: Cpu,
    color: '#06b6d4',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    desc: 'Deep expertise in one domain — content, code, research, etc.',
  },
  {
    id: 'monitor',
    label: 'Monitor',
    icon: Eye,
    color: '#10b981',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    desc: 'Observes fleet health, system metrics, and triggers alerts',
  },
]

type SpawnStatus = 'idle' | 'spawning' | 'spawned'

export function SpawnAgent() {
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [instructions, setInstructions] = useState('')
  const [status, setStatus] = useState<SpawnStatus>('idle')
  const [spawnedAgent, setSpawnedAgent] = useState<{ name: string; role: string; color: string } | null>(null)

  const role = ROLES.find(r => r.id === selectedRole)
  const canSpawn = name.trim().length > 0 && selectedRole !== ''

  const handleSpawn = () => {
    if (!canSpawn || !role) return
    setStatus('spawning')
    setTimeout(() => {
      setSpawnedAgent({ name: name.trim(), role: role.id, color: role.color })
      setStatus('spawned')
    }, 1200)
  }

  const handleReset = () => {
    setStatus('idle')
    setSpawnedAgent(null)
    setName('')
    setSelectedRole('')
    setInstructions('')
  }

  if (status === 'spawned' && spawnedAgent) {
    const r = ROLES.find(r => r.id === spawnedAgent.role)!
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-full gap-6 p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        {/* Agent node preview */}
        <div className="relative">
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: spawnedAgent.color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            {spawnedAgent.name[0].toUpperCase()}
          </motion.div>
          {/* Halo ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: spawnedAgent.color, opacity: 0.4 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.25, opacity: 0.4 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: spawnedAgent.color, opacity: 0.2 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.55, opacity: 0.2 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          />
        </div>

        <div className="text-center flex flex-col gap-1.5">
          <h3 className="text-xl font-bold text-white">{spawnedAgent.name}</h3>
          <span className={`text-xs font-mono font-semibold px-3 py-1 rounded-full ${r.bg} ${r.border} border`} style={{ color: spawnedAgent.color }}>
            {spawnedAgent.role}
          </span>
        </div>

        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Agent initializing on OpenClaw…
        </div>

        <div className="flex flex-col gap-2 w-full text-xs font-mono text-slate-500 rounded-lg border border-white/6 p-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <span className="text-emerald-400">✓ SOUL.md written to workspace</span>
          <span className="text-emerald-400">✓ agent.create RPC dispatched</span>
          <span className="text-slate-500 animate-pulse">⟳ waiting for hello-ok handshake…</span>
        </div>

        <button
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer underline underline-offset-2"
        >
          Spawn another agent
        </button>
      </motion.div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400">Agent Name</label>
        <input
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors font-sans"
          placeholder="e.g. Spark, Atlas, Nova…"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={status === 'spawning'}
        />
      </div>

      {/* Role cards */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400">Role</label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(r => {
            const Icon = r.icon
            const active = selectedRole === r.id
            return (
              <motion.button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                whileTap={{ scale: 0.97 }}
                disabled={status === 'spawning'}
                className={`flex flex-col gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active ? `${r.bg} ${r.border}` : 'border-white/8 hover:border-white/15 bg-white/3'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? r.color : '#64748b' }} />
                  <span className={`text-xs font-semibold ${active ? 'text-slate-100' : 'text-slate-400'}`}>{r.label}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{r.desc}</p>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Seed instructions */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400">Seed Instructions <span className="text-slate-600">(optional)</span></label>
        <textarea
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
          placeholder="You are [Name], a specialist in…"
          rows={4}
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          disabled={status === 'spawning'}
        />
      </div>

      {/* Spawn button */}
      <motion.button
        onClick={handleSpawn}
        whileTap={{ scale: canSpawn ? 0.97 : 1 }}
        disabled={!canSpawn || status === 'spawning'}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
          !canSpawn
            ? 'bg-white/5 text-slate-600 border border-white/8 cursor-not-allowed'
            : status === 'spawning'
            ? 'border border-violet-500/20 text-violet-300'
            : 'border border-violet-500/30 text-violet-200 hover:border-violet-400/50'
        }`}
        style={canSpawn && status !== 'spawning' ? {
          background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.15))',
        } : {}}
      >
        {status === 'spawning' ? (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Spawning agent…
          </motion.span>
        ) : (
          <><Zap className="w-4 h-4" /> Spawn Agent</>
        )}
      </motion.button>
    </div>
  )
}
