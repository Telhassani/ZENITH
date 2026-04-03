-- Tasks table (Phase 2 will expand this)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  state TEXT NOT NULL DEFAULT 'inbox',
  agent_id TEXT,
  lane TEXT,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  context_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  error TEXT
);

-- Content pipeline items (Phase 5)
CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'idea',
  agent_id TEXT,
  content_json TEXT,
  scheduled_for TEXT,
  published_at TEXT,
  engagement_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Agent teams (Phase 3)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  agents_json TEXT NOT NULL,
  workflow TEXT,
  last_deployed TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Event log for analytics (Phase 5)
CREATE TABLE IF NOT EXISTS events_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  agent_id TEXT,
  session_id TEXT,
  payload_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Analytics cache
CREATE TABLE IF NOT EXISTS analytics_cache (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks(state);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_content_stage ON content_items(stage);
CREATE INDEX IF NOT EXISTS idx_events_type ON events_log(event_type);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events_log(agent_id);
