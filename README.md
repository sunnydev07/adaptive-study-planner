# Adaptive AI Study Planner

Energy-aware, dependency-chained, self-healing study schedule. Built in a 90-minute hackathon across two tracks:

- **Track A — Backend** (`backend/`): FastAPI + neuro-symbolic scheduling engine (DAG dependencies, multi-criteria priority scoring, anti-burnout guardrails, adaptive rebalancing).
- **Track B — Frontend** (`frontend/`): React + TypeScript + Vite + Tailwind + `lucide-react` interactive demo with offline fallback.

See [`SPEC.md`](./SPEC.md) for the full architecture & engine specification.

## Quickstart

### Backend (Track A)

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --port 8000 --reload
# API at http://localhost:8000
```

### Frontend (Track B)

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173 (expects backend at http://localhost:8000)
```

The frontend works **fully offline**: if the backend is unreachable, every action
(Missed Task, Delayed Task, Struggling Subject, Urgent Assignment, Goal Decomposer,
Complete Task) runs against a built-in local simulator (`frontend/src/fallbackData.ts`).

## API contract (`http://localhost:8000`)

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| `GET` | `/api/state` | — | `PlannerState` |
| `POST` | `/api/decompose` | `{ goal, subject_id, deadline, difficulty }` | `PlannerState` |
| `POST` | `/api/rebalance` | `{ trigger, task_id?, subject_id? }` | `PlannerState` |
| `POST` | `/api/tasks/{task_id}/complete` | `{ actual_mins }` | `PlannerState` |
| `POST` | `/api/reset` | — | `PlannerState` |

`trigger`: `task_missed` \| `task_delayed` \| `struggling_subject` \| `urgent_assignment`
