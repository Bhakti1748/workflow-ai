from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class Subtask(BaseModel):
    id: str = Field(default_factory=lambda: "")
    title: str
    completed: bool = False

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, description="Task title")
    description: Optional[str] = ""
    priority: Literal["high", "medium", "low"] = "medium"
    status: Literal["todo", "in_progress", "completed"] = "todo"
    deadline: Optional[str] = ""
    estimated_minutes: int = 30
    category: str = "General"
    assignee: str = "Me"
    dependencies: List[str] = []
    subtasks: List[Subtask] = []

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    status: Optional[Literal["todo", "in_progress", "completed"]] = None
    deadline: Optional[str] = None
    estimated_minutes: Optional[int] = None
    category: Optional[str] = None
    assignee: Optional[str] = None
    dependencies: Optional[List[str]] = None
    subtasks: Optional[List[Subtask]] = None

class TaskResponse(TaskBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BatchApproveRequest(BaseModel):
    tasks: List[TaskCreate]
