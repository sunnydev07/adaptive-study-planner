"""
Adaptive AI Study Planner - Backend Pytest Suite
Verifies all 7 hackathon requirements deterministically:
1. Exact Schema Contract & CS Student Pre-seeded Data
2. DAG Topological Ordering & Cycle-free Dependency Solver
3. Concentration Zone Matching & Anti-Burnout Guardrails (Caps & Breaks)
4. Explainability Traces & 100% Attribution Math
5. AI Micro-Task Decomposition (4 Sequential Tasks & Chained Dependencies)
6. Adaptive Rebalancing (task_missed, task_delayed, struggling_subject, urgent_assignment)
7. Task Completion & Reset Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_state():
    """Ensure every test starts with clean pre-seeded CS student state."""
    client.post("/api/reset")
    yield
    client.post("/api/reset")


# ============================================================================
# 1. EXACT SCHEMA CONTRACT & PRE-SEEDED DATA
# ============================================================================

def test_initial_state_schema_and_preseed():
    """Validates root endpoint and exact PlannerState JSON contract."""
    res = client.get("/api/state")
    assert res.status_code == 200
    data = res.json()

    # Top-level keys
    required_keys = {"subjects", "tasks", "schedule", "last_rebalance", "analytics"}
    assert required_keys.issubset(data.keys())

    # Subjects verification (4 CS subjects)
    subjects = data["subjects"]
    assert len(subjects) == 4
    subj_ids = {s["id"] for s in subjects}
    assert subj_ids == {"sub_os", "sub_dbms", "sub_ml", "sub_cd"}

    os_subj = next(s for s in subjects if s["id"] == "sub_os")
    assert os_subj["name"] == "Operating Systems"
    assert os_subj["color"] == "#f59e0b"
    assert os_subj["exam_date"] == "2026-10-15"
    assert os_subj["priority"] == 5
    assert os_subj["is_struggling"] is False

    # Tasks verification (10 pre-seeded tasks)
    tasks = data["tasks"]
    assert len(tasks) == 10
    t1 = next(t for t in tasks if t["id"] == "t1")
    assert t1["title"] == "Process Synchronization & Semaphores"
    assert t1["subject_id"] == "sub_os"
    assert t1["duration_mins"] == 45
    assert t1["difficulty"] == 4
    assert t1["deadline"] == "2026-10-15"
    assert t1["dependencies"] == []
    assert t1["status"] == "pending"

    # Schedule verification
    schedule = data["schedule"]
    assert len(schedule) >= 10
    b1 = schedule[0]
    assert b1["block_id"] == "b1"
    assert b1["task_id"] == "t1"
    assert b1["date"] == "2026-10-14"
    assert b1["start_time"] == "09:00"
    assert b1["end_time"] == "09:45"
    assert b1["duration_mins"] == 45
    assert b1["concentration_zone"] == "high"
    assert b1["is_break"] is False
    assert "Deadlock Avoidance (Banker's Algorithm)" in b1["unlocks_tasks"]

    # Explainability on b1
    assert b1["explainability"] is not None
    exp = b1["explainability"]
    assert exp["total_score"] == 94.2
    assert exp["urgency_pct"] == 40
    assert exp["dependency_pct"] == 25
    assert exp["energy_match_pct"] == 20
    assert exp["priority_pct"] == 15
    assert "OS Exam is tomorrow" in exp["reason"]

    # Analytics verification
    analytics = data["analytics"]
    assert analytics["adherence_pct"] == 100.0
    assert analytics["total_planned_mins"] == 450
    assert analytics["total_completed_mins"] == 90
    assert analytics["breaks_inserted"] == 6

    # Daily load verification for Oct 14
    oct14_load = next(d for d in analytics["daily_load"] if d["date"] == "2026-10-14")
    assert oct14_load["used_mins"] == 150
    assert oct14_load["max_mins"] == 180
    assert oct14_load["cognitive_score"] == 78
    assert oct14_load["max_cognitive"] == 100

    # By subject analytics
    os_analytics = next(s for s in analytics["by_subject"] if s["subject_id"] == "sub_os")
    assert os_analytics["planned_mins"] == 135
    assert os_analytics["completed_mins"] == 45


# ============================================================================
# 2. DAG TOPOLOGICAL SOLVER & DEPENDENCY INVARIANTS
# ============================================================================

def test_dag_dependency_topological_order():
    """Ensures no task is scheduled prior to its prerequisite tasks."""
    res = client.get("/api/state")
    data = res.json()
    schedule = data["schedule"]

    # Map each scheduled task to its (date, start_time)
    task_order = {}
    for idx, block in enumerate(schedule):
        if block["task_id"] and not block["is_break"]:
            task_order[block["task_id"]] = (block["date"], block["start_time"], idx)

    # Validate all dependency invariants
    tasks = data["tasks"]
    for t in tasks:
        if t["id"] in task_order:
            t_date, t_time, t_idx = task_order[t["id"]]
            for dep_id in t["dependencies"]:
                if dep_id in task_order:
                    dep_date, dep_time, dep_idx = task_order[dep_id]
                    # Prerequisite must be on earlier day OR same day at earlier slot
                    assert (dep_date < t_date) or (dep_date == t_date and dep_time < t_time)
                    assert dep_idx < t_idx

    # Explicit check for pre-seeded chain: t1 unlocks t2
    assert "t1" in task_order and "t2" in task_order
    assert task_order["t1"][2] < task_order["t2"][2]


# ============================================================================
# 3. ANTI-BURNOUT GUARDRAILS (180M CAP, 750 LOAD, BREAKS, FATIGUE SPACING)
# ============================================================================

def test_anti_burnout_guardrails():
    """Validates daily caps, fatigue spacing, and recovery breaks."""
    res = client.get("/api/state")
    data = res.json()
    schedule = data["schedule"]
    analytics = data["analytics"]

    # 1. Daily study minutes cap <= 180 on every single day
    for daily in analytics["daily_load"]:
        assert daily["used_mins"] <= 180, f"Exceeded 180m on {daily['date']}"
        assert daily["cognitive_score"] <= 100, f"Exceeded cognitive cap on {daily['date']}"

    # 2. Daily cognitive load <= 750 directly calculated from schedule blocks
    daily_loads = {}
    for b in schedule:
        if not b["is_break"]:
            daily_loads.setdefault(b["date"], 0)
            daily_loads[b["date"]] += (b["duration_mins"] * b["difficulty"])
    for d, raw_load in daily_loads.items():
        assert raw_load <= 750, f"Raw cognitive load {raw_load} exceeded 750 cap on {d}"

    # 3. Fatigue spacing: Never place two difficulty-5 tasks back-to-back
    last_diff = 0
    last_date = ""
    for b in schedule:
        if not b["is_break"]:
            if b["date"] == last_date and last_diff == 5:
                assert b["difficulty"] != 5, f"Two difficulty-5 tasks placed back-to-back on {b['date']}"
            last_diff = b["difficulty"]
            last_date = b["date"]

    # 4. Recovery break blocks inserted (is_break: True, duration 15m)
    break_blocks = [b for b in schedule if b["is_break"]]
    assert len(break_blocks) >= 4
    for bb in break_blocks:
        assert bb["duration_mins"] == 15
        assert bb["concentration_zone"] == "break"
        assert bb["is_break"] is True
        assert bb["explainability"] is None


# ============================================================================
# 4. EXPLAINABILITY TRACES & ATTRIBUTION INTEGRITY
# ============================================================================

def test_explainability_traces():
    """Validates explainability generation, percentages summing to 100, and text reasons."""
    res = client.get("/api/state")
    data = res.json()
    schedule = data["schedule"]

    non_break_blocks = [b for b in schedule if not b["is_break"]]
    assert len(non_break_blocks) > 0

    for b in non_break_blocks:
        exp = b["explainability"]
        assert exp is not None
        assert 0.0 <= exp["total_score"] <= 100.0
        # Percentages sum to 100
        assert (exp["urgency_pct"] + exp["dependency_pct"] + exp["energy_match_pct"] + exp["priority_pct"]) == 100
        # Reason contains human-readable explanation
        assert len(exp["reason"]) > 10
        assert any(word in exp["reason"].lower() for word in ["exam", "focus", "prerequisite", "scheduled", "prioritized"])


# ============================================================================
# 5. GOAL DECOMPOSITION
# ============================================================================

def test_goal_decomposition():
    """Validates breaking down a goal into 4 sequential chained micro-tasks."""
    payload = {
        "goal": "Master Dynamic Programming",
        "subject_id": "sub_os",
        "deadline": "2026-10-18",
        "difficulty": 4
    }
    res = client.post("/api/decompose", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Verify 4 micro-tasks were created
    new_tasks = [t for t in data["tasks"] if "Dynamic Programming" in t["title"]]
    assert len(new_tasks) == 4

    # Verify sequential chained dependencies (t1 -> t2 -> t3 -> t4)
    assert new_tasks[0]["dependencies"] == []
    assert new_tasks[1]["dependencies"] == [new_tasks[0]["id"]]
    assert new_tasks[2]["dependencies"] == [new_tasks[1]["id"]]
    assert new_tasks[3]["dependencies"] == [new_tasks[2]["id"]]

    # Verify durations in [25, 60] mins
    for t in new_tasks:
        assert 25 <= t["duration_mins"] <= 60
        assert 1 <= t["difficulty"] <= 5

    # Verify schedule rebalanced with new tasks
    scheduled_new_ids = {b["task_id"] for b in data["schedule"] if b["task_id"]}
    for t in new_tasks:
        assert t["id"] in scheduled_new_ids

    assert data["last_rebalance"]["trigger"] == "goal_decomposed"


# ============================================================================
# 6. ADAPTIVE REBALANCING (4 DISRUPTIONS)
# ============================================================================

def test_rebalance_task_missed():
    """Trigger task_missed: marks missed, boosts priority weight, cascades dependents."""
    res = client.post("/api/rebalance", json={"trigger": "task_missed", "task_id": "t1"})
    assert res.status_code == 200
    data = res.json()

    # t1 marked missed
    t1 = next(t for t in data["tasks"] if t["id"] == "t1")
    assert t1["status"] == "missed"

    # Last rebalance record
    assert data["last_rebalance"]["trigger"] == "task_missed"
    assert "missed" in data["last_rebalance"]["summary"].lower()

    # Adherence drops because 1 task is missed
    assert data["analytics"]["adherence_pct"] < 100.0


def test_rebalance_task_delayed():
    """Trigger task_delayed: extends duration +20m and cascades downstream blocks."""
    initial_t1_dur = next(t["duration_mins"] for t in client.get("/api/state").json()["tasks"] if t["id"] == "t1")

    res = client.post("/api/rebalance", json={"trigger": "task_delayed", "task_id": "t1"})
    assert res.status_code == 200
    data = res.json()

    t1 = next(t for t in data["tasks"] if t["id"] == "t1")
    assert t1["status"] == "delayed"
    assert t1["duration_mins"] == initial_t1_dur + 20
    assert data["last_rebalance"]["trigger"] == "task_delayed"


def test_rebalance_struggling_subject():
    """Trigger struggling_subject: marks struggling, injects 35m refresher, boosts priority."""
    res = client.post("/api/rebalance", json={"trigger": "struggling_subject", "subject_id": "sub_os"})
    assert res.status_code == 200
    data = res.json()

    os_subj = next(s for s in data["subjects"] if s["id"] == "sub_os")
    assert os_subj["is_struggling"] is True

    # Injected 35m Foundational Concept Refresher task
    refresher = next((t for t in data["tasks"] if "Foundational Concept Refresher" in t["title"]), None)
    assert refresher is not None
    assert refresher["duration_mins"] == 35
    assert refresher["subject_id"] == "sub_os"
    assert data["last_rebalance"]["trigger"] == "struggling_subject"


def test_rebalance_urgent_assignment():
    """Trigger urgent_assignment: injects 45m difficulty 5 lab submission due tomorrow."""
    res = client.post("/api/rebalance", json={"trigger": "urgent_assignment", "subject_id": "sub_os"})
    assert res.status_code == 200
    data = res.json()

    urgent_task = next((t for t in data["tasks"] if "Urgent Lab Submission" in t["title"]), None)
    assert urgent_task is not None
    assert urgent_task["duration_mins"] == 45
    assert urgent_task["difficulty"] == 5
    assert urgent_task["deadline"] == "2026-10-15"
    assert data["last_rebalance"]["trigger"] == "urgent_assignment"


# ============================================================================
# 7. TASK COMPLETION & RESET ENDPOINTS
# ============================================================================

def test_task_complete_and_reset():
    """Validates completing a task, updating minutes and status, and reset to baseline."""
    # Complete t1 with 45 actual mins
    res = client.post("/api/tasks/t1/complete", json={"actual_mins": 45})
    assert res.status_code == 200
    data = res.json()

    t1 = next(t for t in data["tasks"] if t["id"] == "t1")
    assert t1["status"] == "completed"
    assert t1["completed_mins"] == 45

    # Schedule block updated
    t1_block = next(b for b in data["schedule"] if b["task_id"] == "t1")
    assert t1_block["status"] == "completed"

    # Analytics total completed minutes increased from 90 to 135
    assert data["analytics"]["total_completed_mins"] == 135

    # Reset endpoint restores clean state
    res_reset = client.post("/api/reset")
    assert res_reset.status_code == 200
    clean_data = res_reset.json()

    t1_clean = next(t for t in clean_data["tasks"] if t["id"] == "t1")
    assert t1_clean["status"] == "pending"
    assert t1_clean["completed_mins"] == 0
    assert clean_data["analytics"]["total_completed_mins"] == 90
