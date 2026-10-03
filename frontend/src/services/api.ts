import { Task, TaskCreateInput, TaskUpdateInput, ExtractionResult } from '../types/task';
import { DashboardStats } from '../types/dashboard';
import { DailyPlan, ScheduleSlot } from '../types/planner';
import { AssistantMessage, AssistantResponse } from '../types/assistant';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboard: () => request<DashboardStats>('/api/dashboard'),

  // Tasks
  getTasks: (params?: {
    status?: string;
    priority?: string;
    category?: string;
    assignee?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val && val !== 'all') {
          searchParams.append(key, val);
        }
      });
    }
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Task[]>(`/api/tasks${queryStr}`);
  },

  getTask: (id: string) => request<Task>(`/api/tasks/${id}`),

  createTask: (data: TaskCreateInput) =>
    request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (id: string, data: TaskUpdateInput) =>
    request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTask: (id: string) =>
    request<{ status: string; message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),

  batchCreateTasks: (tasks: TaskCreateInput[]) =>
    request<Task[]>('/api/tasks/batch', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    }),

  toggleSubtask: (taskId: string, subtaskId: string) =>
    request<Task>(`/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
      method: 'POST',
    }),

  breakdownTask: (taskId: string) =>
    request<{ task_id: string; suggested_subtasks: { title: string; completed: boolean }[] }>(
      `/api/tasks/${taskId}/breakdown`,
      { method: 'POST' }
    ),

  // Analysis & Document Upload
  analyzeText: (text: string) =>
    request<ExtractionResult>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  uploadDocument: async (file: File, autoAnalyze: boolean = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('auto_analyze', String(autoAnalyze));

    const url = `${BASE_URL}/api/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorDetail = 'Upload failed.';
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.message || errorDetail;
      } catch {
        errorDetail = await response.text();
      }
      throw new Error(errorDetail);
    }

    return response.json() as Promise<{
      filename: string;
      extracted_text: string;
      analysis?: ExtractionResult;
    }>;
  },

  // Daily Planner
  createDailyPlan: (workingHours: number = 8.0, startTime: string = '09:00 AM') =>
    request<DailyPlan>('/api/plan', {
      method: 'POST',
      body: JSON.stringify({
        working_hours: workingHours,
        start_time: startTime,
      }),
    }),

  getLatestPlan: () => request<DailyPlan>('/api/plan/latest'),

  // AI Assistant
  askAssistant: (query: string, history: AssistantMessage[] = []) =>
    request<AssistantResponse>('/api/assistant', {
      method: 'POST',
      body: JSON.stringify({
        query,
        history: history.map((h) => ({ role: h.role, content: h.content })),
      }),
    }),

  // Demo & System
  seedDemoWorkspace: () =>
    request<{ status: string; message: string; tasks_count: number }>('/api/demo/seed', {
      method: 'POST',
    }),

  getHealth: () =>
    request<{
      status: string;
      app: string;
      gemini_api_configured: boolean;
      model: string;
    }>('/api/health'),
};
