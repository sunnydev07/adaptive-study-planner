# Adaptive AI Study Planner: Architecture & Engine Specification

## 1. System Overview & Neuro-Symbolic Architecture

The **Adaptive AI Study Planner** employs a hybrid **Neuro-Symbolic architecture** designed to solve the chronic failure modes of generic AI study tools: hallucinated schedules, impossible workloads, and brittle rebalancing.

```
+-----------------------------------------------------------------------------------+
|                                 NEURAL LAYER                                      |
|                                                                                   |
|   +------------------------------------+   +----------------------------------+   |
|   | LLM Micro-Task Decomposer (Online) |   | Smart Domain-Aware Generator     |   |
|   | (Gemini / OpenAI API, 4s timeout)  |   | (Deterministic Fallback Offline) |   |
|   +-----------------+------------------+   +-----------------+----------------+   |
+---------------------|----------------------------------------|--------------------+
                      | [Decomposed 4-Stage Micro-Tasks]       |
                      v                                        v
+-----------------------------------------------------------------------------------+
|                                SYMBOLIC LAYER                                     |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | 1. Topological DAG Dependency Solver & Cycle Validator                    |   |
|   |    - Computes in-degrees & unlocks_tasks (transitive downstream impact)   |   |
|   |    - Enforces strict prerequisite scheduling order                        |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   | 2. Multi-Objective Priority Scoring & Chronobiological Slot Allocator      |   |
|   |    - High Focus (09:00-11:30): Difficulty 4-5 tasks                       |   |
|   |    - Medium Focus (14:00-16:30): Difficulty 3 tasks                       |   |
|   |    - Low Focus (19:00-21:00): Difficulty 1-2 tasks                        |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   | 3. Anti-Burnout Guardrail Engine                                          |   |
|   |    - Daily Study Cap: <= 180 mins / day                                   |   |
|   |    - Cognitive Load Cap: sum(duration * difficulty) <= 750 / day          |   |
|   |    - Fatigue Spacing: Never place two difficulty-5 tasks back-to-back     |   |
|   |    - Recovery Breaks: Mandatory 15m break after every 50-60m continuous   |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   | 4. Deterministic Explainability & Attribution Trace Engine                |   |
|   |    - Total Score (0-100 float) + 4 percentage weight contributions        |   |
|   |    - Human-readable natural language audit reasoning                      |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Priority Scoring Formula & Explainability Trace

Every candidate task is evaluated for candidate time slots using a multi-criteria utility function. The composite priority score $S_{total} \in [0, 100]$ balances academic urgency, prerequisite leverage, energy alignment, and subject status.

### 2.1 Multi-Criteria Score Breakdown

$$S_{total} = w_u \cdot U + w_d \cdot D + w_e \cdot E + w_p \cdot P$$

Where the default factor weights are:
- $w_u = 0.35$ (Academic Urgency)
- $w_d = 0.25$ (Dependency Leverage / Unlocks)
- $w_e = 0.20$ (Energy & Focus Zone Alignment)
- $w_p = 0.20$ (Subject Priority & Health Boost)

#### Factor 1: Proximity & Urgency ($U \in [0, 100]$)
Measures days until task deadline or subject exam date ($T_{remain} = \max(0, \text{days\_until\_exam})$):
$$U = \max\left(10, 100 - (T_{remain} \times 18)\right)$$
If $T_{remain} \le 1$, $U = 100$.

#### Factor 2: Dependency Leverage ($D \in [0, 100]$)
Quantifies downstream academic blockage by counting direct and transitive tasks unlocked:
$$D = \min\left(100, 20 + |\text{unlocks\_tasks}| \times 30\right)$$

#### Factor 3: Chronobiological Energy Match ($E \in [0, 100]$)
Aligns task cognitive demand with circadian concentration windows:
- **High Focus (09:00 - 11:30)**: Peak cortisol & working memory $\rightarrow$ ideal for Difficulty 4-5 ($E = 100$), Diff 3 ($E = 60$), Diff 1-2 ($E = 30$).
- **Medium Focus (14:00 - 16:30)**: Post-prandial recovery & sustained execution $\rightarrow$ ideal for Difficulty 3 ($E = 100$), Diff 4 ($E = 65$), Diff 1-2 ($E = 70$), Diff 5 ($E = 40$).
- **Low Focus (19:00 - 21:00)**: Winding down & consolidation $\rightarrow$ ideal for Difficulty 1-2 ($E = 100$), Diff 3 ($E = 60$), Diff 4-5 ($E = 20$).

#### Factor 4: Subject Priority & Status Boost ($P \in [0, 100]$)
Base subject priority (1 to 5) with multipliers for struggling and missed statuses:
$$P_{raw} = \frac{\text{priority}}{5} \times 70 + (\text{is\_struggling} \times 20) + (\text{is\_missed} \times 10)$$
$$P = \min(100, P_{raw})$$

### 2.2 Explainability Percentage Attribution

To ensure complete transparency in the user interface, the factor weights are normalized into integer percentages summing to exactly $100\%$:
$$\text{urgency\_pct} = \text{round}\left(\frac{w_u \cdot U}{S_{total}} \times 100\right)$$
$$\text{dependency\_pct} = \text{round}\left(\frac{w_d \cdot D}{S_{total}} \times 100\right)$$
$$\text{energy\_match\_pct} = \text{round}\left(\frac{w_e \cdot E}{S_{total}} \times 100\right)$$
$$\text{priority\_pct} = 100 - (\text{urgency\_pct} + \text{dependency\_pct} + \text{energy\_match\_pct})$$

Every block includes a structured `explainability` record:
```json
{
  "total_score": 94.2,
  "urgency_pct": 40,
  "dependency_pct": 25,
  "energy_match_pct": 20,
  "priority_pct": 15,
  "reason": "Scheduled in High Focus window (09:00) because OS Exam is tomorrow and this unlocks Deadlock Avoidance."
}
```

---

## 3. Directed Acyclic Graph (DAG) Dependency Solver

Academic courses require strict conceptual scaffolding. The engine implements a topological sort using Kahn's Algorithm extended with time-indexed slot assignment:

1. **Cycle Detection & Validation**:
   - The graph $G = (V, E)$ is built from tasks $V$ and prerequisite directed edges $E = \{(u, v) \mid u \in \text{dependencies}(v)\}$.
   - If in-degrees cannot reach zero across all nodes, a cycle error is trapped and reported.
2. **Unlocks Computation**:
   - For every task $u$, $\text{unlocks\_tasks}(u) = \{ v \mid u \in v.\text{dependencies} \}$.
   - Transitive downstream depth is recorded to boost root bottleneck concepts.
3. **Temporal Invariant**:
   - A task $v$ can NEVER be placed at $(Date_v, Time_v)$ unless all $u \in \text{dependencies}(v)$ are either:
     a) Already completed ($status = \text{"completed"}$), or
     b) Scheduled strictly before: $(Date_u < Date_v) \lor (Date_u = Date_v \land Time_{u, end} \le Time_{v, start})$.

---

## 4. Anti-Burnout Guardrails

The engine enforces strict human cognitive thresholds to prevent student burnout:

| Guardrail Rule | Threshold / Constraint | Action on Violation |
|---|---|---|
| **Daily Study Cap** | Maximum 180 study minutes per calendar day | Reject placement on current day; roll forward to next day's 09:00 slot |
| **Cognitive Load Cap** | $\sum (\text{duration\_mins} \times \text{difficulty}) \le 750$ / day | Prevents stacking high-difficulty tasks on a single day |
| **Fatigue Isolation** | No two Difficulty-5 tasks consecutively | If previous block was Difficulty 5, current Difficulty 5 task must be deferred to next session or day |
| **Ultradian Recovery Break** | Continuous study $\ge 50\text{--}60$ minutes | Automatically insert a 15-minute recovery block (`is_break: true`, `duration_mins: 15`) |

---

## 5. Dynamic AI Micro-Task Decomposition

When a student defines an unstructured goal (e.g. *"Master Dynamic Programming"*), the engine decomposes it into four sequential micro-tasks (30-45 mins each) with progressive difficulty and chained dependencies:

```
[t_new_1: Foundations (35m, Diff 2)]
         |
         v
[t_new_2: Core Drills (40m, Diff 3)]
         |
         v
[t_new_3: Advanced Synthesis (45m, Diff 4)]
         |
         v
[t_new_4: Timed Assessment (30m, Diff 3)]
```

### Deterministic & LLM Execution:
- If `GEMINI_API_KEY` or `OPENAI_API_KEY` is present, the engine queries the LLM with a 4.0-second network timeout.
- If offline, unconfigured, or timed out, the system deterministically synthesizes pedagogical milestones tailored to the subject domain.

---

## 6. Adaptive Rebalancing Engine

The schedule dynamically self-heals when real-world disruptions occur:

1. **`task_missed`**:
   - Target task marked `status: "missed"`.
   - Priority weight boosted by $+25\%$.
   - Re-scheduled into next immediate valid focus slot.
   - Downstream dependent blocks cascaded forward with `is_shifted: true` and `shift_reason`.
2. **`task_delayed`**:
   - Target task duration expanded by $+20$ mins.
   - Status updated to `delayed`.
   - Remaining daily blocks cascaded forward; overflow pushed to subsequent days respecting the 180m and 750 cognitive caps.
3. **`struggling_subject`**:
   - Subject marked `is_struggling: true`.
   - Injects a 35-min prerequisite task `"Foundational Concept Refresher"`.
   - Boosts all tasks in that subject by $+1$ priority and maps them into morning `high` concentration slots.
4. **`urgent_assignment`**:
   - Creates a 45-min, Difficulty-5 task `"Urgent Lab Submission (Due Tomorrow)"` with deadline tomorrow.
   - Preempts lower-priority afternoon/evening tasks and schedules immediately in tomorrow's peak focus window.

---

## 7. JSON API Contract (`PlannerState`)

All state queries and mutation endpoints return the unified `PlannerState` schema:
```json
{
  "subjects": [...],
  "tasks": [...],
  "schedule": [...],
  "last_rebalance": {
    "trigger": "initial | task_missed | task_delayed | struggling_subject | urgent_assignment",
    "timestamp": "HH:MM",
    "summary": "string",
    "shifted_count": 0,
    "changes": ["string"]
  },
  "analytics": {
    "adherence_pct": 100.0,
    "total_planned_mins": 450,
    "total_completed_mins": 90,
    "breaks_inserted": 6,
    "daily_load": [
      { "date": "2026-10-14", "used_mins": 150, "max_mins": 180, "cognitive_score": 78, "max_cognitive": 100 }
    ],
    "by_subject": [
      { "subject_id": "sub_os", "subject_name": "Operating Systems", "color": "#f59e0b", "planned_mins": 135, "completed_mins": 45 }
    ]
  }
}
```
