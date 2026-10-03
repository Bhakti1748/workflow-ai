from datetime import datetime, timezone
import json
import uuid
from sqlalchemy import Column, String, Text, Float, DateTime
from app.database.base import Base

class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_date = Column(String(50), nullable=False)
    working_hours = Column(Float, default=8.0)
    schedule_json = Column(Text, default="[]")
    summary = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def schedule(self):
        try:
            return json.loads(self.schedule_json or "[]")
        except Exception:
            return []

    @schedule.setter
    def schedule(self, value):
        self.schedule_json = json.dumps(value or [])
