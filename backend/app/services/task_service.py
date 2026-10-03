import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, Subtask

def get_tasks(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assignee: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Task]:
    query = db.query(Task)
    if status and status != "all":
        query = query.filter(Task.status == status)
    if priority and priority != "all":
        query = query.filter(Task.priority == priority)
    if category and category != "all":
        query = query.filter(Task.category == category)
    if assignee and assignee != "all":
        query = query.filter(Task.assignee == assignee)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_filter),
                Task.description.ilike(search_filter),
                Task.category.ilike(search_filter),
                Task.assignee.ilike(search_filter),
            )
        )
    return query.order_by(Task.created_at.desc()).all()

def get_task_by_id(db: Session, task_id: str) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()

def create_task(db: Session, data: TaskCreate) -> Task:
    task_id = str(uuid.uuid4())
    subtasks_dicts = []
    for st in data.subtasks:
        subtasks_dicts.append({
            "id": st.id if st.id else str(uuid.uuid4()),
            "title": st.title,
            "completed": st.completed,
        })
    
    task = Task(
        id=task_id,
        title=data.title,
        description=data.description or "",
        priority=data.priority,
        status=data.status,
        deadline=data.deadline or "",
        estimated_minutes=data.estimated_minutes,
        category=data.category or "General",
        assignee=data.assignee or "Me",
    )
    task.dependencies = data.dependencies
    task.subtasks = subtasks_dicts
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

def update_task(db: Session, task_id: str, data: TaskUpdate) -> Optional[Task]:
    task = get_task_by_id(db, task_id)
    if not task:
        return None
    
    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.priority is not None:
        task.priority = data.priority
    if data.status is not None:
        task.status = data.status
    if data.deadline is not None:
        task.deadline = data.deadline
    if data.estimated_minutes is not None:
        task.estimated_minutes = data.estimated_minutes
    if data.category is not None:
        task.category = data.category
    if data.assignee is not None:
        task.assignee = data.assignee
    if data.dependencies is not None:
        task.dependencies = data.dependencies
    if data.subtasks is not None:
        task.subtasks = [
            {"id": st.id or str(uuid.uuid4()), "title": st.title, "completed": st.completed}
            for st in data.subtasks
        ]

    db.commit()
    db.refresh(task)
    return task

def delete_task(db: Session, task_id: str) -> bool:
    task = get_task_by_id(db, task_id)
    if not task:
        return False
    db.delete(task)
    db.commit()
    return True

def batch_create_tasks(db: Session, tasks_data: List[TaskCreate]) -> List[Task]:
    created = []
    for item in tasks_data:
        created.append(create_task(db, item))
    return created

def toggle_subtask(db: Session, task_id: str, subtask_id: str) -> Optional[Task]:
    task = get_task_by_id(db, task_id)
    if not task:
        return None
    current_subtasks = task.subtasks
    updated = False
    for st in current_subtasks:
        if st.get("id") == subtask_id:
            st["completed"] = not st.get("completed", False)
            updated = True
            break
    if updated:
        task.subtasks = current_subtasks
        # If all subtasks completed, option to complete or keep in progress
        db.commit()
        db.refresh(task)
    return task

def append_subtasks(db: Session, task_id: str, new_subtask_titles: List[str]) -> Optional[Task]:
    task = get_task_by_id(db, task_id)
    if not task:
        return None
    current = task.subtasks
    for title in new_subtask_titles:
        current.append({
            "id": str(uuid.uuid4()),
            "title": title,
            "completed": False
        })
    task.subtasks = current
    db.commit()
    db.refresh(task)
    return task
