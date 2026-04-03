import { Home, Users, CheckSquare, FileText, Briefcase, Bell, Database, Settings, Activity, Search, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Agents', path: '/agents' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: FileText, label: 'Content', path: '/content' },
  { icon: Briefcase, label: 'Business', path: '/business' },
  { icon: Database, label: 'Memory', path: '/memory' },
  { icon: Activity, label: 'Activity', path: '/activity' },
  { icon: Bell, label: 'Approvals', path: '/approvals' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Wrench, label: 'Tools', path: '/tools' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export function SideRail() {
  return (
    <motion.aside
      className="w-14 glass-panel mx-2 mt-4 mb-4 flex flex-col items-center py-2 gap-1"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
    >
      {navItems.map((item) => (
        <Tooltip key={item.path} label={item.label}>
          <button
            className="p-2.5 rounded-xl transition-colors relative group hover:bg-white/10"
          >
            <item.icon className="w-5 h-5 text-slate-300 group-hover:text-white" />
          </button>
        </Tooltip>
      ))}
    </motion.aside>
  )
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </div>
    </div>
  )
}
