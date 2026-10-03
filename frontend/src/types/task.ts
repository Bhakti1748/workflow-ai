export type Priority = 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in_progress' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  deadline: string;
  estimated_minutes: number;
  category: string;
  assignee: string;
  dependencies: string[];
  subtasks: Subtask[];
  created_at?: string;
  updated_at?: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  deadline?: string;
  estimated_minutes?: number;
  category?: string;
  assignee?: string;
  dependencies?: string[];
  subtasks?: Subtask[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  deadline?: string;
  estimated_minutes?: number;
  category?: string;
  assignee?: string;
  dependencies?: string[];
  subtasks?: Subtask[];
}

export interface ExtractedSubtask {
  title: string;
  completed?: boolean;
}

export interface ExtractedTask {
  id?: string;
  title: string;
  description?: string;
  priority: Priority;
  status?: Status;
  deadline?: string;
  estimated_minutes?: number;
  category?: string;
  assignee?: string;
  dependencies?: string[];
  subtasks?: ExtractedSubtask[];
}

export interface ExtractionResult {
  summary: string;
  people_detected: string[];
  tasks: ExtractedTask[];
  reasoning_summary?: string;
}
