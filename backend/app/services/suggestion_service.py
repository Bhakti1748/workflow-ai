from datetime import datetime, date, timedelta
from typing import List
from app.models.task import Task
from app.schemas.dashboard import AISuggestion

def parse_date_flexibly(date_str: str) -> date | None:
    if not date_str:
        return None
    cleaned = date_str.strip().lower()
    today = date.today()
    if cleaned in ("today", "now"):
        return today
    if cleaned == "tomorrow":
        return today + timedelta(days=1)
    
    weekday_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for idx, day_name in enumerate(weekday_names):
        if day_name in cleaned:
            current_weekday = today.weekday()
            days_ahead = (idx - current_weekday) % 7
            if days_ahead == 0:
                days_ahead = 7
            return today + timedelta(days=days_ahead)
            
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%b %d, %Y", "%B %d, %Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str.split("T")[0].strip(), fmt).date()
        except ValueError:
            continue
    return None

def generate_suggestions(tasks: List[Task]) -> List[AISuggestion]:
    suggestions: List[AISuggestion] = []
    today = date.today()

    active_tasks = [t for t in tasks if t.status != "completed"]
    
    # 1. Overdue Tasks Check
    overdue_tasks = []
    for t in active_tasks:
        parsed_d = parse_date_flexibly(t.deadline)
        if parsed_d and parsed_d < today:
            overdue_tasks.append(t)
    
    if overdue_tasks:
        titles = ", ".join(f"'{t.title}'" for t in overdue_tasks[:2])
        more = f" and {len(overdue_tasks) - 2} more" if len(overdue_tasks) > 2 else ""
        suggestions.append(AISuggestion(
            id="sug-overdue",
            type="overdue",
            severity="danger",
            title=f"{len(overdue_tasks)} Overdue Task{'s' if len(overdue_tasks) > 1 else ''}",
            message=f"{titles}{more} missed the deadline. Reschedule or prioritize immediate completion.",
            action_label="Review Overdue",
            action_type="filter_overdue"
        ))

    # 2. Too many high priority tasks
    high_priority_active = [t for t in active_tasks if t.priority == "high"]
    if len(high_priority_active) >= 1:
        count_label = f"{len(high_priority_active)} urgent task{'s' if len(high_priority_active) > 1 else ''} detected"
        suggestions.append(AISuggestion(
            id="sug-priority-overload",
            type="priority",
            severity="warning" if len(high_priority_active) >= 3 else "info",
            title=count_label,
            message=f"{count_label} in your active queue. Schedule focus blocks early today to ensure critical deliverables stay on track.",
            action_label="Plan My Day",
            action_type="plan_day"
        ))

    # 3. Upcoming Deadlines (Today or Tomorrow)
    impending = []
    for t in active_tasks:
        parsed_d = parse_date_flexibly(t.deadline)
        if parsed_d and (parsed_d == today or parsed_d == today + timedelta(days=1)):
            impending.append(t)

    if impending:
        titles = ", ".join(f"'{t.title}'" for t in impending[:2])
        suggestions.append(AISuggestion(
            id="sug-upcoming-deadline",
            type="deadline",
            severity="warning",
            title="Urgent Deadlines Approaching",
            message=f"{titles} {'is' if len(impending)==1 else 'are'} due within 24-48 hours. Ensure dependencies are cleared first.",
            action_label="Plan My Day",
            action_type="plan_day"
        ))

    # 4. Dependency Blockers
    # If task A depends on task B and task B is not completed
    task_map = {t.title.lower(): t for t in tasks}
    task_id_map = {t.id: t for t in tasks}
    blocked_tasks = []
    
    for t in active_tasks:
        for dep in t.dependencies:
            dep_clean = dep.strip().lower()
            target_task = task_map.get(dep_clean) or task_id_map.get(dep)
            if target_task and target_task.status != "completed":
                blocked_tasks.append((t, target_task))
                break

    if blocked_tasks:
        blocked_t, blocker_t = blocked_tasks[0]
        suggestions.append(AISuggestion(
            id="sug-dependency-blocker",
            type="dependency",
            severity="info",
            title=f"{blocker_t.title} should be completed before {blocked_t.title}",
            message=f"Sequential dependency identified: '{blocked_t.title}' is blocked until '{blocker_t.title}' (assigned to {blocker_t.assignee}) is completed.",
            action_label="Inspect Blocker",
            action_type="view_task",
            target_id=blocker_t.id
        ))

    # 5. Workload exceeding available hours
    total_est_minutes = sum(t.estimated_minutes for t in active_tasks)
    if total_est_minutes > 480:  # > 8 hours
        hours = round(total_est_minutes / 60, 1)
        suggestions.append(AISuggestion(
            id="sug-workload",
            type="workload",
            severity="warning",
            title="Your workload exceeds today's available time",
            message=f"Active tasks total {hours} hours of estimated work (exceeding standard 8h capacity). Use the AI Daily Planner to time-block realistic focus periods and buffer.",
            action_label="Plan My Day",
            action_type="plan_day"
        ))

    # 6. If no critical issues, show positive productivity tip
    if not suggestions:
        completed_count = len([t for t in tasks if t.status == "completed"])
        suggestions.append(AISuggestion(
            id="sug-balanced",
            type="tip",
            severity="success",
            title="Optimal Workload",
            message="Your task distribution and deadlines look balanced! Ready to tackle today's focus goals.",
            action_label="Add Work",
            action_type="add_work"
        ))

    return suggestions
