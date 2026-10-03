import io
import os
import sys
import json
import docx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.task import Task
from backend.app.models.plan import DailyPlan

def run_full_mvp_verification():
    client = TestClient(app)
    db = SessionLocal()

    print("==========================================================")
    print("   WORKFLOW AI - FULL MVP END-TO-END VERIFICATION")
    print("==========================================================")

    # Clean workspace before starting test
    db.query(Task).delete()
    db.query(DailyPlan).delete()
    db.commit()

    # -------------------------------------------------------------------------
    # 1. EMPTY STATE & INITIAL DASHBOARD STATISTICS
    # -------------------------------------------------------------------------
    print("\n--- 1. Testing Empty State & Initial Dashboard Stats ---")
    r = client.get("/api/dashboard")
    assert r.status_code == 200
    dash_empty = r.json()
    assert dash_empty["total_tasks"] == 0
    assert dash_empty["completed_tasks"] == 0
    assert dash_empty["completion_rate"] == 0.0
    print("✓ Initial dashboard correctly reflects 0 tasks and empty state.")

    # -------------------------------------------------------------------------
    # 2. DYNAMIC TEXT INPUT -> AI TASK EXTRACTION
    # -------------------------------------------------------------------------
    print("\n--- 2. Testing Dynamic Text Input -> AI Task Extraction ---")
    astrophysics_notes = """Observatory Schedule:
Dr. Elena Rostova will align the high-resolution optical spectrometer by 07:00 AM.
Systems Engineer Marcus must calibrate cryo-cooling pumps before 11:30 AM due to overheating risks.
Postdoc Kenji to verify CCD dark-frame exposures by 02:00 PM.
Director Vance will review the exoplanet transit telemetry report on Friday 05:00 PM."""

    r = client.post("/api/analyze", json={"text": astrophysics_notes})
    assert r.status_code == 200, f"Extraction failed: {r.text}"
    extracted = r.json()
    assert len(extracted["tasks"]) >= 3, f"Expected at least 3 tasks, got {len(extracted['tasks'])}"
    print(f"✓ Extracted {len(extracted['tasks'])} structured tasks dynamically from raw text.")
    print("  Detected People:", extracted.get("people_detected"))
    for t in extracted["tasks"]:
        print(f"   - [{t['priority'].upper()}] {t['title']} | Assignee: {t['assignee']} | Due: {t['deadline']}")
        assert t["title"] and len(t["title"]) > 3
        assert t["priority"] in ["high", "medium", "low"]

    # -------------------------------------------------------------------------
    # 3. TASK REVIEW & APPROVAL (BATCH COMMIT)
    # -------------------------------------------------------------------------
    print("\n--- 3. Testing Task Review & Approval (Batch Creation) ---")
    # Simulate user approving all extracted tasks from the review screen
    tasks_to_approve = []
    for t in extracted["tasks"]:
        tasks_to_approve.append({
            "title": t["title"],
            "description": t.get("description", ""),
            "priority": t.get("priority", "medium"),
            "status": "todo",
            "deadline": t.get("deadline", "Upcoming"),
            "estimated_minutes": t.get("estimated_minutes", 45),
            "category": t.get("category", "Astrophysics"),
            "assignee": t.get("assignee", "Elena"),
            "dependencies": t.get("dependencies", []),
            "subtasks": t.get("subtasks", [])
        })

    r = client.post("/api/tasks/batch", json={"tasks": tasks_to_approve})
    assert r.status_code == 201
    created_tasks = r.json()
    assert len(created_tasks) == len(tasks_to_approve)
    target_task_id = created_tasks[0]["id"]
    print(f"✓ Approved and persisted {len(created_tasks)} tasks to SQLite database.")

    # -------------------------------------------------------------------------
    # 4. PDF DOCUMENT -> AI TASK EXTRACTION
    # -------------------------------------------------------------------------
    print("\n--- 4. Testing PDF Document Upload & Extraction ---")
    pdf_bytes = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 124 >> stream
BT
/F1 12 Tf
72 712 Td
(Robotics Laboratory Maintenance Log:) Tj
0 -20 Td
(Ingrid will inspect the hydraulic actuators by 08:30 AM.) Tj
0 -20 Td
(Tariq to flash firmware updates before 01:00 PM.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000318 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
494
%%EOF"""

    r = client.post(
        "/api/upload",
        files={"file": ("robotics_brief.pdf", pdf_bytes, "application/pdf")},
        data={"auto_analyze": "true"}
    )
    assert r.status_code == 200, f"PDF upload failed: {r.text}"
    pdf_res = r.json()
    assert "analysis" in pdf_res
    pdf_tasks = pdf_res["analysis"]["tasks"]
    assert len(pdf_tasks) >= 1
    print(f"✓ PDF extracted successfully. Found {len(pdf_tasks)} tasks:")
    for pt in pdf_tasks:
        print(f"   - {pt['title']} (Assignee: {pt['assignee']})")

    # -------------------------------------------------------------------------
    # 5. DOCX DOCUMENT -> AI TASK EXTRACTION
    # -------------------------------------------------------------------------
    print("\n--- 5. Testing DOCX Document Upload & Extraction ---")
    doc = docx.Document()
    doc.add_heading("Marine Research Expedition Brief", 0)
    doc.add_paragraph("Dr. Sylvia will deploy the autonomous underwater vehicle by 06:00 AM.")
    doc.add_paragraph("Oceanographer David must recover water salinity sensor pods by 12:00 PM.")
    docx_buf = io.BytesIO()
    doc.save(docx_buf)
    docx_bytes = docx_buf.getvalue()

    r = client.post(
        "/api/upload",
        files={"file": ("marine_brief.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        data={"auto_analyze": "true"}
    )
    assert r.status_code == 200, f"DOCX upload failed: {r.text}"
    docx_res = r.json()
    assert "analysis" in docx_res
    docx_tasks = docx_res["analysis"]["tasks"]
    assert len(docx_tasks) >= 1
    print(f"✓ DOCX extracted successfully. Found {len(docx_tasks)} tasks:")
    for dt in docx_tasks:
        print(f"   - {dt['title']} (Assignee: {dt['assignee']})")

    # -------------------------------------------------------------------------
    # 6. TASK CRUD OPERATIONS
    # -------------------------------------------------------------------------
    print("\n--- 6. Testing Task CRUD Operations ---")
    # Read
    r = client.get(f"/api/tasks/{target_task_id}")
    assert r.status_code == 200
    task_data = r.json()
    assert task_data["id"] == target_task_id
    print(f"✓ Retrieved task: '{task_data['title']}'")

    # Create Single
    r = client.post("/api/tasks", json={
        "title": "Manual Quality Audit Checklist",
        "description": "Verify lab compliance certification",
        "priority": "high",
        "status": "todo",
        "deadline": "Today 04:00 PM",
        "estimated_minutes": 60,
        "category": "Compliance",
        "assignee": "Auditor Chen",
        "subtasks": [{"id": "st1", "title": "Check safety valves", "completed": False}]
    })
    assert r.status_code == 201
    manual_task = r.json()
    print(f"✓ Created manual task: '{manual_task['title']}'")

    # Update Single
    r = client.put(f"/api/tasks/{manual_task['id']}", json={
        "status": "in_progress",
        "priority": "medium",
        "estimated_minutes": 75
    })
    assert r.status_code == 200
    updated_manual = r.json()
    assert updated_manual["status"] == "in_progress"
    assert updated_manual["estimated_minutes"] == 75
    print(f"✓ Updated task status to in_progress with 75m duration.")

    # Toggle Subtask
    r = client.post(f"/api/tasks/{manual_task['id']}/subtasks/st1/toggle")
    assert r.status_code == 200
    toggled = r.json()
    assert toggled["subtasks"][0]["completed"] is True
    print(f"✓ Subtask toggled to completed: {toggled['subtasks'][0]['title']}")

    # -------------------------------------------------------------------------
    # 7. AI TASK BREAKDOWN
    # -------------------------------------------------------------------------
    print("\n--- 7. Testing AI Task Breakdown with Gemini ---")
    r = client.post(f"/api/tasks/{target_task_id}/breakdown")
    assert r.status_code == 200
    breakdown_res = r.json()
    assert "suggested_subtasks" in breakdown_res
    subtasks = breakdown_res["suggested_subtasks"]
    assert len(subtasks) >= 2
    print(f"✓ Generated {len(subtasks)} granular AI subtasks for '{task_data['title']}':")
    for s in subtasks:
        print(f"   - [ ] {s['title']}")

    # -------------------------------------------------------------------------
    # 8. AI DAILY PLANNER & TIMELINE
    # -------------------------------------------------------------------------
    print("\n--- 8. Testing AI Daily Planner ---")
    r = client.post("/api/plan", json={"working_hours": 6.0, "start_time": "08:00 AM"})
    assert r.status_code == 200
    plan = r.json()
    assert len(plan["schedule"]) >= 3
    assert plan["total_planned_minutes"] > 0
    print(f"✓ AI Daily Plan generated:")
    print(f"  Summary: {plan['summary']}")
    print(f"  Total planned minutes: {plan['total_planned_minutes']} / {int(6.0 * 60)}")
    print(f"  Recommendations count: {len(plan['recommendations'])}")
    for slot in plan["schedule"][:4]:
        print(f"   [{slot['start_time']} - {slot['end_time']}] {slot['title']} ({slot['slot_type']})")

    # Verify latest plan fetch
    r = client.get("/api/plan/latest")
    assert r.status_code == 200
    latest_plan = r.json()
    assert len(latest_plan["schedule"]) == len(plan["schedule"])
    print("✓ Latest plan persisted and fetched cleanly from database.")

    # -------------------------------------------------------------------------
    # 9. AI ASSISTANT USING ACTUAL STORED TASKS
    # -------------------------------------------------------------------------
    print("\n--- 9. Testing AI Assistant with Actual Stored Tasks ---")
    
    # Query A: "What should I do first?"
    r = client.post("/api/assistant", json={
        "query": "What should I do first?",
        "history": []
    })
    assert r.status_code == 200
    reply1 = r.json()
    print("✓ Query 'What should I do first?':")
    print("  Reply preview:", reply1["reply"][:140].replace('\n', ' '))

    # Query B: "Create a message for my team about tomorrow's deadline"
    r = client.post("/api/assistant", json={
        "query": "Create a message for my team about tomorrow's deadline",
        "history": []
    })
    assert r.status_code == 200
    reply2 = r.json()
    print("✓ Query 'Create message for team':")
    print("  Reply preview:", reply2["reply"][:140].replace('\n', ' '))

    # -------------------------------------------------------------------------
    # 10. DASHBOARD STATISTICS & PROGRESS TRACKING
    # -------------------------------------------------------------------------
    print("\n--- 10. Testing Dashboard Statistics & Progress Tracking ---")
    # Mark target task as completed
    client.put(f"/api/tasks/{target_task_id}", json={"status": "completed"})

    r = client.get("/api/dashboard")
    assert r.status_code == 200
    stats = r.json()
    print(f"✓ Total Tasks: {stats['total_tasks']}")
    print(f"✓ In Progress: {stats['in_progress_tasks']}")
    print(f"✓ Completed: {stats['completed_tasks']}")
    print(f"✓ Completion Rate: {stats['completion_rate']}%")
    print(f"✓ High Priority: {stats['high_priority_tasks']}")
    print(f"✓ AI Suggestions count: {len(stats['ai_suggestions'])}")
    for sug in stats["ai_suggestions"]:
        print(f"   [{sug['severity'].upper()}] {sug['title']}: {sug['message']}")

    assert stats["completed_tasks"] >= 1
    assert stats["completion_rate"] > 0

    # -------------------------------------------------------------------------
    # 11. DELETE OPERATION & VERIFICATION
    # -------------------------------------------------------------------------
    print("\n--- 11. Testing Delete Operation ---")
    r = client.delete(f"/api/tasks/{manual_task['id']}")
    assert r.status_code == 200
    r_check = client.get(f"/api/tasks/{manual_task['id']}")
    assert r_check.status_code == 404
    print(f"✓ Deleted task {manual_task['id']} verified gone.")

    # -------------------------------------------------------------------------
    # 12. ERROR & EDGE CASES
    # -------------------------------------------------------------------------
    print("\n--- 12. Testing Error Handling & Edge Cases ---")
    # Empty text
    r = client.post("/api/analyze", json={"text": "   "})
    assert r.status_code == 400
    print("✓ Empty text analysis returns 400 with helpful error message.")

    # Invalid file extension
    r = client.post(
        "/api/upload",
        files={"file": ("malformed.exe", b"binary content", "application/octet-stream")},
        data={"auto_analyze": "true"}
    )
    assert r.status_code == 400
    print("✓ Unsupported file returns 400 validation error.")

    # Non-existent task breakdown
    r = client.post("/api/tasks/non-existent-uuid/breakdown")
    assert r.status_code == 404
    print("✓ Non-existent task breakdown returns 404.")

    print("\n==========================================================")
    print("   ALL 12 MVP VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀")
    print("==========================================================")

if __name__ == "__main__":
    run_full_mvp_verification()
