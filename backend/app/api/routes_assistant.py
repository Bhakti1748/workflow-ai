from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.task import Task
from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.ai.gemini_service import ask_assistant_with_gemini

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

@router.post("", response_model=AssistantResponse)
@router.post("/chat", response_model=AssistantResponse)
def chat_with_assistant(payload: AssistantRequest, db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    response = ask_assistant_with_gemini(
        query=payload.query,
        tasks=tasks,
        history=payload.history
    )
    return response
