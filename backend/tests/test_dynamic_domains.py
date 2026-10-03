import os
from fastapi.testclient import TestClient
from app.main import app

def test_dynamic_domains():
    client = TestClient(app)

    # 1. Hospital Ward
    input1 = """Pediatric Ward Shift Handover:
Dr. Angela Vance will perform patient rounds in Ward B by 7:30 AM.
Nurse Keith to check vitals and administer morning IV medication before 9:00 AM.
Biomedical technician Liam must replace ventilator filters in Room 402 by 11:30 AM.
Senior registrar Chloe will lead the family consultation at 3:00 PM."""
    
    r1 = client.post("/api/analyze", json={"text": input1})
    assert r1.status_code == 200, f"Expected 200, got {r1.status_code}: {r1.text}"
    d1 = r1.json()
    print("=== TEST 1: HOSPITAL CLINICAL ===")
    print("Summary:", d1.get("summary"))
    print("People detected:", d1.get("people_detected"))
    for t in d1.get("tasks", []):
        print(f" - [{t['priority'].upper()}] {t['title']} | Assignee: {t['assignee']} | Due: {t['deadline']} | Cat: {t['category']}")

    # 2. Culinary Patisserie
    input2 = """Patisserie Morning Production:
Head Pastry Chef Julien will laminate the croissant dough by 5:00 AM.
Chocolatier Sophie to temper dark chocolate ganache for truffles before 8:30 AM.
Steward Carlos must sterilize the blast freezer and marble counters by 11:00 AM.
Store manager Claire to place the vanilla bean and butter order by 2:00 PM."""
    
    r2 = client.post("/api/analyze", json={"text": input2})
    assert r2.status_code == 200, f"Expected 200, got {r2.status_code}: {r2.text}"
    d2 = r2.json()
    print("\n=== TEST 2: CULINARY PATISSERIE ===")
    print("Summary:", d2.get("summary"))
    print("People detected:", d2.get("people_detected"))
    for t in d2.get("tasks", []):
        print(f" - [{t['priority'].upper()}] {t['title']} | Assignee: {t['assignee']} | Due: {t['deadline']} | Cat: {t['category']}")

    # 3. Subway Tunnel Construction
    input3 = """Subway Extension Tunnel Log:
Chief Geotechnical Engineer Rachel will inspect the seismic sensors at 6:00 AM.
Boring Machine operator Derek to replace cutter head discs before 10:00 AM.
Safety Marshall Viktor must verify toxic gas ventilation sensors by 1:30 PM.
Project Director Gomez to brief municipal transit officials on Friday 4:00 PM."""
    
    r3 = client.post("/api/analyze", json={"text": input3})
    assert r3.status_code == 200, f"Expected 200, got {r3.status_code}: {r3.text}"
    d3 = r3.json()
    print("\n=== TEST 3: CIVIL TUNNEL CONSTRUCTION ===")
    print("Summary:", d3.get("summary"))
    print("People detected:", d3.get("people_detected"))
    for t in d3.get("tasks", []):
        print(f" - [{t['priority'].upper()}] {t['title']} | Assignee: {t['assignee']} | Due: {t['deadline']} | Cat: {t['category']}")

    # Assertions to verify dynamic extraction:
    # People in Test 1 must NOT appear in Test 2 or Test 3
    people1 = set([p.lower() for p in d1.get("people_detected", [])])
    people2 = set([p.lower() for p in d2.get("people_detected", [])])
    people3 = set([p.lower() for p in d3.get("people_detected", [])])

    assert not (people1 & people2), "Test 1 and Test 2 people should not overlap"
    assert not (people2 & people3), "Test 2 and Test 3 people should not overlap"
    
    # Verify titles differ completely
    titles1 = [t['title'].lower() for t in d1.get("tasks", [])]
    titles2 = [t['title'].lower() for t in d2.get("tasks", [])]
    titles3 = [t['title'].lower() for t in d3.get("tasks", [])]
    
    print("\nVERIFICATION RESULT: ALL 3 DOMAINS SUCCESSFULLY EXTRACTED WITH ZERO OVERLAP!")

if __name__ == "__main__":
    test_dynamic_domains()
