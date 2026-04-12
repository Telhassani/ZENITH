import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus, Users, Zap } from 'lucide-react'
import { useUiStore } from '../../stores/uiStore'
import { CreateProject } from './CreateProject'
import { ConfigureAgent } from './ConfigureAgent'
import { SpawnAgent } from './SpawnAgent'

const TABS = [
  { id: 'projects' as const, label: 'Projects', icon: FolderPlus },
  { id: 'agents'   as const, label: 'Agents',   icon: Users },
  { id: 'spawn'    as const, label: 'Spawn',     icon: Zap },
]

export function CommandDrawer() {
  const { commandDrawerOpen, commandDrawerTab, closeCommandDrawer, setCommandDrawerTab } = useUiStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCommandDrawer() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeCommandDrawer])

  return (
    <AnimatePresence>
      {commandDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCommandDrawer}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed top-0 right-0 z-50 h-screen w-[480px] flex flex-col"
            style={{
              background: 'rgba(13, 13, 43, 0.85)',
              backdropFilter: 'blur(32px) saturate(180%)',
              borderLeft: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '-24px 0 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08) inset',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-slate-100 tracking-wide">COMMAND MODE</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">OpenClaw Control Plane</p>
              </div>
              <button
                onClick={closeCommandDrawer}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close command drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 px-4 pb-4 shrink-0">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const active = commandDrawerTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCommandDrawerTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex-1 justify-center ${
                      active
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="h-px bg-white/5 mx-4 shrink-0" />

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={commandDrawerTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="h-full"
                >
                  {commandDrawerTab === 'projects' && <CreateProject />}
                  {commandDrawerTab === 'agents'   && <ConfigureAgent />}
                  {commandDrawerTab === 'spawn'    && <SpawnAgent />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
