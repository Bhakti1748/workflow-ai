import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database.session import init_db, SessionLocal
from app.models.task import Task
from app.services.demo_data import seed_demo_workspace
from app.api import (
    routes_tasks,
    routes_analyze,
    routes_planner,
    routes_assistant,
    routes_dashboard,
    routes_demo,
)

load_dotenv()

# Initialize SQLite tables on import and lifespan
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is ready; do NOT auto-seed so workspace starts clean
    init_db()
    yield

app = FastAPI(
    title="WorkFlow AI API",
    description="Backend API for WorkFlow AI - Autonomous Productivity & Task Automation Agent",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during development/hackathon for seamless access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(routes_dashboard.router)
app.include_router(routes_tasks.router)
app.include_router(routes_analyze.router)
app.include_router(routes_planner.router)
app.include_router(routes_assistant.router)
app.include_router(routes_demo.router)

@app.get("/")
def root():
    return {
        "message": "WorkFlow AI API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)