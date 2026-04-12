import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, CheckCircle2 } from 'lucide-react'

const MOCK_AGENTS = [
  { id: 'a1', name: 'Nexus',  role: 'orchestrator', color: '#8b5cf6' },
  { id: 'a2', name: 'Quill',  role: 'specialist',   color: '#06b6d4' },
  { id: 'a3', name: 'Scout',  role: 'sub-agent',    color: '#64748b' },
  { id: 'a4', name: 'Forge',  role: 'specialist',   color: '#06b6d4' },
  { id: 'a5', name: 'Lens',   role: 'monitor',      color: '#10b981' },
]

const MOCK_PROJECTS = [
  { id: 'p1', name: 'ZENITH Build', status: 'active',   agents: ['a1', 'a2', 'a3'] },
  { id: 'p2', name: 'X Content Q2', status: 'active',   agents: ['a2'] },
  { id: 'p3', name: 'VPS Hardening', status: 'planning', agents: ['a3', 'a5'] },
  { id: 'p4', name: 'PKOS Migration', status: 'paused',  agents: ['a1', 'a4'] },
]

const STATUS_COLORS: Record<string, string> = {
  active:   'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  planning: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  paused:   'text-amber-400 bg-amber-400/10 border-amber-400/20',
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } } }

export function CreateProject() {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [projects, setProjects] = useState(MOCK_PROJECTS)
  const [created, setCreated] = useState(false)

  const toggleAgent = (id: string) =>
    setSelectedAgents(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])

  const handleCreate = () => {
    if (!name.trim()) return
    setProjects(prev => [{
      id: `p${Date.now()}`,
      name: name.trim(),
      status: 'planning',
      agents: selectedAgents,
    }, ...prev])
    setCreated(true)
    setTimeout(() => { setCreated(false); setName(''); setGoal(''); setSelectedAgents([]) }, 2000)
  }

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* New project form */}
      <div className="rounded-xl border border-white/8 p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">New Project</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400">Project Name</label>
          <input
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-colors font-sans"
            placeholder="e.g. ZENITH Phase 2"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400">Goal</label>
          <textarea
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none transition-colors font-sans"
            placeholder="What should this project accomplish?"
            rows={2}
            value={goal}
            onChange={e => setGoal(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400">Assign Agents</label>
          <div className="flex flex-wrap gap-2">
            {MOCK_AGENTS.map(agent => {
              const selected = selectedAgents.includes(agent.id)
              return (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    selected
                      ? 'border-violet-400/40 bg-violet-400/15 text-violet-200'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: agent.color }} />
                  {agent.name}
                </button>
              )
            })}
          </div>
        </div>

        <motion.button
          onClick={handleCreate}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            created
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-violet-500/20 text-violet-200 border border-violet-500/30 hover:bg-violet-500/30'
          }`}
        >
          {created
            ? <><CheckCircle2 className="w-4 h-4" /> Project Created</>
            : <><Plus className="w-4 h-4" /> Create Project</>
          }
        </motion.button>
      </div>

      {/* Project list */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1 mb-1">Active Projects</p>
        <motion.ul variants={container} initial="hidden" animate="show" className="flex flex-col gap-2">
          {projects.map(project => (
            <motion.li
              key={project.id}
              variants={item}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/6 hover:border-white/12 hover:bg-white/4 transition-all cursor-pointer group"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-slate-200 font-medium group-hover:text-white transition-colors">{project.name}</span>
                <div className="flex gap-1.5 mt-1">
                  {project.agents.map(aid => {
                    const agent = MOCK_AGENTS.find(a => a.id === aid)
                    if (!agent) return null
                    return (
                      <span
                        key={aid}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ background: agent.color, opacity: 0.85 }}
                        title={agent.name}
                      >
                        {agent.name[0]}
                      </span>
                    )
                  })}
                </div>
              </div>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${STATUS_COLORS[project.status]}`}>
                {project.status}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </div>
  )
}
