import React from 'react';
import { DashboardStats, AISuggestion } from '../types/dashboard';
import { Task } from '../types/task';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FolderKanban,
  Database,
  FilePlus2,
  CalendarCheck,
  Zap,
} from 'lucide-react';

interface DashboardPageProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigateAddWork: () => void;
  onNavigatePlanner: () => void;
  onNavigateTasks: (filter?: { status?: string; priority?: string }) => void;
  onToggleStatus: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onViewDetails: (task: Task) => void;
  onBreakdown: (task: Task) => void;
  onLoadDemo: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  loading,
  onNavigateAddWork,
  onNavigatePlanner,
  onNavigateTasks,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
  onViewDetails,
  onBreakdown,
  onLoadDemo,
}) => {
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200/80 rounded-2xl animate-pulse p-5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />
          <div className="h-96 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const handleSuggestionAction = (sug: AISuggestion) => {
    if (sug.action_type === 'plan_day') {
      onNavigatePlanner();
    } else if (sug.action_type === 'filter_overdue') {
      onNavigateTasks({ status: 'todo' });
    } else if (sug.action_type === 'add_work') {
      onNavigateAddWork();
    } else {
      onNavigateTasks();
    }
  };

  // If completely empty workspace, display a premier onboarding hero
  const isWorkspaceEmpty = stats.total_tasks === 0;

  return (
    <div className="space-y-7">
      {/* 1. Top Metrics Strip (Understandable within 3 seconds) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Total Tasks */}
        <div
          onClick={() => onNavigateTasks()}
          className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-brand-300 hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.total_tasks}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {stats.in_progress_tasks} active
            </span>
          </div>
        </div>

        {/* High Priority */}
        <div
          onClick={() => onNavigateTasks({ priority: 'high' })}
          className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-rose-300 hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              High Priority
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              {stats.high_priority_tasks}
            </span>
            <span className="text-xs text-rose-500 font-medium">Require focus</span>
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => onNavigateTasks({ status: 'completed' })}
          className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-emerald-300 hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              {stats.completed_tasks}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              {stats.completion_rate}% done
            </span>
          </div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => onNavigateTasks({ status: 'todo' })}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-2xs transition-all cursor-pointer group hover:-translate-y-0.5 ${
            stats.overdue_tasks > 0
              ? 'border-amber-300 hover:border-amber-400 bg-amber-50/20 shadow-amber-500/5'
              : 'border-slate-200/90 hover:border-slate-300 hover:shadow-card'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                stats.overdue_tasks > 0 ? 'text-amber-700' : 'text-slate-600'
              }`}
            >
              Overdue
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                stats.overdue_tasks > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                stats.overdue_tasks > 0 ? 'text-amber-600' : 'text-slate-700'
              }`}
            >
              {stats.overdue_tasks}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {stats.overdue_tasks > 0 ? 'Action needed' : 'All on track'}
            </span>
          </div>
        </div>
      </div>

      {/* Onboarding Hero when Workspace is Empty */}
      {isWorkspaceEmpty && (
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-700 text-white shadow-elevated relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-brand-200" />
              <span>Autonomous Productivity Agent</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Ready to automate your team's workflow with Gemini?
            </h2>
            
            <p className="text-sm sm:text-base text-brand-100/90 leading-relaxed font-normal">
              Paste meeting notes, upload PDF project briefs, or load the pre-configured hackathon workspace to experience dynamic task extraction, AI subtask breakdown, and daily scheduling.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onNavigateAddWork}
                className="px-5 py-2.5 rounded-xl bg-white text-brand-700 font-bold text-xs sm:text-sm shadow-md hover:bg-brand-50 transition-all flex items-center gap-2 active:scale-95"
              >
                <FilePlus2 className="w-4 h-4 text-brand-600" />
                <span>Add Work / Paste Notes</span>
              </button>

              <button
                onClick={onLoadDemo}
                className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <Database className="w-4 h-4" />
                <span>Load Demo Workspace</span>
              </button>
            </div>
          </div>

          {/* 3 Value Pillars */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/15">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-xs border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">1. Unstructured to Structured</h3>
              <p className="text-[11px] text-brand-100 mt-1">Converts unstructured notes into tasks with assignees & deadlines.</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-xs border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">2. AI Task Breakdown</h3>
              <p className="text-[11px] text-brand-100 mt-1">Deconstructs complex goals into actionable checklist items.</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-xs border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                <CalendarCheck className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">3. Autonomous Day Planner</h3>
              <p className="text-[11px] text-brand-100 mt-1">Generates realistic time-blocked timelines with breaks & buffer.</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Content Grid: Left 2 Cols (Tasks & Deadlines), Right 1 Col (AI Suggestions & Progress) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 items-start">
        {/* Left Column: Today's Focus Queue & Upcoming Deadlines */}
        <div className="lg:col-span-2 space-y-7">
          {/* Today's Tasks */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Today's Focus Tasks</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                    {stats.today_tasks.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500">High priority and active deliverables for today</p>
              </div>
              <button
                onClick={() => onNavigateTasks()}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats.today_tasks.length > 0 ? (
              <div className="space-y-3">
                {stats.today_tasks.map((task) => (
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
                icon={CheckCircle2}
                title="No tasks scheduled for today"
                description="Import meeting notes, upload documents, or add tasks to build your focus queue."
                actionLabel="Extract Tasks with AI"
                onAction={onNavigateAddWork}
              />
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Upcoming Deadlines</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Chronological</span>
            </div>

            {stats.upcoming_deadlines.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.upcoming_deadlines.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onViewDetails(task)}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">Assignee: {task.assignee}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {task.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
                        <Calendar className="w-3 h-3" />
                        {task.deadline || 'Upcoming'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No impending deadlines found.</p>
            )}
          </div>
        </div>

        {/* Right Column: AI Suggestions & Progress Card */}
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Today's Progress</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Task completion velocity</p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{stats.completed_tasks} of {stats.total_tasks} tasks</span>
                <span className="text-brand-600 font-bold">{stats.completion_rate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completion_rate}%` }}
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Est. workload:</span>
              </span>
              <span className="font-bold text-slate-900">
                {(stats.total_estimated_minutes / 60).toFixed(1)} hours
              </span>
            </div>
          </div>

          {/* AI Suggestions Widget */}
          <div className="bg-gradient-to-b from-brand-50/40 via-white to-white border border-brand-200/80 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">AI Productivity Engine</h3>
              </div>
              <span className="text-[11px] font-semibold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-full">
                Real-time
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Continuous intelligence identifying bottlenecks & priority risks
            </p>

            <div className="space-y-3">
              {stats.ai_suggestions.map((sug) => {
                const borderColors = {
                  danger: 'border-rose-200 bg-rose-50/50',
                  warning: 'border-amber-200 bg-amber-50/50',
                  info: 'border-indigo-200 bg-indigo-50/50',
                  success: 'border-emerald-200 bg-emerald-50/50',
                }[sug.severity];

                const tagColors = {
                  danger: 'text-rose-700 bg-rose-100',
                  warning: 'text-amber-700 bg-amber-100',
                  info: 'text-indigo-700 bg-indigo-100',
                  success: 'text-emerald-700 bg-emerald-100',
                }[sug.severity];

                return (
                  <div key={sug.id} className={`p-3.5 rounded-xl border text-xs transition-all ${borderColors}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${tagColors}`}>
                        {sug.type}
                      </span>
                      {sug.action_label && (
                        <button
                          onClick={() => handleSuggestionAction(sug)}
                          className="text-[11px] font-bold text-brand-700 hover:text-brand-900 underline underline-offset-2 flex items-center gap-0.5"
                        >
                          {sug.action_label}
                        </button>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 mt-2 text-xs">{sug.title}</h4>
                    <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">{sug.message}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Demo Workspace Reload Promo */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xs font-semibold text-slate-700">Testing the Hackathon Scenario?</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Reset with the pre-configured project tasks (Rahul, Priya, API testing, submission).
            </p>
            <button
              onClick={onLoadDemo}
              className="mt-3 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Reload Demo Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
