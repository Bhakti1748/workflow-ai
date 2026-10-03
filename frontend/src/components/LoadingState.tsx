import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  submessage,
}) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-xs">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
          <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-800">{message}</p>
      {submessage && <p className="text-xs text-slate-500 mt-1 max-w-sm">{submessage}</p>}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-2xl border border-slate-200/70 bg-white animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-5 bg-slate-200 rounded-full w-16"></div>
      </div>
      <div className="h-3 bg-slate-100 rounded w-5/6"></div>
      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
      <div className="pt-2 flex items-center gap-2">
        <div className="h-4 bg-slate-200 rounded w-12"></div>
        <div className="h-4 bg-slate-200 rounded w-16"></div>
      </div>
    </div>
  );
};
