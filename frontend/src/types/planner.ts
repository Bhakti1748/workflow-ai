export interface ScheduleSlot {
  start_time: string;
  end_time: string;
  task_id?: string | null;
  title: string;
  slot_type: 'task' | 'break' | 'buffer';
  priority?: string;
  category?: string;
  notes?: string;
}

export interface DailyPlan {
  date: string;
  working_hours: number;
  total_planned_minutes: number;
  summary: string;
  schedule: ScheduleSlot[];
  recommendations: string[];
}
