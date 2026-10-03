import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import {
  Settings,
  Sparkles,
  Database,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  HardDrive,
  Key,
} from 'lucide-react';

interface SettingsPageProps {
  onReloadDemo: () => void;
  onClearWorkspace: () => void;
  taskCount: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onReloadDemo,
  onClearWorkspace,
  taskCount,
}) => {
  const { addToast } = useToast();
  const [health, setHealth] = useState<{
    gemini_api_configured: boolean;
    model: string;
    app: string;
  } | null>(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch {
      // Backend might be starting
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-7">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Workspace Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure AI keys, inspect local SQLite database, and manage demo datasets
        </p>
      </div>

      {/* 1. Gemini AI Configuration Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Google Gemini API</h2>
              <p className="text-xs text-slate-500">Autonomous extraction, breakdown & scheduling</p>
            </div>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${
              health?.gemini_api_configured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                health?.gemini_api_configured ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{health?.gemini_api_configured ? 'Active & Ready' : 'Heuristic Mode'}</span>
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1">
            <span className="text-slate-500 font-medium">Model:</span>
            <span className="font-semibold text-slate-800">{health?.model || 'gemini-3.8-flash'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 font-medium">SDK:</span>
            <span className="font-semibold text-slate-800">google-genai (v2.25+)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 font-medium">Validation:</span>
            <span className="font-semibold text-slate-800">Strict Pydantic v2 JSON Schema</span>
          </div>

          {!health?.gemini_api_configured && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 mt-2">
              <p className="font-semibold mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-700" />
                Want to connect your Gemini API Key?
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Add your key to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">backend/.env</code> as{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY=your_key_here</code>.
                When configured, genuine Gemini 3.8 Flash calls are executed automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Database & Workspace Management */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Database & Workspace Data</h2>
            <p className="text-xs text-slate-500">Local SQLite storage with automatic relations</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1">
            <span className="text-slate-500 font-medium">Database engine:</span>
            <span className="font-semibold text-slate-800">SQLite (workflow_ai.db)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 font-medium">Stored Tasks:</span>
            <span className="font-semibold text-slate-800">{taskCount} tasks</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReloadDemo}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Reload Demo Workspace</span>
          </button>
          <button
            onClick={onClearWorkspace}
            className="py-2.5 px-4 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
          >
            Clear All Tasks
          </button>
        </div>
      </div>

      {/* 3. Tech Stack & Architecture Information */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 text-xs text-slate-600 space-y-2">
        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
          WorkFlow AI Architecture
        </h3>
        <p className="leading-relaxed text-slate-500">
          Built for high-velocity productivity automation. Combines <strong>React + Vite + TypeScript + Tailwind CSS</strong> on the client with a <strong>FastAPI + SQLAlchemy SQLite</strong> engine and <strong>Gemini 3.8 Flash</strong> multimodal intelligence via the official <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">google-genai</code> Python SDK.
        </p>
      </div>
    </div>
  );
};
