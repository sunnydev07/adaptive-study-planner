"""
Adaptive AI Study Planner - FastAPI Server
Exposes REST API endpoints for state management, AI micro-task decomposition,
adaptive schedule rebalancing, task completion tracking, and state reset.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from backend.engine import (
    StudyPlannerEngine,
    PlannerState,
    DecomposeRequest,
    RebalanceRequest,
    CompleteTaskRequest
)

app = FastAPI(
    title="Adaptive AI Study Planner API",
    description="Neuro-Symbolic DAG-based adaptive study planning and optimization engine",
    version="1.0.0"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton in-memory engine initialized with CS student pre-seeded schedule
engine = StudyPlannerEngine()


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Adaptive AI Study Planner Engine",
        "version": "1.0.0"
    }


@app.get("/api/state", response_model=PlannerState)
def get_planner_state():
    """Returns the complete current PlannerState contract."""
    return engine.get_state()


@app.post("/api/decompose", response_model=PlannerState)
def decompose_goal(request: DecomposeRequest):
    """
    Decomposes an unstructured study goal into 4 measurable micro-tasks
    with chained dependencies and rebalances the schedule.
    """
    if not request.goal.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Goal string cannot be empty"
        )
    return engine.decompose_goal(
        goal=request.goal,
        subject_id=request.subject_id,
        deadline=request.deadline,
        difficulty=request.difficulty
    )


@app.post("/api/rebalance", response_model=PlannerState)
def rebalance_schedule(request: RebalanceRequest):
    """
    Triggers adaptive schedule self-healing for:
    - task_missed
    - task_delayed
    - struggling_subject
    - urgent_assignment
    """
    valid_triggers = {"task_missed", "task_delayed", "struggling_subject", "urgent_assignment", "initial"}
    if request.trigger not in valid_triggers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid trigger '{request.trigger}'. Must be one of: {valid_triggers}"
        )
    return engine.rebalance_schedule(
        trigger=request.trigger,
        task_id=request.task_id,
        subject_id=request.subject_id
    )


@app.post("/api/tasks/{task_id}/complete", response_model=PlannerState)
def complete_task(task_id: str, request: CompleteTaskRequest):
    """
    Marks the target task as completed, logs actual study duration,
    and updates schedule block statuses and analytics.
    """
    task = next((t for t in engine.tasks if t.id == task_id), None)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID '{task_id}' not found"
        )
    return engine.complete_task(task_id=task_id, actual_mins=request.actual_mins)


@app.post("/api/reset", response_model=PlannerState)
def reset_schedule():
    """Resets the planner state to the pre-seeded CS student schedule."""
    return engine.reset_to_preseed()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
