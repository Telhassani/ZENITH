import { motion } from 'framer-motion'
import { useAgentStore } from '../../stores/agentStore'

export function AgentFleet() {
  const { agents } = useAgentStore()

  return (
    <motion.div
      className="glass-panel p-6"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-4">Agent Fleet</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {agents.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 py-8">
            No agents loaded. Connect to OpenClaw Gateway to populate.
          </div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="glass-panel p-4">
              <div className="font-bold">{agent.name}</div>
              <div className="text-xs text-slate-400">{agent.role}</div>
              <div className="text-xs text-cyan-400 mt-1">{agent.status}</div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}
