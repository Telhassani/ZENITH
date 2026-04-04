export type TaskState = 
  | 'backlog'
  | 'queued'
  | 'dispatched'
  | 'executing'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'archived';

export const TASK_STATES: TaskState[] = [
  'backlog', 'queued', 'dispatched', 'executing', 
  'awaiting_approval', 'completed', 'failed', 'cancelled', 'archived'
];

export const TRANSITIONS: Record<TaskState, TaskState[]> = {
  backlog: ['queued', 'cancelled'],
  queued: ['dispatched', 'backlog', 'cancelled'],
  dispatched: ['executing', 'awaiting_approval', 'failed', 'cancelled'],
  executing: ['completed', 'awaiting_approval', 'failed', 'cancelled'],
  awaiting_approval: ['executing', 'cancelled', 'failed'],
  completed: ['archived'],
  failed: ['queued', 'backlog', 'archived'],
  cancelled: ['backlog', 'archived'],
  archived: [],
};

export function canTransition(from: TaskState, to: TaskState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
