import { useEffect } from 'react'
import { useAgentStore } from '../stores/agentStore'
import { useTaskStore } from '../stores/taskStore'

export function useAppData() {
  const setAgents = useAgentStore((s) => s.setAgents)
  const setTasks = useTaskStore((s) => s.setTasks)

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, tasksRes] = await Promise.all([
          fetch('/api/v1/agents'),
          fetch('/api/v1/tasks'),
        ])
        if (agentsRes.ok) {
          const agents = await agentsRes.json()
          setAgents(Array.isArray(agents) ? agents : [])
        }
        if (tasksRes.ok) {
          const tasks = await tasksRes.json()
          setTasks(Array.isArray(tasks) ? tasks : [])
        }
      } catch (err) {
        console.error('[useAppData] Failed to load initial data:', err)
      }
    }
    load()
  }, [setAgents, setTasks])
}
