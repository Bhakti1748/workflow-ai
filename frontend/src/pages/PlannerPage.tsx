import React, { useState, useEffect } from 'react';
import { DailyPlan } from '../types/planner';
import { Timeline } from '../components/Timeline';
import { EmptyState } from '../components/EmptyState';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import {
  Calendar,
  Sparkles,
  Clock,
  Loader2,
  Copy,
  Check,
  Sliders,
  CalendarCheck,
  Bot,
  ArrowRight,
} from 'lucide-react';

interface PlannerPageProps {
  onNavigateAssistant?: () => void;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({ onNavigateAssistant }) => {
  const { addToast } = useToast();
  const [workingHours, setWorkingHours] = useState(8.0);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLatestPlan();
  }, []);

  const fetchLatestPlan = async () => {
    try {
      const latest = await api.getLatestPlan();
      setPlan(latest);
    } catch {
      // No existing plan, that's fine
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const generated = await api.createDailyPlan(workingHours, startTime);
      setPlan(generated);
      addToast('success', 'Plan generated!', 'Gemini created an optimized schedule for your working hours.');
    } catch (err: any) {
      addToast('error', 'Planner failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySchedule = () => {
    if (!plan) return;
    let text = `WorkFlow AI Daily Plan - ${plan.date}\n`;
    text += `Total Hours: ${plan.working_hours}h | Planned: ${(plan.total_planned_minutes / 60).toFixed(1)}h\n\n`;
    plan.schedule.forEach((s) => {
      text += `${s.start_time} - ${s.end_time}: ${s.title} (${s.slot_type.toUpperCase()})\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('info', 'Copied to clipboard', 'Daily schedule copied successfully.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>AI Daily Planner</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200/60">
              Autonomous
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gemini synthesizes priorities, deadlines, dependencies & durations into a time-blocked timeline
          </p>
        </div>

        {plan && (
          <button
            onClick={handleCopySchedule}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy Schedule'}</span>
          </button>
        )}
      </div>

      {/* Configuration Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Sliders className="w-4 h-4 text-brand-600" />
          <span>Schedule Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Working Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Available Working Hours:</span>
              </label>
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">
                {workingHours} hours
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              step="1"
              value={workingHours}
              onChange={(e) => setWorkingHours(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1.5">
              <button
                type="button"
                onClick={() => setWorkingHours(2)}
                className={`hover:text-brand-600 transition-colors ${workingHours === 2 ? 'text-brand-700 font-bold' : ''}`}
              >
                2h (Sprint)
              </button>
              <button
                type="button"
                onClick={() => setWorkingHours(4)}
                className={`hover:text-brand-600 transition-colors ${workingHours === 4 ? 'text-brand-700 font-bold' : ''}`}
              >
                4h (Half Day)
              </button>
              <button
                type="button"
                onClick={() => setWorkingHours(8)}
                className={`hover:text-brand-600 transition-colors ${workingHours === 8 ? 'text-brand-700 font-bold' : ''}`}
              >
                8h (Standard)
              </button>
              <button
                type="button"
                onClick={() => setWorkingHours(12)}
                className={`hover:text-brand-600 transition-colors ${workingHours === 12 ? 'text-brand-700 font-bold' : ''}`}
              >
                12h (Hackathon)
              </button>
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Day Start Time</span>
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-800 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="08:00 AM">08:00 AM (Early Bird)</option>
              <option value="09:00 AM">09:00 AM (Standard)</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="01:00 PM">01:00 PM (Afternoon Focus)</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl shadow-xs hover:shadow-brand-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scheduling with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Plan My Day</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Timeline Output Section */}
      {plan ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs animate-in fade-in duration-300">
          <Timeline
            schedule={plan.schedule}
            summary={plan.summary}
            recommendations={plan.recommendations}
            workingHours={plan.working_hours}
            totalPlannedMinutes={plan.total_planned_minutes}
          />

          {/* Ask AI Assistant Callout */}
          {onNavigateAssistant && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-brand-50/80 via-slate-50 to-indigo-50/70 border border-brand-200/70">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Need personalized coaching on this schedule?
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ask the AI Assistant questions grounded in your saved tasks (e.g., &ldquo;What should I do first?&rdquo;, &ldquo;What are Rahul&rsquo;s deliverables?&rdquo;).
                  </p>
                </div>
              </div>
              <button
                onClick={onNavigateAssistant}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto active:scale-95"
              >
                <span>Ask AI Assistant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={CalendarCheck}
          title="No daily plan generated yet"
          description="Click 'Plan My Day' above to let Gemini schedule your active tasks into a realistic focus timeline."
          actionLabel="Generate First Plan"
          onAction={handleGeneratePlan}
        />
      )}
    </div>
  );
};
