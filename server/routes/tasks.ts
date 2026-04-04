import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../db/sqlite'
import { canTransition, TaskState, TRANSITIONS } from '../../shared/taskStates'

const router = Router()

// GET /api/v1/tasks
router.get('/', (_req, res) => {
  const tasks = getDb()
    .prepare('SELECT * FROM tasks ORDER BY created_at DESC')
    .all()
  res.json(tasks)
})

// POST /api/v1/tasks — create a new task in backlog
router.post('/', (req, res) => {
  const { title, description, priority = 'medium', agent_id } = req.body
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' })
  }

  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO tasks (id, title, description, state, agent_id, priority, created_at, updated_at)
     VALUES (?, ?, ?, 'backlog', ?, ?, ?, ?)`
  ).run(id, title, description ?? null, agent_id ?? null, priority, now, now)

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  res.status(201).json(task)
})

// PUT /api/v1/tasks/:id/status — transition task state
router.put('/:id/status', (req, res) => {
  const { id } = req.params
  const { status } = req.body as { status: TaskState }

  const db = getDb()
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, string> | undefined
  if (!task) return res.status(404).json({ error: 'Task not found' })

  if (!canTransition(task.state as TaskState, status)) {
    return res.status(400).json({
      error: `Invalid transition: ${task.state} → ${status}`,
      allowed: TRANSITIONS,
    })
  }

  const now = new Date().toISOString()
  db.prepare('UPDATE tasks SET state = ?, updated_at = ? WHERE id = ?').run(status, now, id)

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  res.json(updated)
})

export default router
