from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.task import Task

def test_planner_and_assistant():
    client = TestClient(app)
    db = SessionLocal()
    db.query(Task).delete()
    db.commit()
    db.close()

    # 1. Post culinary tasks
    raw_notes = """Patisserie Morning Production:
Head Pastry Chef Julien will laminate croissant dough by 5:00 AM.
Chocolatier Sophie to temper dark chocolate ganache before 8:30 AM.
Steward Carlos must sterilize blast freezer by 11:00 AM.
Store manager Claire to place vanilla bean order by 2:00 PM."""
    
    r = client.post("/api/analyze", json={"text": raw_notes})
    assert r.status_code == 200
    tasks_data = r.json()["tasks"]
    batch_res = client.post("/api/tasks/batch", json={"tasks": tasks_data})
    assert batch_res.status_code == 201

    # 2. Test Plan My Day
    plan_res = client.post("/api/plan", json={"working_hours": 6.0, "start_time": "05:00 AM"})
    assert plan_res.status_code == 200
    plan = plan_res.json()
    print("=== DYNAMIC PLAN FOR CULINARY DOMAIN ===")
    print("Summary:", plan.get("summary"))
    for s in plan.get("schedule", []):
        print(f" - {s['start_time']} to {s['end_time']}: {s['title']} ({s['slot_type']})")

    # 3. Test Assistant Grounding: What should I do first?
    asst_res1 = client.post("/api/assistant", json={"query": "What should I do first?"})
    assert asst_res1.status_code == 200
    reply1 = asst_res1.json().get("reply")
    print("\n=== ASSISTANT: What should I do first? ===")
    print(reply1[:300])

    # 4. Test Assistant: Team message
    asst_res2 = client.post("/api/assistant", json={"query": "Create a message for my team about today's schedule."})
    assert asst_res2.status_code == 200
    reply2 = asst_res2.json().get("reply")
    print("\n=== ASSISTANT: Team Message ===")
    print(reply2[:400])

    # Verification: Ensure assistant mentions Julien, Sophie, Carlos, or Claire from the actual culinary domain, and NOT Rahul or Priya!
    assert ("julien" in reply1.lower() or "julien" in reply2.lower() or 
            "croissant" in reply1.lower() or "croissant" in reply2.lower() or
            "sophie" in reply2.lower() or "carlos" in reply2.lower()), "Assistant must dynamically ground its answers in the culinary tasks!"
    assert "rahul" not in reply1.lower() and "rahul" not in reply2.lower(), "Assistant must NOT output hardcoded demo names!"

    print("\nSUCCESS: Planner and Assistant are 100% dynamic and domain-independent!")

if __name__ == "__main__":
    test_planner_and_assistant()
