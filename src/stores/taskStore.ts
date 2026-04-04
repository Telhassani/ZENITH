import { create } from 'zustand';
import { TaskState, canTransition } from '../../shared/taskStates';

export interface Task {
  id: string;
  title: string;
  agent: string;
  status: TaskState;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskStoreState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (id: string, newStatus: TaskState) => boolean;
  getTasksByStatus: (status: TaskState) => Task[];
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTaskStatus: (id, newStatus) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task || !canTransition(task.status, newStatus)) return false;
    
    set((state) => ({
      tasks: state.tasks.map((t) => 
        t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      ),
    }));
    return true;
  },
  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
}));
