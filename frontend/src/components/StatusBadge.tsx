import React from 'react';
import { Status } from '../types/task';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const styles = {
    todo: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200/80',
      icon: <Circle className="w-3 h-3 text-slate-500" />,
      label: 'To Do',
    },
    in_progress: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      icon: <Clock className="w-3 h-3 text-indigo-600 animate-spin-slow" />,
      label: 'In Progress',
    },
    completed: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
      label: 'Completed',
    },
  }[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: <Circle className="w-3 h-3 text-slate-500" />,
    label: status,
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs tracking-tight ${styles.bg} ${sizeClasses}`}
    >
      {styles.icon}
      <span>{styles.label}</span>
    </span>
  );
};
