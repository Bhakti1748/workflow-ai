import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Sparkles,
  FilePlus2,
  Settings,
  X,
  Zap,
} from 'lucide-react';

export type NavItem = 'dashboard' | 'tasks' | 'planner' | 'assistant' | 'add-work' | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  activeTaskCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isAiConfigured?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  activeTaskCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'tasks' as NavItem,
      label: 'My Tasks',
      icon: CheckSquare,
      badge: activeTaskCount > 0 ? activeTaskCount : undefined,
    },
    { id: 'planner' as NavItem, label: 'AI Planner', icon: Calendar },
    { id: 'assistant' as NavItem, label: 'AI Assistant', icon: Sparkles, highlight: true },
    { id: 'add-work' as NavItem, label: 'Add Work', icon: FilePlus2 },
    { id: 'settings' as NavItem, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: NavItem) => {
    onTabChange(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="flex items-center">
              <span className="text-base font-extrabold tracking-tight text-slate-900">WorkFlow</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200/60 px-1.5 py-0.5 rounded-md ml-1.5 shadow-2xs">
                AI
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 font-semibold shadow-2xs border border-brand-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/90'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-brand-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                      isActive
                        ? 'bg-brand-200/70 text-brand-900'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && !item.badge && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Agent Badge Card */}
        <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-br from-slate-50 via-brand-50/30 to-indigo-50/20 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-900">Gemini 3.8 Flash</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Autonomous agent analyzing notes, extracting tasks & building daily plans.
          </p>
        </div>
      </aside>
    </>
  );
};
