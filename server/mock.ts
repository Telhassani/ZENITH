import express from 'express';
import { WebSocketServer } from 'ws';

const mockAgents = [
  { id: 'agent-1', name: 'Henry', role: 'orchestrator', status: 'active', lane: 'main', currentTask: 'Orchestrating fleet' },
  { id: 'agent-2', name: 'Quill', role: 'sub-agent', status: 'active', lane: 'subagent', currentTask: 'Writing X thread' },
  { id: 'agent-3', name: 'Engineer', role: 'sub-agent', status: 'idle', lane: 'subagent', currentTask: null },
  { id: 'agent-4', name: 'Scout', role: 'monitor', status: 'active', lane: 'main', currentTask: 'Monitoring logs' },
];

let mockTasks = [
  { id: 'task-1', title: 'Write ZENITH announcement', agent: 'Quill', status: 'executing', priority: 'high', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'task-2', title: 'Research Morocco tax filing', agent: 'Scout', status: 'queued', priority: 'medium', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'task-3', title: 'Deploy v1.0.0', agent: 'Engineer', status: 'backlog', priority: 'low', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export function setupMockBackend(app: express.Application, wss: WebSocketServer) {
  console.log('🎭 Mock backend initialized');

  app.get('/api/v1/health', (req, res) => res.json({ status: 'ok', gateway: 'connected', uptime: process.uptime() }));
  app.get('/api/v1/agents', (req, res) => res.json(mockAgents));
  app.get('/api/v1/tasks', (req, res) => res.json(mockTasks));
  
  app.put('/api/v1/tasks/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const task = mockTasks.find(t => t.id === id);
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
      // Broadcast update via WS
      wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(JSON.stringify({ event: 'task.updated', payload: task }));
      });
      res.json({ success: true, task });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  });

  wss.on('connection', (ws) => {
    console.log('🌐 Mock WS client connected');
    ws.send(JSON.stringify({ type: 'init', agents: mockAgents, tasks: mockTasks }));
    const interval = setInterval(() => {
      ws.send(JSON.stringify({ event: 'heartbeat', payload: { ts: Date.now() } }));
    }, 10000);
    ws.on('close', () => clearInterval(interval));
  });
}
