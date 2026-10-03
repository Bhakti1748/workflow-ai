from typing import List, Optional
from pydantic import BaseModel, Field

class AssistantMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str

class AssistantRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User's question or command")
    history: List[AssistantMessage] = Field(default_factory=list)

class AssistantResponse(BaseModel):
    reply: str = Field(description="Helpful markdown response grounded in current task data")
    highlighted_task_ids: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
