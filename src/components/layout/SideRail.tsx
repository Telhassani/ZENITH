import { Home, Users, CheckSquare, FileText, Briefcase, Bell, Database, Settings, Activity, Search, Wrench, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocation, Link } from 'react-router-dom'
import { useUiStore } from '../../stores/uiStore'

const navItems = [
  { icon: Home,        label: 'Dashboard', path: '/' },
  { icon: Users,       label: 'Agents',    path: '/agents' },
  { icon: CheckSquare, label: 'Tasks',     path: '/tasks' },
  { icon: FileText,    label: 'Content',   path: '/content' },
  { icon: Briefcase,   label: 'Business',  path: '/business' },
  { icon: Database,    label: 'Memory',    path: '/memory' },
  { icon: Activity,    label: 'Activity',  path: '/activity' },
  { icon: Bell,        label: 'Approvals', path: '/approvals' },
  { icon: Search,      label: 'Search',    path: '/search' },
  { icon: Wrench,      label: 'Tools',     path: '/tools' },
  { icon: Settings,    label: 'Settings',  path: '/settings' },
]

export function SideRail() {
  const location = useLocation()
  const { openCommandDrawer } = useUiStore()

  return (
    <motion.aside
      className="w-14 glass-panel mx-2 mt-4 mb-4 flex flex-col items-center py-3 gap-1"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
    >
      {/* Spawn / Command Mode button — top of rail */}
      <Tooltip label="Command Mode (Spawn / Configure)">
        <motion.button
          onClick={() => openCommandDrawer('spawn')}
          whileTap={{ scale: 0.92 }}
          className="p-2 rounded-xl mb-2 cursor-pointer relative group transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.15))',
            border: '1px solid rgba(139,92,246,0.35)',
          }}
          aria-label="Open Command Mode"
        >
          <Plus className="w-4 h-4 text-violet-300 group-hover:text-violet-100 transition-colors" />
          {/* Subtle glow pulse */}
          <motion.span
            className="absolute inset-0 rounded-xl"
            style={{ background: 'rgba(139,92,246,0.15)', pointerEvents: 'none' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.button>
      </Tooltip>

      <div className="w-6 h-px bg-white/8 mb-1" />

      {/* Nav items */}
      {navItems.map((item) => {
        const active = location.pathname === item.path
        return (
          <Tooltip key={item.path} label={item.label}>
            <Link
              to={item.path}
              className={`p-2.5 rounded-xl transition-all relative group cursor-pointer ${
                active
                  ? 'bg-white/12 border border-white/15'
                  : 'hover:bg-white/8 border border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              {active && (
                <motion.span
                  layoutId="sideRailActive"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-violet-400"
                  style={{ left: '-1px' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          </Tooltip>
        )
      })}
    </motion.aside>
  )
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      {children}
      <div
        className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50"
        style={{ background: 'rgba(13,13,43,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
      >
        {label}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(255,255,255,0.1)]" style={{ borderRightColor: 'rgba(13,13,43,0.95)' }} />
      </div>
    </div>
  )
}
