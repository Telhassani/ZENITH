import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'

export function ChromeBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Agents', path: '/agents' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Content', path: '/content' },
    { label: 'Business', path: '/business' },
    { label: 'Memory', path: '/memory' },
    { label: 'System', path: '/system' },
  ]

  return (
    <motion.header
      className="h-14 glass-panel mx-4 mt-4 flex items-center justify-between px-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">ZENITH</span>
      </div>

      {/* Nav pills */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className="px-3 py-1.5 rounded-full text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <Search className="w-5 h-5 text-slate-300" />
        </button>
        <span className="font-mono text-sm text-slate-300 font-data">{time}</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-slow" />
          <span className="text-xs text-cyan-400 font-mono">LIVE</span>
        </div>
      </div>
    </motion.header>
  )
}
