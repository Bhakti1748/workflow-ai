from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.demo_data import seed_demo_workspace
from app.ai.gemini_service import is_api_configured, GEMINI_MODEL

router = APIRouter(prefix="/api", tags=["Demo & System"])

@router.post("/demo/seed")
def seed_demo(db: Session = Depends(get_db)):
    tasks = seed_demo_workspace(db)
    return {
        "status": "success",
        "message": f"Successfully loaded demo workspace with {len(tasks)} realistic tasks including meeting scenario.",
        "tasks_count": len(tasks),
        "task_count": len(tasks),
    }

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": "WorkFlow AI",
        "gemini_api_configured": is_api_configured(),
        "model": GEMINI_MODEL,
    }
