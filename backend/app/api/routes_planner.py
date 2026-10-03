from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.task import Task
from backend.app.models.plan import DailyPlan
from backend.app.schemas.plan import DailyPlanRequest, DailyPlanResponse
from backend.app.ai.gemini_service import generate_daily_plan_with_gemini

router = APIRouter(prefix="/api/plan", tags=["Daily Planner"])

@router.post("", response_model=DailyPlanResponse)
def create_daily_plan(payload: DailyPlanRequest, db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    plan_response = generate_daily_plan_with_gemini(
        tasks=tasks,
        working_hours=payload.working_hours,
        start_time=payload.start_time
    )

    # Persist the plan to DB
    new_plan = DailyPlan(
        plan_date=plan_response.date,
        working_hours=payload.working_hours,
        summary=plan_response.summary,
    )
    new_plan.schedule = {
        "schedule": [slot.model_dump() for slot in plan_response.schedule],
        "recommendations": plan_response.recommendations or [],
        "total_planned_minutes": plan_response.total_planned_minutes,
    }
    db.add(new_plan)
    db.commit()

    return plan_response

@router.get("/latest", response_model=DailyPlanResponse)
def get_latest_plan(db: Session = Depends(get_db)):
    latest = db.query(DailyPlan).order_by(DailyPlan.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No daily plan generated yet.")
    
    from backend.app.schemas.plan import ScheduleSlot
    raw = latest.schedule
    if isinstance(raw, dict):
        slots = [ScheduleSlot(**s) for s in raw.get("schedule", [])]
        recommendations = raw.get("recommendations", [])
        total_minutes = raw.get("total_planned_minutes", int(latest.working_hours * 60))
    elif isinstance(raw, list):
        slots = [ScheduleSlot(**s) for s in raw]
        recommendations = []
        total_minutes = sum(
            (s.get("end_time") != s.get("start_time")) * 30 for s in raw
        ) or int(latest.working_hours * 60)
    else:
        slots = []
        recommendations = []
        total_minutes = 0

    return DailyPlanResponse(
        date=latest.plan_date,
        working_hours=latest.working_hours,
        total_planned_minutes=total_minutes,
        summary=latest.summary,
        schedule=slots,
        recommendations=recommendations,
    )
