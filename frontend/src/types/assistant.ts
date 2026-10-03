export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  highlighted_task_ids?: string[];
  suggested_actions?: string[];
  timestamp?: string;
}

export interface AssistantResponse {
  reply: string;
  highlighted_task_ids: string[];
  suggested_actions: string[];
}
