import { Task } from './task';

export interface AISuggestion {
  id: string;
  type: string;
  severity: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  action_label?: string;
  action_type?: string;
  target_id?: string;
}

export interface CategoryMetric {
  category: string;
  count: number;
  completed: number;
}

export interface DashboardStats {
  total_tasks: number;
  high_priority_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
  today_progress_percentage: number;
  total_estimated_minutes: number;
  today_tasks: Task[];
  upcoming_deadlines: Task[];
  ai_suggestions: AISuggestion[];
  categories: CategoryMetric[];
}
