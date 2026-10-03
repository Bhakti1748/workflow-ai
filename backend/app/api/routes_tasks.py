from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    BatchApproveRequest,
)
from backend.app.schemas.extraction import BreakdownResponse
from backend.app.services import task_service
from backend.app.ai.gemini_service import breakdown_task_with_gemini

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

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

@router.get("", response_model=List[TaskResponse])
def list_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    assignee: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    tasks = task_service.get_tasks(
        db, status=status, priority=priority, category=category, assignee=assignee, search=search
    )
    return [to_task_response(t) for t in tasks]

@router.post("", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    task = task_service.create_task(db, data)
    return to_task_response(task)

@router.post("/batch", response_model=List[TaskResponse], status_code=201)
def batch_create_tasks(payload: BatchApproveRequest, db: Session = Depends(get_db)):
    created = task_service.batch_create_tasks(db, payload.tasks)
    return [to_task_response(t) for t in created]

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    task = task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return to_task_response(task)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, data: TaskUpdate, db: Session = Depends(get_db)):
    task = task_service.update_task(db, task_id, data)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return to_task_response(task)

@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    success = task_service.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": f"Task {task_id} deleted"}

@router.post("/{task_id}/subtasks/{subtask_id}/toggle", response_model=TaskResponse)
def toggle_subtask(task_id: str, subtask_id: str, db: Session = Depends(get_db)):
    task = task_service.toggle_subtask(db, task_id, subtask_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task or subtask not found")
    return to_task_response(task)

@router.post("/{task_id}/breakdown", response_model=BreakdownResponse)
def breakdown_task(task_id: str, db: Session = Depends(get_db)):
    task = task_service.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    subtasks = breakdown_task_with_gemini(task.title, task.description)
    return BreakdownResponse(task_id=task_id, suggested_subtasks=subtasks)
