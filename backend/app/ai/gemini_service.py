import os
import json
import logging
from typing import List, Optional
from dotenv import load_dotenv

# Ensure backend/.env is loaded regardless of execution cwd
_backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_env_path = os.path.join(_backend_dir, ".env")
if os.path.exists(_env_path):
    load_dotenv(_env_path)
load_dotenv()

from backend.app.schemas.extraction import (
    ExtractionResult,
    ExtractedTask,
    ExtractedSubtask,
)
from backend.app.schemas.plan import DailyPlanResponse, ScheduleSlot
from backend.app.schemas.assistant import AssistantResponse, AssistantMessage
from backend.app.models.task import Task

logger = logging.getLogger(__name__)

# Candidate models in order of priority; if a model experiences high demand (503), the next is tried
MODELS_TO_TRY = [
    os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite"),
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3-flash-preview",
]
GEMINI_MODEL = MODELS_TO_TRY[0]

def get_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return key

def is_api_configured() -> bool:
    key = get_api_key()
    return bool(key and key != "YOUR_GEMINI_API_KEY_HERE" and len(key) > 8)

def get_gemini_client():
    from google import genai
    key = get_api_key()
    if not key:
        raise ValueError("GEMINI_API_KEY is not configured in environment or .env file.")
    return genai.Client(api_key=key)

# -------------------------------------------------------------
# 1. AI Task Extraction
# -------------------------------------------------------------
def extract_tasks_with_gemini(content: str) -> ExtractionResult:
    """Dynamically extracts tasks, people, deadlines, priorities, duration, dependencies, category, and subtasks
    from ANY unstructured text, meeting notes, transcripts, or uploaded document across ANY domain."""
    if not is_api_configured():
        return _fallback_heuristic_extraction(content, warning="Gemini API Key is not configured. Displaying generic dynamic extraction.")

    client = get_gemini_client()
    system_instruction = (
        "You are an expert autonomous AI productivity agent for WorkFlow AI. Your goal is to analyze any "
        "unstructured work information — from ANY domain (software, healthcare, culinary, legal, construction, "
        "finance, education, manufacturing, events, or general business) — and extract structured, actionable tasks.\n\n"
        "Extraction Guidelines:\n"
        "1. Tasks: Extract clear, concise, actionable task titles and contextual descriptions based purely on the input.\n"
        "2. People: Identify all individuals or roles mentioned in the input and assign each task to the specific responsible person. "
        "If first-person ('I will', 'my task') is used, assign to 'Me'. If a role is mentioned without a person's name (e.g. 'Lab Tech', 'Electrician'), use that role. If unknown, use 'Unassigned'.\n"
        "3. Deadlines: Accurately extract all specified or implied deadlines, times, dates, or days of the week.\n"
        "4. Priorities: Assign 'high', 'medium', or 'low' based on the stated urgency, critical path, or potential operational risk.\n"
        "5. Durations: Estimate realistic execution duration in minutes (e.g., 15, 30, 45, 60, 90, 120, 180) based on complexity.\n"
        "6. Category: Dynamically determine the domain category matching the context (e.g., 'Surgery', 'Baking', 'Structural', 'Legal', 'Quality Assurance', 'Operations', 'Procurement', etc.).\n"
        "7. Dependencies: Detect genuine sequence prerequisites between the extracted tasks.\n"
        "8. Subtasks: Break down each task into 2 to 4 logical, domain-appropriate execution steps.\n"
        "9. Reasoning Summary: Provide a 1-2 sentence concise useful explanation summarizing key priorities and sequence logic (e.g. '3 urgent tasks detected. API testing should be completed before deployment.'). Do NOT expose raw chain-of-thought."
    )

    prompt = f"Analyze the following work information and extract structured tasks:\n\n---\n{content}\n---"

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            from google.genai import types
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=ExtractionResult,
                    temperature=0.1,
                ),
            )
            data = json.loads(response.text)
            return ExtractionResult(**data)
        except Exception as e:
            logger.warning(f"Extraction attempt with model {model_name} failed: {e}. Trying next candidate...")
            last_error = e

    logger.error(f"All Gemini models exhausted for task extraction. Last error: {last_error}")
    return _fallback_heuristic_extraction(content, warning=f"Gemini API temporarily unavailable: {str(last_error)}")


# -------------------------------------------------------------
# 2. Task Breakdown
# -------------------------------------------------------------
def breakdown_task_with_gemini(task_title: str, task_description: str = "") -> List[ExtractedSubtask]:
    """Dynamically breaks down any task into 3-6 actionable subtasks appropriate for its specific domain."""
    if not is_api_configured():
        return _fallback_generic_breakdown(task_title)

    client = get_gemini_client()
    prompt = (
        f"You are an expert productivity planner. Break down the following task into 3 to 6 practical, actionable subtasks "
        f"specifically tailored to its domain and requirements:\n"
        f"Task Title: {task_title}\n"
        f"Task Description: {task_description or 'No additional description provided.'}\n"
    )

    class SubtasksContainer(ExtractionResult.__base__):
        subtasks: List[ExtractedSubtask]

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            from google.genai import types
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SubtasksContainer,
                    temperature=0.2,
                ),
            )
            data = json.loads(response.text)
            return [ExtractedSubtask(**item) for item in data.get("subtasks", [])]
        except Exception as e:
            logger.warning(f"Task breakdown with {model_name} failed: {e}")
            last_error = e

    return _fallback_generic_breakdown(task_title)


# -------------------------------------------------------------
# 3. AI Daily Planner
# -------------------------------------------------------------
def generate_daily_plan_with_gemini(tasks: List[Task], working_hours: float = 8.0, start_time: str = "09:00 AM") -> DailyPlanResponse:
    """Generates a realistic, chronological daily schedule tailored strictly to the actual tasks stored in SQLite."""
    from datetime import date
    today_str = date.today().isoformat()
    active_tasks = [t for t in tasks if t.status != "completed"]

    if not active_tasks:
        return DailyPlanResponse(
            date=today_str,
            working_hours=working_hours,
            total_planned_minutes=0,
            summary="All tasks are completed! Enjoy your productive day or add new work items.",
            schedule=[
                ScheduleSlot(
                    start_time=start_time,
                    end_time="10:00 AM",
                    title="Planning & Review",
                    slot_type="buffer",
                    priority="low",
                    category="Planning",
                    notes="Review upcoming milestones and organize priorities."
                )
            ],
            recommendations=["All caught up. Review backlogged items or celebrate your progress!"]
        )

    tasks_context = []
    for t in active_tasks:
        tasks_context.append({
            "id": t.id,
            "title": t.title,
            "priority": t.priority,
            "deadline": t.deadline,
            "estimated_minutes": t.estimated_minutes,
            "category": t.category,
            "assignee": t.assignee,
            "dependencies": t.dependencies,
        })

    if not is_api_configured():
        return _fallback_dynamic_planner(active_tasks, working_hours, start_time)

    client = get_gemini_client()
    system_instruction = (
        "You are an expert executive productivity scheduler. You construct a realistic, chronological daily schedule "
        "tailored strictly to the user's active tasks in their workspace.\n"
        "Guidelines:\n"
        "1. Schedule high priority and urgent tasks during peak morning energy slots.\n"
        "2. Strictly respect prerequisites and dependencies.\n"
        "3. Include 10-15 minute rest/buffer slots after intense focus blocks.\n"
        "4. Keep total work time within the available working hours.\n"
        "5. The schedule must directly reflect the user's actual tasks provided in the context."
    )

    prompt = (
        f"Available working hours: {working_hours} hours. Day starts at: {start_time}.\n"
        f"Active Tasks in User Workspace:\n{json.dumps(tasks_context, indent=2)}\n\n"
        f"Generate a chronological daily plan matching the required schema."
    )

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            from google.genai import types
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=DailyPlanResponse,
                    temperature=0.2,
                ),
            )
            data = json.loads(response.text)
            return DailyPlanResponse(**data)
        except Exception as e:
            logger.warning(f"Daily planner with {model_name} failed: {e}")
            last_error = e

    return _fallback_dynamic_planner(active_tasks, working_hours, start_time)


# -------------------------------------------------------------
# 4. AI Assistant
# -------------------------------------------------------------
def ask_assistant_with_gemini(query: str, tasks: List[Task], history: List[AssistantMessage] = None) -> AssistantResponse:
    """Answers user queries grounded dynamically in the actual SQLite task database without any domain assumptions."""
    from datetime import date
    today_str = date.today().isoformat()

    tasks_context = []
    for t in tasks:
        tasks_context.append({
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "deadline": t.deadline,
            "estimated_minutes": t.estimated_minutes,
            "category": t.category,
            "assignee": t.assignee,
            "dependencies": t.dependencies,
            "subtasks_count": len(t.subtasks),
            "subtasks_completed": len([s for s in t.subtasks if s.get("completed")]),
        })

    if not is_api_configured():
        return _fallback_dynamic_assistant(query, tasks)

    client = get_gemini_client()
    system_instruction = (
        "You are WorkFlow AI Assistant, an intelligent, grounded productivity coach.\n"
        "You have direct access to the user's live task database provided in the context.\n"
        "Rules:\n"
        "1. Strictly ground your answer in the specific tasks, assignees, deadlines, and categories currently stored in the user's database.\n"
        "2. NEVER invent names, roles, or tasks that do not exist in the provided database.\n"
        "3. If drafting a message, draft it about the user's ACTUAL stored tasks and assignees.\n"
        "4. Be concise, actionable, and formatted in clean markdown bullet points.\n"
        f"Today's date is: {today_str}."
    )

    history_text = ""
    if history:
        for msg in history[-4:]:
            history_text += f"{msg.role.upper()}: {msg.content}\n"

    prompt = (
        f"User's Live Task Database:\n{json.dumps(tasks_context, indent=2)}\n\n"
        f"Conversation Context:\n{history_text}\n"
        f"User Inquiry: {query}\n\n"
        "Provide a grounded response with relevant highlighted task IDs and 2-3 suggested quick action chips."
    )

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            from google.genai import types
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=AssistantResponse,
                    temperature=0.2,
                ),
            )
            data = json.loads(response.text)
            return AssistantResponse(**data)
        except Exception as e:
            logger.warning(f"Assistant with {model_name} failed: {e}")
            last_error = e

    return _fallback_dynamic_assistant(query, tasks)


# -------------------------------------------------------------
# Domain-Independent Generic Fallbacks (When API key is completely absent)
# -------------------------------------------------------------
def _fallback_generic_breakdown(title: str) -> List[ExtractedSubtask]:
    return [
        ExtractedSubtask(title=f"Review scope and specifications for {title}", completed=False),
        ExtractedSubtask(title=f"Gather prerequisites and prepare tools", completed=False),
        ExtractedSubtask(title=f"Execute core deliverables for {title}", completed=False),
        ExtractedSubtask(title=f"Validate quality and complete handoff", completed=False),
    ]

def _fallback_heuristic_extraction(content: str, warning: str = "") -> ExtractionResult:
    """Fully dynamic, domain-independent heuristic extractor."""
    lines = [l.strip() for l in content.split("\n") if l.strip()]
    tasks: List[ExtractedTask] = []
    people = set()

    for idx, line in enumerate(lines):
        clean = line.lstrip("-*1234567890. ")
        if not clean or len(clean) < 5:
            continue
        
        # Skip pure section headers
        if clean.endswith(":") and len(clean.split()) <= 4:
            continue
        
        # Detect person dynamically (e.g. "Dr. Patel will...", "Chef Marco must...", "Sarah to...")
        assignee = "Me"
        words = clean.split()
        if len(words) >= 2 and words[1].lower() in ("will", "must", "needs", "should", "to", "can"):
            potential_name = words[0].strip(",.:")
            if len(potential_name) > 1 and potential_name.isalpha():
                assignee = potential_name
                people.add(assignee)

        # Detect deadline dynamically if day or time is mentioned
        deadline = "Upcoming"
        lower_line = clean.lower()
        for marker in ["today", "tomorrow", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
            if marker in lower_line:
                deadline = marker.capitalize()
                break

        priority = "medium"
        if any(w in lower_line for w in ["urgent", "must", "critical", "immediately", "asap", "priority", "emergency"]):
            priority = "high"
        elif any(w in lower_line for w in ["later", "low", "optional", "whenever", "backlog"]):
            priority = "low"

        tasks.append(ExtractedTask(
            id=f"ext-{idx+1}",
            title=clean,
            description=f"Action item extracted from text: {clean}",
            priority=priority,
            status="todo",
            deadline=deadline,
            estimated_minutes=60 if priority == "high" else 30,
            category="General",
            assignee=assignee,
            dependencies=[],
            subtasks=[
                ExtractedSubtask(title=f"Initial planning for {clean[:30]}...", completed=False),
                ExtractedSubtask(title="Execution of deliverables", completed=False),
                ExtractedSubtask(title="Review and verification", completed=False),
            ]
        ))

    summary = f"Extracted {len(tasks)} tasks dynamically from the provided content."
    if warning:
        summary += f" ({warning})"

    urgent_count = len([t for t in tasks if t.priority == "high"])
    reasoning_summary = f"{urgent_count} urgent tasks detected." if urgent_count else "Tasks extracted with balanced priority distribution."
    if len(tasks) > 2:
        reasoning_summary += f" Plan your day early to maintain team velocity across {len(people) or 1} team members."

    return ExtractionResult(
        summary=summary,
        people_detected=list(people),
        tasks=tasks,
        reasoning_summary=reasoning_summary
    )

def _fallback_dynamic_planner(tasks: List[Task], working_hours: float, start_time: str) -> DailyPlanResponse:
    from datetime import date
    slots: List[ScheduleSlot] = []
    
    priority_order = {"high": 0, "medium": 1, "low": 2}
    sorted_tasks = sorted(tasks, key=lambda t: priority_order.get(t.priority, 1))

    current_hour = 9
    current_minute = 0
    total_planned = 0
    max_minutes = int(working_hours * 60)

    for idx, t in enumerate(sorted_tasks):
        if total_planned >= max_minutes:
            break
        
        duration = min(t.estimated_minutes or 45, 120)
        start_str = f"{current_hour:02d}:{current_minute:02d} {'AM' if current_hour < 12 else 'PM'}"
        
        end_minute = current_minute + duration
        end_hour = current_hour + (end_minute // 60)
        end_minute = end_minute % 60
        end_str = f"{end_hour:02d}:{end_minute:02d} {'AM' if end_hour < 12 else 'PM'}"

        slots.append(ScheduleSlot(
            start_time=start_str,
            end_time=end_str,
            task_id=t.id,
            title=t.title,
            slot_type="task",
            priority=t.priority,
            category=t.category,
            notes=f"Assigned to {t.assignee}. Priority: {t.priority.upper()}"
        ))

        total_planned += duration
        current_hour = end_hour
        current_minute = end_minute

        if idx < len(sorted_tasks) - 1 and total_planned + 15 <= max_minutes:
            buffer_end_min = (current_minute + 15) % 60
            buffer_end_hr = current_hour + ((current_minute + 15) // 60)
            slots.append(ScheduleSlot(
                start_time=end_str,
                end_time=f"{buffer_end_hr:02d}:{buffer_end_min:02d} {'AM' if buffer_end_hr < 12 else 'PM'}",
                title="Buffer & Rest",
                slot_type="break",
                priority="low",
                category="Break",
                notes="Step away, refresh, review upcoming steps."
            ))
            current_hour = buffer_end_hr
            current_minute = buffer_end_min
            total_planned += 15

    return DailyPlanResponse(
        date=date.today().isoformat(),
        working_hours=working_hours,
        total_planned_minutes=total_planned,
        summary=f"Dynamically organized {len(slots)} schedule blocks based on your current workspace tasks.",
        schedule=slots,
        recommendations=[
            "Focus on high-priority items first during morning hours.",
            "Protect your buffer intervals to prevent cognitive fatigue.",
        ]
    )

def _fallback_dynamic_assistant(query: str, tasks: List[Task]) -> AssistantResponse:
    """Dynamically answers questions based strictly on actual stored tasks without hardcoded domain data."""
    q = query.lower()
    active = [t for t in tasks if t.status != "completed"]
    high = [t for t in active if t.priority == "high"]
    
    if not tasks:
        return AssistantResponse(
            reply="Your workspace currently has no tasks. Add meeting notes or upload a document to get started!",
            highlighted_task_ids=[],
            suggested_actions=["Add Work", "Load Demo Workspace"]
        )

    if "first" in q or "start" in q or "priority" in q:
        target = high[0] if high else active[0]
        return AssistantResponse(
            reply=f"### Recommended First Focus\n\nYou should start with **{target.title}** (Priority: **{target.priority.upper()}**, Assignee: **{target.assignee}**, Deadline: **{target.deadline or 'Upcoming'}**).\n\n**Reason:**\n- It is your highest priority item currently awaiting completion in the workspace.",
            highlighted_task_ids=[target.id],
            suggested_actions=["Mark In Progress", "Plan My Day", "Break Down Task"]
        )

    if "overdue" in q or "deadline" in q:
        with_deadlines = [t for t in active if t.deadline]
        if with_deadlines:
            items_list = "\n".join(f"• **{t.title}** — Due: `{t.deadline}` (Assigned to {t.assignee})" for t in with_deadlines[:4])
            return AssistantResponse(
                reply=f"### Active Task Deadlines\n\nHere are the upcoming deadlines in your current workspace:\n\n{items_list}",
                highlighted_task_ids=[t.id for t in with_deadlines[:4]],
                suggested_actions=["View Tasks", "Plan My Day"]
            )
        else:
            return AssistantResponse(
                reply=f"You have **{len(active)}** active tasks, but none have urgent deadlines set.",
                highlighted_task_ids=[t.id for t in active[:2]],
                suggested_actions=["View Tasks", "Plan My Day"]
            )

    if "2 hours" in q or "two hours" in q or "short" in q:
        short_tasks = [t for t in active if (t.estimated_minutes or 30) <= 60]
        selected = short_tasks[:2] if short_tasks else active[:1]
        titles = "\n".join(f"• **{t.title}** (~{t.estimated_minutes} min, {t.priority.upper()})" for t in selected)
        return AssistantResponse(
            reply=f"### 2-Hour Focus Plan\n\nFor your 2-hour window (120 minutes), complete these specific tasks from your workspace:\n\n{titles}",
            highlighted_task_ids=[t.id for t in selected],
            suggested_actions=["Start Working", "Plan My Day"]
        )

    if "message" in q or "team" in q or "slack" in q or "update" in q:
        bullet_points = "\n".join(f"• {t.assignee}: {t.title} (Deadline: {t.deadline or 'TBD'})" for t in active[:5])
        return AssistantResponse(
            reply=(
                "### Team Status Update Draft\n\n"
                "```markdown\n"
                "Hey team, here is a quick status update on our current deliverables:\n"
                f"{bullet_points}\n\n"
                "Please let me know if anyone has blockers or needs help!\n"
                "```"
            ),
            highlighted_task_ids=[t.id for t in active[:5]],
            suggested_actions=["Copy Update", "View Tasks"]
        )

    # General answer dynamically referencing actual tasks
    active_summary = f"You have **{len(active)} active tasks** ({len(high)} high-priority) in your workspace."
    top_tasks = "\n".join(f"• **{t.title}** ({t.priority.upper()}, {t.assignee})" for t in active[:3])
    return AssistantResponse(
        reply=f"{active_summary}\n\nCurrent items:\n{top_tasks}\n\nHow can I help you organize or execute these tasks?",
        highlighted_task_ids=[t.id for t in active[:3]],
        suggested_actions=["What should I do first?", "Plan My Day", "What tasks are overdue?"]
    )
