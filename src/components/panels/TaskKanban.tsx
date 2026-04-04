import { useEffect } from 'react';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore, Task, TaskState } from '../../stores/taskStore';
import { TASK_STATES } from '../../../shared/taskStates';
import { apiGet, apiPut } from '../../lib/api';

const COLUMNS: { id: TaskState; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'border-slate-500' },
  { id: 'queued', title: 'Queued', color: 'border-slate-400' },
  { id: 'dispatched', title: 'Dispatched', color: 'border-violet-400' },
  { id: 'executing', title: 'Executing', color: 'border-cyan-400' },
  { id: 'awaiting_approval', title: 'Approval', color: 'border-amber-400' },
  { id: 'completed', title: 'Completed', color: 'border-emerald-400' },
  { id: 'failed', title: 'Failed', color: 'border-rose-400' },
  { id: 'cancelled', title: 'Cancelled', color: 'border-gray-500' },
  { id: 'archived', title: 'Archived', color: 'border-gray-600' },
];

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="glass-panel p-3 mb-2 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm font-bold text-white">{task.title}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'bg-rose-500/20 text-rose-300' : task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}`}>
          {task.priority}
        </span>
      </div>
      <div className="text-xs text-slate-400">Agent: {task.agent}</div>
    </div>
  );
}

export function TaskKanban() {
  const { tasks, setTasks, updateTaskStatus } = useTaskStore();

  useEffect(() => {
    apiGet<Task[]>('/tasks').then(setTasks).catch(console.error);
  }, [setTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newStatus = over.id as TaskState;
      const success = updateTaskStatus(active.id as string, newStatus);
      if (success) {
        try {
          await apiPut(`/tasks/${active.id}/status`, { status: newStatus });
        } catch (e) {
          console.error('Failed to sync status with backend', e);
        }
      }
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-180px)]">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className={`flex-shrink-0 w-64 glass-panel p-3 border-t-4 ${col.color}`}>
              <h3 className="text-sm font-bold text-slate-200 mb-3 flex justify-between">
                {col.title} <span className="text-slate-500">{columnTasks.length}</span>
              </h3>
              <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[50px]">
                  {columnTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}
