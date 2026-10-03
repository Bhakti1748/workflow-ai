import React, { useState } from 'react';
import { Task, Status } from '../types/task';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import {
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle2,
  Circle,
  GitBranch,
  ListTodo,
  Sparkles,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onViewDetails: (task: Task) => void;
  onBreakdown: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
  onViewDetails,
  onBreakdown,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isCompleted = task.status === 'completed';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#7c3aed', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {
        // gracefully ignore if canvas not supported
      }
    }
    onToggleStatus(task);
  };

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const getInitials = (name: string) => {
    if (!name) return 'ME';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Deterministic avatar gradient based on assignee name
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-brand-600 to-indigo-600',
      'from-blue-600 to-cyan-600',
      'from-emerald-600 to-teal-600',
      'from-purple-600 to-pink-600',
      'from-amber-600 to-orange-600',
      'from-rose-600 to-pink-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  return (
    <div
      onClick={() => onViewDetails(task)}
      className={`group relative bg-white border rounded-2xl p-4 sm:p-4.5 transition-all duration-200 cursor-pointer ${
        isCompleted
          ? 'border-slate-200/70 bg-slate-50/60 opacity-80'
          : 'border-slate-200/90 shadow-2xs hover:border-brand-300 hover:shadow-card hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox & Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={handleCheckboxClick}
            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm sm:text-base font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-2 ${
                isCompleted ? 'line-through text-slate-400 group-hover:text-slate-500' : ''
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p
                className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                  isCompleted ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Menu button */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Task options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-7 z-40 w-48 bg-white border border-slate-200/90 rounded-xl shadow-elevated py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onViewDetails(task);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-left font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onBreakdown(task);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-brand-50 text-brand-700 text-left font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Break Down with AI</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-left font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Task</span>
                </button>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(task);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-rose-50 text-rose-600 text-left font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Task</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meta tags & badging */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <PriorityBadge priority={task.priority} size="sm" />
          <span className="text-[11px] font-medium text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
            {task.category || 'General'}
          </span>
          {task.status !== 'completed' && <StatusBadge status={task.status} size="sm" />}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-slate-500">
          {/* Subtasks count */}
          {totalSubtasks > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                completedSubtasks === totalSubtasks
                  ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded'
                  : 'text-slate-500'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </span>
          )}

          {/* Dependencies count */}
          {task.dependencies && task.dependencies.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
              <GitBranch className="w-3 h-3 text-amber-600" />
              <span>{task.dependencies.length} dep</span>
            </span>
          )}

          {/* Duration */}
          <span className="inline-flex items-center gap-1 text-[11px] font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{task.estimated_minutes}m</span>
          </span>

          {/* Deadline */}
          {task.deadline && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/50">
              <Calendar className="w-3 h-3 text-rose-500" />
              <span>{task.deadline}</span>
            </span>
          )}

          {/* Assignee Avatar */}
          <div
            className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarGradient(
              task.assignee || 'Me'
            )} text-white text-[10px] font-bold flex items-center justify-center shadow-2xs`}
            title={`Assigned to: ${task.assignee || 'Me'}`}
          >
            {getInitials(task.assignee)}
          </div>
        </div>
      </div>
    </div>
  );
};
