import React from 'react';
import { Menu, Plus, Calendar, Database, Sparkles, Loader2 } from 'lucide-react';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onNavigateAddWork: () => void;
  onNavigatePlanner: () => void;
  onLoadDemo: () => void;
  isLoadingDemo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onNavigateAddWork,
  onNavigatePlanner,
  onLoadDemo,
  isLoadingDemo = false,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            <span>{getGreeting()}</span>
            <span className="text-slate-400 font-normal">👋</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">{getFormattedDate()}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Load Demo Workspace button */}
        <button
          onClick={onLoadDemo}
          disabled={isLoadingDemo}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition-all border border-slate-200 active:scale-95 disabled:opacity-50"
          title="Reload the hackathon meeting notes demo dataset"
        >
          {isLoadingDemo ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
          ) : (
            <Database className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{isLoadingDemo ? 'Loading...' : 'Demo Data'}</span>
        </button>

        {/* Plan My Day quick action */}
        <button
          onClick={onNavigatePlanner}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100/80 rounded-xl transition-all border border-brand-200/70 active:scale-95 shadow-2xs"
        >
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          <span className="hidden xs:inline">Plan My Day</span>
        </button>

        {/* Add Work primary action */}
        <button
          onClick={onNavigateAddWork}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl shadow-xs hover:shadow-brand-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Work</span>
        </button>
      </div>
    </header>
  );
};
