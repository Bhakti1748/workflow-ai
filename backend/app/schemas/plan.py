from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class ScheduleSlot(BaseModel):
    start_time: str = Field(description="Start time, e.g. '09:00 AM'")
    end_time: str = Field(description="End time, e.g. '10:15 AM'")
    task_id: Optional[str] = None
    title: str = Field(description="Task title or activity name")
    slot_type: Literal["task", "break", "buffer"] = "task"
    priority: Optional[str] = "medium"
    category: Optional[str] = "Work"
    notes: Optional[str] = ""

class DailyPlanRequest(BaseModel):
    working_hours: float = Field(default=8.0, ge=1.0, le=16.0)
    start_time: str = Field(default="09:00 AM")

class DailyPlanResponse(BaseModel):
    date: str
    working_hours: float
    total_planned_minutes: int
    summary: str
    schedule: List[ScheduleSlot]
    recommendations: List[str] = []
