import React, { useState } from 'react';
import { Task } from '../types/task';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';
import {
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Clock,
  Circle,
  X,
} from 'lucide-react';

interface TasksPageProps {
  tasks: Task[];
  loading: boolean;
  initialFilter?: { status?: string; priority?: string } | null;
  onToggleStatus: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onViewDetails: (task: Task) => void;
  onBreakdown: (task: Task) => void;
  onCreateNewTask: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  loading,
  initialFilter,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
  onViewDetails,
  onBreakdown,
  onCreateNewTask,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>(initialFilter?.priority || 'all');
  const [filterStatus, setFilterStatus] = useState<string>(initialFilter?.status || 'all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  React.useEffect(() => {
    if (initialFilter?.priority) setFilterPriority(initialFilter.priority);
    if (initialFilter?.status) setFilterStatus(initialFilter.status);
  }, [initialFilter]);

  // Derive unique categories and assignees for dropdowns
  const categories = Array.from(new Set(tasks.map((t) => t.category || 'General')));
  const assignees = Array.from(new Set(tasks.map((t) => t.assignee || 'Me')));

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAssignee = (t.assignee || '').toLowerCase().includes(q);
      const matchCategory = (t.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee && !matchCategory) return false;
    }

    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterAssignee !== 'all' && t.assignee !== filterAssignee) return false;

    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  const hasActiveFilters =
    filterPriority !== 'all' ||
    filterStatus !== 'all' ||
    filterCategory !== 'all' ||
    filterAssignee !== 'all' ||
    Boolean(searchQuery.trim());

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Task Management</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize, prioritize, and track all deliverables across the team
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-slate-100 text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-slate-100 text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onCreateNewTask}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl shadow-xs hover:shadow-brand-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, assignee, or category..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Category filter */}
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-hidden hidden md:inline"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Assignee filter */}
            {assignees.length > 0 && (
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-hidden hidden md:inline"
              >
                <option value="all">All Assignees</option>
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilterPriority('all');
                  setFilterStatus('all');
                  setFilterCategory('all');
                  setFilterAssignee('all');
                  setSearchQuery('');
                }}
                className="text-xs text-brand-600 font-bold hover:underline px-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task Content: List View or Kanban Board */}
      {viewMode === 'list' ? (
        filteredTasks.length > 0 ? (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleStatus={onToggleStatus}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onViewDetails={onViewDetails}
                onBreakdown={onBreakdown}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No tasks match your criteria"
            description="Try resetting your filters or click 'New Task' to add an item."
            actionLabel="Create New Task"
            onAction={onCreateNewTask}
          />
        )
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* To Do Column */}
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">To Do</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                {todoTasks.length}
              </span>
            </div>
            <div className="space-y-3 min-h-[160px]">
              {todoTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onViewDetails={onViewDetails}
                  onBreakdown={onBreakdown}
                />
              ))}
              {todoTasks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No tasks in backlog</p>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-indigo-50/40 border border-indigo-200/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-indigo-200/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">In Progress</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200 shadow-2xs">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="space-y-3 min-h-[160px]">
              {inProgressTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onViewDetails={onViewDetails}
                  onBreakdown={onBreakdown}
                />
              ))}
              {inProgressTasks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No tasks in progress</p>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Completed</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200 shadow-2xs">
                {completedTasks.length}
              </span>
            </div>
            <div className="space-y-3 min-h-[160px]">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onViewDetails={onViewDetails}
                  onBreakdown={onBreakdown}
                />
              ))}
              {completedTasks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No completed tasks yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
