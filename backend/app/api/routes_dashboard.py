from datetime import date, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.task import Task
from backend.app.schemas.dashboard import DashboardStats, CategoryMetric
from backend.app.schemas.task import TaskResponse
from backend.app.services.suggestion_service import generate_suggestions, parse_date_flexibly

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def to_task_response(task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description or "",
        priority=task.priority,
        status=task.status,
        deadline=task.deadline or "",
        estimated_minutes=task.estimated_minutes or 30,
        category=task.category or "General",
        assignee=task.assignee or "Me",
        dependencies=task.dependencies,
        subtasks=task.subtasks,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )

@router.get("", response_model=DashboardStats)
def get_dashboard_data(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    today = date.today()

    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t.status == "completed"])
    in_progress_tasks = len([t for t in tasks if t.status == "in_progress"])
    high_priority_tasks = len([t for t in tasks if t.priority == "high" and t.status != "completed"])
    
    overdue_count = 0
    upcoming_deadlines = []
    today_tasks = []

    cat_counts = defaultdict(int)
    cat_completed = defaultdict(int)

    for t in tasks:
        cat_counts[t.category or "General"] += 1
        if t.status == "completed":
            cat_completed[t.category or "General"] += 1

        parsed_d = parse_date_flexibly(t.deadline)
        if t.status != "completed":
            if parsed_d and parsed_d < today:
                overdue_count += 1
            if parsed_d and parsed_d >= today:
                upcoming_deadlines.append((parsed_d, t))
            elif t.deadline and t.deadline.lower() in ("today", "tomorrow"):
                upcoming_deadlines.append((today, t))

            # Items for today's focus queue
            if t.status == "in_progress" or (parsed_d and parsed_d <= today + timedelta(days=1)) or t.priority == "high":
                today_tasks.append(t)

    # Sort upcoming deadlines by date
    upcoming_deadlines.sort(key=lambda x: x[0])
    upcoming_tasks_sorted = [to_task_response(item[1]) for item in upcoming_deadlines[:6]]

    # Ensure today's tasks is capped to top 6
    today_tasks_resp = [to_task_response(t) for t in today_tasks[:6]]

    completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0
    
    # Today's progress: ratio of today's completed items vs total today
    today_total = len(today_tasks_resp) + len([t for t in tasks if t.status == "completed"])
    today_progress = round((completed_tasks / today_total * 100), 1) if today_total > 0 else completion_rate

    total_est_minutes = sum(t.estimated_minutes or 30 for t in tasks if t.status != "completed")

    suggestions = generate_suggestions(tasks)

    categories_list = [
        CategoryMetric(
            category=cat,
            count=count,
            completed=cat_completed[cat]
        )
        for cat, count in cat_counts.items()
    ]

    return DashboardStats(
        total_tasks=total_tasks,
        high_priority_tasks=high_priority_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_count,
        in_progress_tasks=in_progress_tasks,
        completion_rate=completion_rate,
        today_progress_percentage=today_progress,
        total_estimated_minutes=total_est_minutes,
        today_tasks=today_tasks_resp,
        upcoming_deadlines=upcoming_tasks_sorted,
        ai_suggestions=suggestions,
        categories=categories_list,
    )
