import React, { useState } from 'react';
import { Task, Subtask } from '../types/task';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  GitBranch,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onBreakdown: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onToggleSubtask,
  onAddSubtask,
  onBreakdown,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  if (!isOpen || !task) return null;

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskInput.trim()) return;
    onAddSubtask(task.id, newSubtaskInput.trim());
    setNewSubtaskInput('');
  };

  const isCompleted = task.status === 'completed';
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} size="sm" />
            <StatusBadge status={task.status} size="sm" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Title & Status Toggle */}
          <div>
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggleStatus(task)}
                className="mt-1 shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 hover:text-slate-500" />
                )}
              </button>
              <div>
                <h2
                  className={`text-lg sm:text-xl font-bold text-slate-900 leading-snug ${
                    isCompleted ? 'line-through text-slate-400' : ''
                  }`}
                >
                  {task.title}
                </h2>
                {task.description && (
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Assignee</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {task.assignee || 'Me'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Deadline</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {task.deadline || 'None'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Duration</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {task.estimated_minutes}m
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Category</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {task.category || 'General'}
              </span>
            </div>
          </div>

          {/* Dependencies Section */}
          {task.dependencies && task.dependencies.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                Prerequisites & Dependencies ({task.dependencies.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {task.dependencies.map((dep, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium"
                  >
                    <span>{dep}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Subtasks ({completedSubtasks}/{totalSubtasks})
              </h3>
              <button
                onClick={() => onBreakdown(task)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Break Down with AI</span>
              </button>
            </div>

            {/* Progress bar */}
            {totalSubtasks > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
                <div
                  className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Subtasks items */}
            <div className="space-y-1.5">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onToggleSubtask(task.id, st.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    st.completed
                      ? 'bg-slate-50/70 border-slate-200/60 text-slate-400'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-brand-200'
                  }`}
                >
                  <button className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600">
                    {st.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                  <span
                    className={`text-xs leading-normal flex-1 ${
                      st.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}

              {task.subtasks.length === 0 && (
                <div className="text-center py-4 px-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                  <p className="text-xs text-slate-500 mb-2">No subtasks added yet.</p>
                  <button
                    onClick={() => onBreakdown(task)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg border border-brand-200/60 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Auto-generate Subtasks with Gemini</span>
                  </button>
                </div>
              )}
            </div>

            {/* Add subtask manually form */}
            <form onSubmit={handleSubtaskSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                placeholder="Add next action step..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={!newSubtaskInput.trim()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={() => onToggleStatus(task)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isCompleted
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            {isCompleted ? 'Mark as Incomplete' : 'Complete Task'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
