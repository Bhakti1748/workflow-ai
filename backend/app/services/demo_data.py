from datetime import date, timedelta
import uuid
from typing import List
from sqlalchemy.orm import Session
from backend.app.models.task import Task
from backend.app.models.plan import DailyPlan

def seed_demo_workspace(db: Session) -> List[Task]:
    """Clears existing tasks and populates the database with realistic demo tasks including the required demo scenario."""
    db.query(Task).delete()
    db.query(DailyPlan).delete()
    db.commit()

    today = date.today()
    tomorrow = today + timedelta(days=1)
    
    # Calculate upcoming days
    def get_upcoming_weekday(target_weekday_idx: int) -> str:
        # 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
        days_ahead = (target_weekday_idx - today.weekday()) % 7
        if days_ahead <= 0:
            days_ahead += 7
        return (today + timedelta(days=days_ahead)).isoformat()

    thursday_str = get_upcoming_weekday(3)
    friday_str = get_upcoming_weekday(4)
    monday_str = get_upcoming_weekday(0)
    tomorrow_str = tomorrow.isoformat()
    yesterday_str = (today - timedelta(days=1)).isoformat()

    # Pre-generate IDs to link dependencies
    auth_task_id = str(uuid.uuid4())
    api_test_id = str(uuid.uuid4())
    presentation_id = str(uuid.uuid4())
    submit_id = str(uuid.uuid4())

    demo_tasks = [
        # 1. From Demo Scenario: Rahul will finish authentication by Friday
        Task(
            id=auth_task_id,
            title="Implement OAuth & JWT Authentication Flow",
            description="Complete the user authentication module with OAuth2, JWT tokens, session refresh, and role-based access control.",
            priority="high",
            status="in_progress",
            deadline=friday_str,
            estimated_minutes=180,
            category="Backend",
            assignee="Rahul",
            dependencies_json="[]",
            subtasks_json='['
                '{"id": "sub-1", "title": "Configure JWT token generation and validation", "completed": true},'
                '{"id": "sub-2", "title": "Implement OAuth2 Google login callback", "completed": true},'
                '{"id": "sub-3", "title": "Add role-based authorization middleware", "completed": false},'
                '{"id": "sub-4", "title": "Write unit tests for auth endpoints", "completed": false}'
            ']'
        ),

        # 2. From Demo Scenario: Priya will prepare the presentation by Thursday
        Task(
            id=presentation_id,
            title="Prepare Hackathon Pitch Deck & Demo Presentation",
            description="Build 10-slide deck covering problem statement, architecture overview, live demo walkthrough, and market potential.",
            priority="high",
            status="in_progress",
            deadline=thursday_str,
            estimated_minutes=120,
            category="Marketing",
            assignee="Priya",
            dependencies_json="[]",
            subtasks_json='['
                '{"id": "sub-5", "title": "Outline value proposition and key metrics", "completed": true},'
                '{"id": "sub-6", "title": "Design Figma slides with UI mockups", "completed": false},'
                '{"id": "sub-7", "title": "Rehearse 3-minute pitch timing", "completed": false}'
            ']'
        ),

        # 3. From Demo Scenario: I need to test the API tomorrow (depends on auth)
        Task(
            id=api_test_id,
            title="Execute End-to-End API Integration Testing",
            description="Verify all REST API endpoints under load, test edge case payloads, validate error responses, and benchmark latency.",
            priority="high",
            status="todo",
            deadline=tomorrow_str,
            estimated_minutes=90,
            category="QA",
            assignee="Me",
            dependencies_json=f'["{auth_task_id}"]',
            subtasks_json='['
                '{"id": "sub-8", "title": "Write Postman collection for core endpoints", "completed": false},'
                '{"id": "sub-9", "title": "Test boundary conditions & malformed input", "completed": false},'
                '{"id": "sub-10", "title": "Validate response latency < 200ms", "completed": false}'
            ']'
        ),

        # 4. From Demo Scenario: The project must be submitted on Monday (depends on presentation & testing)
        Task(
            id=submit_id,
            title="Final Project Packaging & Submission",
            description="Assemble final GitHub repository, write deployment README, record backup demo video, and submit to portal.",
            priority="high",
            status="todo",
            deadline=monday_str,
            estimated_minutes=60,
            category="Management",
            assignee="Me",
            dependencies_json=f'["{presentation_id}", "{api_test_id}"]',
            subtasks_json='['
                '{"id": "sub-11", "title": "Verify clean git history and remove secrets", "completed": false},'
                '{"id": "sub-12", "title": "Upload video to YouTube unlisted link", "completed": false},'
                '{"id": "sub-13", "title": "Complete devpost/hackathon submission form", "completed": false}'
            ']'
        ),

        # Additional realistic tasks to show full productivity suite
        Task(
            id=str(uuid.uuid4()),
            title="Refine Dashboard UI & Color Hierarchy",
            description="Polish Tailwind CSS spacing, typography, contrast ratios, and responsive layout for mobile screens.",
            priority="medium",
            status="completed",
            deadline=yesterday_str,
            estimated_minutes=75,
            category="Frontend",
            assignee="Me",
            dependencies_json="[]",
            subtasks_json='['
                '{"id": "sub-14", "title": "Audit typography scale & font weights", "completed": true},'
                '{"id": "sub-15", "title": "Implement accessible contrast badges", "completed": true}'
            ']'
        ),

        Task(
            id=str(uuid.uuid4()),
            title="Document API Endpoints in OpenAPI & Swagger",
            description="Write comprehensive docstrings, parameter schemas, and response examples for all backend routes.",
            priority="low",
            status="todo",
            deadline=(today + timedelta(days=5)).isoformat(),
            estimated_minutes=45,
            category="Documentation",
            assignee="Rahul",
            dependencies_json="[]",
            subtasks_json='['
                '{"id": "sub-16", "title": "Add summary descriptions to FastAPI decorators", "completed": false},'
                '{"id": "sub-17", "title": "Export openapi.json for frontend codegen", "completed": false}'
            ']'
        ),

        Task(
            id=str(uuid.uuid4()),
            title="Setup SQLite Automated Backup Script",
            description="Create daily SQLite backup hook before migrations and container shutdown.",
            priority="low",
            status="completed",
            deadline=yesterday_str,
            estimated_minutes=30,
            category="DevOps",
            assignee="Me",
            dependencies_json="[]",
            subtasks_json='['
                '{"id": "sub-18", "title": "Write backup script", "completed": true}'
            ']'
        ),
    ]

    for t in demo_tasks:
        db.add(t)

    db.commit()
    return demo_tasks
