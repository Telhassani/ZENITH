import { motion } from 'framer-motion'
import { FolderOpen, Users, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { useUiStore } from '../../stores/uiStore'

const MOCK_STATS = [
  { label: 'Agents Online',      value: '5',  sub: '2 active',           color: 'text-cyan-400',    icon: Users },
  { label: 'Active Projects',    value: '4',  sub: '2 running tasks',    color: 'text-violet-400',  icon: FolderOpen },
  { label: 'Pending Approvals',  value: '2',  sub: 'action needed',      color: 'text-amber-400',   icon: AlertCircle },
  { label: 'Completed Today',    value: '7',  sub: 'tasks done',         color: 'text-emerald-400', icon: CheckCircle2 },
]

const MOCK_PROJECTS = [
  { name: 'ZENITH Build',    status: 'active',    agent: 'Nexus', progress: 68, color: '#8b5cf6' },
  { name: 'X Content Q2',   status: 'active',    agent: 'Quill', progress: 45, color: '#06b6d4' },
  { name: 'VPS Hardening',  status: 'planning',  agent: 'Scout', progress: 12, color: '#64748b' },
  { name: 'PKOS Migration', status: 'paused',    agent: 'Nexus', progress: 31, color: '#f59e0b' },
]

const STATUS_COLORS: Record<string, string> = {
  active:   'text-cyan-400',
  planning: 'text-violet-400',
  paused:   'text-amber-400',
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
}

export function MissionOverview() {
  const { openCommandDrawer } = useUiStore()

  return (
    <motion.div
      className="flex flex-col gap-4 max-w-4xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Stats row */}
      <motion.div variants={item} className="grid grid-cols-4 gap-3">
        {MOCK_STATS.map(stat => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="glass-panel px-4 py-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">{stat.label}</span>
                <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <span className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] text-slate-600">{stat.sub}</span>
            </div>
          )
        })}
      </motion.div>

      {/* Projects panel */}
      <motion.div variants={item} className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-200">Projects</h2>
          </div>
          <motion.button
            onClick={() => openCommandDrawer('projects')}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-300 border border-violet-500/25 hover:bg-violet-500/15 transition-all cursor-pointer"
            style={{ background: 'rgba(139,92,246,0.08)' }}
          >
            <Plus className="w-3 h-3" />
            New Project
          </motion.button>
        </div>

        <div className="flex flex-col gap-2.5">
          {MOCK_PROJECTS.map(project => (
            <div
              key={project.name}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/3 transition-all cursor-pointer group"
            >
              {/* Agent avatar */}
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: project.color }}
              >
                {project.agent[0]}
              </span>

              {/* Project info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-200 font-medium truncate group-hover:text-white transition-colors">{project.name}</span>
                  <span className={`text-[10px] font-mono shrink-0 ${STATUS_COLORS[project.status]}`}>{project.status}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: project.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{project.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item} className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Spawn Agent',      tab: 'spawn'    as const, color: 'border-violet-500/20 text-violet-300 hover:bg-violet-500/10' },
            { label: 'New Project',      tab: 'projects' as const, color: 'border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/10' },
            { label: 'Configure Agents', tab: 'agents'   as const, color: 'border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10' },
          ].map(action => (
            <motion.button
              key={action.label}
              onClick={() => openCommandDrawer(action.tab)}
              whileTap={{ scale: 0.96 }}
              className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${action.color}`}
            >
              {action.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
