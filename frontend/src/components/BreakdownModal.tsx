import React, { useState, useEffect } from 'react';
import { Task, ExtractedSubtask } from '../types/task';
import { Sparkles, X, Check, Loader2, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

interface BreakdownModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSubtasksAdded: (taskId: string, newSubtasks: { id: string; title: string; completed: boolean }[]) => void;
}

export const BreakdownModal: React.FC<BreakdownModalProps> = ({
  task,
  isOpen,
  onClose,
  onSubtasksAdded,
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ title: string; selected: boolean }[]>([]);

  useEffect(() => {
    if (isOpen && task) {
      fetchBreakdown(task.id);
    } else {
      setSuggestions([]);
    }
  }, [isOpen, task]);

  const fetchBreakdown = async (taskId: string) => {
    setLoading(true);
    try {
      const res = await api.breakdownTask(taskId);
      setSuggestions(
        res.suggested_subtasks.map((s) => ({
          title: s.title,
          selected: true,
        }))
      );
    } catch (err: any) {
      addToast('error', 'Breakdown failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  const toggleSelect = (index: number) => {
    setSuggestions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleApprove = () => {
    const selectedSubtasks = suggestions
      .filter((s) => s.selected)
      .map((s) => ({
        id: Math.random().toString(36).substring(2, 9),
        title: s.title,
        completed: false,
      }));

    if (selectedSubtasks.length === 0) {
      addToast('warning', 'No subtasks selected', 'Please select at least one subtask to add.');
      return;
    }

    onSubtasksAdded(task.id, selectedSubtasks);
    addToast('success', 'Subtasks added', `Added ${selectedSubtasks.length} subtasks to "${task.title}".`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-brand-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Task Breakdown</h2>
              <p className="text-xs text-slate-500">Deconstructing task into actionable steps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Target Task
            </span>
            <p className="text-sm font-semibold text-slate-800">{task.title}</p>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-800">Generating granular subtasks...</p>
              <p className="text-xs text-slate-500 mt-1">Gemini is analyzing scope and practical sequence.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Suggested Steps ({suggestions.filter((s) => s.selected).length}/{suggestions.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSuggestions((prev) => {
                      const allSelected = prev.every((s) => s.selected);
                      return prev.map((s) => ({ ...s, selected: !allSelected }));
                    })
                  }
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  Toggle All
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleSelect(idx)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      item.selected
                        ? 'border-brand-300 bg-brand-50/50 text-slate-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-500 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                        item.selected
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {item.selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="leading-snug">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || suggestions.filter((s) => s.selected).length === 0}
            onClick={handleApprove}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl shadow-xs hover:shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Approve & Add Subtasks</span>
          </button>
        </div>
      </div>
    </div>
  );
};
