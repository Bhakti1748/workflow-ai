import React from 'react';
import { ScheduleSlot } from '../types/planner';
import { PriorityBadge } from './PriorityBadge';
import { Clock, Coffee, ShieldAlert, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import { Priority } from '../types/task';

interface TimelineProps {
  schedule: ScheduleSlot[];
  summary: string;
  recommendations?: string[];
  workingHours: number;
  totalPlannedMinutes: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  schedule,
  summary,
  recommendations = [],
  workingHours,
  totalPlannedMinutes,
}) => {
  const plannedHours = (totalPlannedMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-50/80 via-indigo-50/50 to-white border border-brand-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Schedule Overview</h3>
              <p className="text-xs text-slate-500">Autonomous priority-weighted day plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-100 text-brand-800 border border-brand-200/70 shadow-2xs">
              {plannedHours}h planned / {workingHours}h available
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed mt-2.5 font-normal">{summary}</p>
      </div>

      {/* Timeline slots */}
      <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
        <div className="space-y-4">
          {schedule.map((slot, idx) => {
            const isBreak = slot.slot_type === 'break';
            const isBuffer = slot.slot_type === 'buffer';

            return (
              <div key={idx} className="relative group">
                {/* Node icon on timeline */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white shadow-2xs transition-all ${
                    isBreak
                      ? 'border-amber-400 text-amber-600'
                      : isBuffer
                      ? 'border-indigo-400 text-indigo-600'
                      : 'border-brand-600 text-brand-600 group-hover:scale-110'
                  }`}
                >
                  {isBreak ? (
                    <Coffee className="w-3 h-3" />
                  ) : isBuffer ? (
                    <ShieldAlert className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                </div>

                {/* Slot Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isBreak
                      ? 'bg-amber-50/50 border-amber-200/70'
                      : isBuffer
                      ? 'bg-indigo-50/40 border-indigo-200/70'
                      : 'bg-white border-slate-200/90 shadow-2xs hover:border-brand-300 hover:shadow-card'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md inline-block w-fit">
                      {slot.start_time} - {slot.end_time}
                    </span>

                    <div className="flex items-center gap-2">
                      {slot.priority && !isBreak && !isBuffer && (
                        <PriorityBadge priority={slot.priority as Priority} size="sm" />
                      )}
                      {slot.category && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {slot.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{slot.title}</h4>

                  {slot.notes && (
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{slot.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>AI Productivity Recommendations</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-brand-500 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
