import { motion } from 'framer-motion'

export function MissionOverview() {
  return (
    <motion.div
      className="glass-panel p-6 max-w-2xl mx-auto mt-8"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
    >
      <h1 className="text-2xl font-bold mb-2">Mission Overview</h1>
      <p className="text-slate-400">
        Phase 1 scaffold - Agent Fleet, Activity Visualizer, Task Kanban coming in Phase 2-3.
      </p>
      <div className="mt-4 flex gap-4 text-sm font-mono text-slate-500">
        <div>Agents: Loading...</div>
        <div>Active Tasks: -</div>
        <div>Pending Approvals: -</div>
      </div>
    </motion.div>
  )
}
