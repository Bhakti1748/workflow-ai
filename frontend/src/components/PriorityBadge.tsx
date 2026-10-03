import React from 'react';
import { Priority } from '../types/task';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const styles = {
    high: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/90',
      dot: 'bg-rose-500',
      label: 'High Priority',
    },
    medium: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200/90',
      dot: 'bg-amber-500',
      label: 'Medium Priority',
    },
    low: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200/90',
      dot: 'bg-slate-400',
      label: 'Low Priority',
    },
  }[priority] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: priority,
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs tracking-tight ${styles.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} ${priority === 'high' ? 'animate-pulse' : ''}`} />
      <span className="capitalize">{styles.label}</span>
    </span>
  );
};
