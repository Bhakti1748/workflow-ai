from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class ExtractedSubtask(BaseModel):
    title: str = Field(description="Actionable subtask step")
    completed: bool = False

class ExtractedTask(BaseModel):
    id: str = Field(default="", description="Unique identifier or slug for reference in dependencies")
    title: str = Field(description="Clear, concise task title")
    description: str = Field(default="", description="Details, requirements, and context")
    priority: Literal["high", "medium", "low"] = Field(default="medium", description="Priority level based on urgency and impact")
    status: Literal["todo", "in_progress", "completed"] = Field(default="todo", description="Initial status")
    deadline: str = Field(default="", description="Target deadline formatted like 'YYYY-MM-DD' or relative like 'Tomorrow', 'Friday', 'Monday'")
    estimated_minutes: int = Field(default=30, description="Estimated time to complete in minutes")
    category: str = Field(default="General", description="Project department or category e.g. Engineering, Design, QA, Presentation, Planning")
    assignee: str = Field(default="Me", description="Person responsible e.g. Rahul, Priya, Me, or specific team member")
    dependencies: List[str] = Field(default_factory=list, description="List of task titles or IDs that must be completed first")
    subtasks: List[ExtractedSubtask] = Field(default_factory=list, description="Logical subtasks to accomplish this task")

class ExtractionResult(BaseModel):
    summary: str = Field(description="Brief 1-2 sentence overview of the meeting or document analyzed")
    people_detected: List[str] = Field(default_factory=list, description="Names of all individuals identified")
    tasks: List[ExtractedTask] = Field(description="Structured tasks extracted from the notes or document")
    reasoning_summary: Optional[str] = Field(default="", description="Concise explanation of key priorities, sequencing logic, or bottlenecks detected (e.g. '3 urgent tasks detected. API testing should be completed before deployment.')")

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw meeting notes or work instructions")

class BreakdownRequest(BaseModel):
    task_id: str
    task_title: str
    task_description: Optional[str] = ""

class BreakdownResponse(BaseModel):
    task_id: str
    suggested_subtasks: List[ExtractedSubtask]
