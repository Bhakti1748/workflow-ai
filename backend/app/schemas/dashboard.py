from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.task import TaskResponse

class AISuggestion(BaseModel):
    id: str
    type: str  # 'overload' | 'deadline' | 'overdue' | 'dependency' | 'workload' | 'tip'
    severity: str  # 'warning' | 'danger' | 'info' | 'success'
    title: str
    message: str
    action_label: Optional[str] = None
    action_type: Optional[str] = None
    target_id: Optional[str] = None

class CategoryMetric(BaseModel):
    category: str
    count: int
    completed: int

class DashboardStats(BaseModel):
    total_tasks: int
    high_priority_tasks: int
    completed_tasks: int
    overdue_tasks: int
    in_progress_tasks: int
    completion_rate: float
    today_progress_percentage: float
    total_estimated_minutes: int
    today_tasks: List[TaskResponse]
    upcoming_deadlines: List[TaskResponse]
    ai_suggestions: List[AISuggestion]
    categories: List[CategoryMetric]
