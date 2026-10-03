from datetime import datetime, timezone
import json
import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime
from backend.app.database.base import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    priority = Column(String(20), default="medium")  # high, medium, low
    status = Column(String(20), default="todo")      # todo, in_progress, completed
    deadline = Column(String(100), default="")
    estimated_minutes = Column(Integer, default=30)
    category = Column(String(100), default="General")
    assignee = Column(String(100), default="Me")
    dependencies_json = Column(Text, default="[]")
    subtasks_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @property
    def dependencies(self):
        try:
            return json.loads(self.dependencies_json or "[]")
        except Exception:
            return []

    @dependencies.setter
    def dependencies(self, value):
        self.dependencies_json = json.dumps(value or [])

    @property
    def subtasks(self):
        try:
            return json.loads(self.subtasks_json or "[]")
        except Exception:
            return []

    @subtasks.setter
    def subtasks(self, value):
        self.subtasks_json = json.dumps(value or [])
