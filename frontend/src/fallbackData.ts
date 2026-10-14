import type { PlannerState, RebalanceTrigger } from './types';

const ex = (total: number, u: number, d: number, e: number, p: number, reason: string) => ({
  total_score: total, urgency_pct: u, dependency_pct: d, energy_match_pct: e, priority_pct: p, reason,
});

export function getInitialFallbackState(): PlannerState {
  return {
    subjects: [
      { id: 'math', name: 'Mathematics', color: '#f43f5e', exam_date: '2026-11-02', priority: 5, is_struggling: false },
      { id: 'phy', name: 'Physics', color: '#38bdf8', exam_date: '2026-11-05', priority: 4, is_struggling: true },
      { id: 'chem', name: 'Chemistry', color: '#34d399', exam_date: '2026-11-08', priority: 3, is_struggling: false },
      { id: 'hist', name: 'History', color: '#fbbf24', exam_date: '2026-11-12', priority: 2, is_struggling: false },
    ],
    tasks: [
      { id: 't1', subject_id: 'math', subject_name: 'Mathematics', title: 'Calculus: Integration by parts', duration_mins: 90, difficulty: 4, deadline: '2026-10-16', dependencies: [], status: 'pending', planned_mins: 90, completed_mins: 0 },
      { id: 't2', subject_id: 'math', subject_name: 'Mathematics', title: 'Linear Algebra problem set', duration_mins: 60, difficulty: 3, deadline: '2026-10-17', dependencies: ['t1'], status: 'pending', planned_mins: 60, completed_mins: 0 },
      { id: 't3', subject_id: 'phy', subject_name: 'Physics', title: 'Rotational mechanics drills', duration_mins: 75, difficulty: 5, deadline: '2026-10-16', dependencies: [], status: 'pending', planned_mins: 75, completed_mins: 0 },
      { id: 't4', subject_id: 'phy', subject_name: 'Physics', title: 'EMF past-paper set', duration_mins: 90, difficulty: 4, deadline: '2026-10-18', dependencies: ['t3'], status: 'pending', planned_mins: 90, completed_mins: 0 },
      { id: 't5', subject_id: 'chem', subject_name: 'Chemistry', title: 'Organic mechanisms revision', duration_mins: 60, difficulty: 3, deadline: '2026-10-19', dependencies: [], status: 'pending', planned_mins: 60, completed_mins: 0 },
      { id: 't6', subject_id: 'hist', subject_name: 'History', title: 'WWII essay outline', duration_mins: 45, difficulty: 2, deadline: '2026-10-20', dependencies: [], status: 'pending', planned_mins: 45, completed_mins: 0 },
    ],
    schedule: [
      { block_id: 'b1', task_id: 't1', task_title: 'Calculus: Integration by parts', subject_id: 'math', subject_name: 'Mathematics', subject_color: '#f43f5e', date: '2026-10-14', start_time: '09:00', end_time: '10:30', duration_mins: 90, difficulty: 4, concentration_zone: 'high', is_break: false, dependencies: [], unlocks_tasks: ['t2'], status: 'pending', is_shifted: false, shift_reason: null, explainability: ex(92, 85, 70, 95, 90, 'Exam in 19 days + unlocks Linear Algebra. Placed in high-focus morning zone.') },
      { block_id: 'b2', task_id: null, task_title: 'Break — walk + water', subject_id: null, subject_name: 'Break', subject_color: '#475569', date: '2026-10-14', start_time: '10:30', end_time: '10:45', duration_mins: 15, difficulty: 0, concentration_zone: 'low', is_break: true, dependencies: [], unlocks_tasks: [], status: 'pending', is_shifted: false, shift_reason: null, explainability: null },
      { block_id: 'b3', task_id: 't3', task_title: 'Rotational mechanics drills', subject_id: 'phy', subject_name: 'Physics', subject_color: '#38bdf8', date: '2026-10-14', start_time: '10:45', end_time: '12:00', duration_mins: 75, difficulty: 5, concentration_zone: 'high', is_break: false, dependencies: [], unlocks_tasks: ['t4'], status: 'pending', is_shifted: false, shift_reason: null, explainability: ex(88, 80, 65, 90, 82, 'Struggling subject boosted. Hard topic matched to peak energy window.') },
      { block_id: 'b4', task_id: 't2', task_title: 'Linear Algebra problem set', subject_id: 'math', subject_name: 'Mathematics', subject_color: '#f43f5e', date: '2026-10-15', start_time: '09:00', end_time: '10:00', duration_mins: 60, difficulty: 3, concentration_zone: 'high', is_break: false, dependencies: ['t1'], unlocks_tasks: [], status: 'pending', is_shifted: false, shift_reason: null, explainability: ex(76, 70, 90, 75, 80, 'Runs after Calculus (dependency). Moderate difficulty, morning slot.') },
      { block_id: 'b5', task_id: 't4', task_title: 'EMF past-paper set', subject_id: 'phy', subject_name: 'Physics', subject_color: '#38bdf8', date: '2026-10-15', start_time: '14:00', end_time: '15:30', duration_mins: 90, difficulty: 4, concentration_zone: 'medium', is_break: false, dependencies: ['t3'], unlocks_tasks: [], status: 'pending', is_shifted: false, shift_reason: null, explainability: ex(71, 65, 85, 60, 70, 'Depends on Rotational mechanics. Afternoon slot matches medium energy.') },
      { block_id: 'b6', task_id: 't5', task_title: 'Organic mechanisms revision', subject_id: 'chem', subject_name: 'Chemistry', subject_color: '#34d399', date: '2026-10-16', start_time: '11:00', end_time: '12:00', duration_mins: 60, difficulty: 3, concentration_zone: 'medium', is_break: false, dependencies: [], unlocks_tasks: [], status: 'pending', is_shifted: false, shift_reason: null, explainability: ex(58, 50, 20, 65, 55, 'Lower urgency (exam later). Fills mid-day gap efficiently.') },
      { block_id: 'b7', task_id: 't6', task_title: 'WWII essay outline', subject_id: 'hist', subject_name: 'History', subject_color: '#fbbf24', date: '2026-10-16', start_time: '16:00', end_time: '16:45', duration_mins: 45, difficulty: 2, concentration_zone: 'low', is_break: false, dependencies: [], unlocks_tasks: [], status: 'pending', is_shifted: false, shift_reason: null, explainability: ex(42, 35, 10, 70, 40, 'Easy recall task placed in low-energy late slot by design.') },
    ],
    last_rebalance: { trigger: 'none', timestamp: new Date().toISOString(), summary: 'Initial plan generated. No disruptions yet.', shifted_count: 0, changes: [] },
    analytics: {
      adherence_pct: 100, total_planned_mins: 420, total_completed_mins: 0, breaks_inserted: 1,
      daily_load: [
        { date: '2026-10-14', used_mins: 180, max_mins: 240, cognitive_score: 8.2, max_cognitive: 10 },
        { date: '2026-10-15', used_mins: 150, max_mins: 240, cognitive_score: 6.4, max_cognitive: 10 },
        { date: '2026-10-16', used_mins: 105, max_mins: 240, cognitive_score: 4.1, max_cognitive: 10 },
      ],
      by_subject: [
        { subject_id: 'math', subject_name: 'Mathematics', color: '#f43f5e', planned_mins: 150, completed_mins: 0 },
        { subject_id: 'phy', subject_name: 'Physics', color: '#38bdf8', planned_mins: 165, completed_mins: 0 },
        { subject_id: 'chem', subject_name: 'Chemistry', color: '#34d399', planned_mins: 60, completed_mins: 0 },
        { subject_id: 'hist', subject_name: 'History', color: '#fbbf24', planned_mins: 45, completed_mins: 0 },
      ],
    },
  };
}

function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

function recomputeAnalytics(s: PlannerState): PlannerState {
  const totalPlanned = s.schedule.filter(b => !b.is_break).reduce((a, b) => a + b.duration_mins, 0);
  const totalCompleted = s.schedule.filter(b => b.status === 'completed' && !b.is_break).reduce((a, b) => a + b.duration_mins, 0);
  const done = s.schedule.filter(b => b.status === 'completed').length;
  const disrupted = s.schedule.filter(b => b.status === 'missed' || b.status === 'delayed').length;
  const total = done + disrupted;
  s.analytics.total_planned_mins = totalPlanned;
  s.analytics.total_completed_mins = totalCompleted;
  s.analytics.adherence_pct = total === 0 ? 100 : Math.round((done / total) * 100);
  s.analytics.breaks_inserted = s.schedule.filter(b => b.is_break).length;
  // by_subject
  const bySub: Record<string, { planned: number; done: number }> = {};
  for (const b of s.schedule) {
    if (b.is_break || !b.subject_id) continue;
    bySub[b.subject_id] ??= { planned: 0, done: 0 };
    bySub[b.subject_id].planned += b.duration_mins;
    if (b.status === 'completed') bySub[b.subject_id].done += b.duration_mins;
  }
  s.analytics.by_subject = s.subjects.map(sub => ({
    subject_id: sub.id, subject_name: sub.name, color: sub.color,
    planned_mins: bySub[sub.id]?.planned ?? 0, completed_mins: bySub[sub.id]?.done ?? 0,
  }));
  // daily load
  const byDay: Record<string, number> = {};
  for (const b of s.schedule) { if (!b.is_break) byDay[b.date] = (byDay[b.date] ?? 0) + b.duration_mins; }
  s.analytics.daily_load = Object.keys(byDay).sort().map(d => {
    const used = byDay[d];
    return { date: d, used_mins: used, max_mins: 240, cognitive_score: Math.min(10, Math.round((used / 240) * 10 * 10) / 10), max_cognitive: 10 };
  });
  // tasks sync
  for (const t of s.tasks) {
    const blocks = s.schedule.filter(b => b.task_id === t.id);
    t.planned_mins = blocks.reduce((a, b) => a + b.duration_mins, 0);
    t.completed_mins = blocks.filter(b => b.status === 'completed').reduce((a, b) => a + b.duration_mins, 0);
    if (blocks.length && blocks.every(b => b.status === 'completed')) t.status = 'completed';
    else if (blocks.some(b => b.status === 'missed')) t.status = 'missed';
    else if (blocks.some(b => b.status === 'delayed')) t.status = 'delayed';
    else t.status = 'pending';
  }
  return s;
}

export function localRebalance(prev: PlannerState, trigger: RebalanceTrigger, opts?: { task_id?: string; subject_id?: string }): PlannerState {
  const s = clone(prev);
  const now = new Date().toISOString();
  let changes: string[] = [];
  let shifted = 0;

  const markShifted = (bId: string, reason: string) => {
    const b = s.schedule.find(x => x.block_id === bId);
    if (b && !b.is_break) { b.is_shifted = true; b.shift_reason = reason; shifted++; changes.push(`${b.task_title}: ${reason}`); }
  };

  if (trigger === 'task_missed') {
    const targetId = opts?.task_id ?? s.schedule.find(b => !b.is_break && b.status === 'pending')?.block_id;
    const target = s.schedule.find(b => b.block_id === targetId && !b.is_break);
    if (target) {
      target.status = 'missed';
      changes.push(`Marked "${target.task_title}" as missed`);
      // cascade dependents: push later blocks of same subject
      const idx = s.schedule.indexOf(target);
      s.schedule.slice(idx + 1).filter(b => !b.is_break && b.status === 'pending').slice(0, 3).forEach(b => {
        markShifted(b.block_id, `Pushed later to absorb missed "${target.task_title}" + recovery buffer added`);
      });
      // insert recovery break after missed
      s.schedule.splice(idx + 1, 0, {
        block_id: `b-rec-${Date.now()}`, task_id: null, task_title: 'Recovery break — reset + review', subject_id: null,
        subject_name: 'Break', subject_color: '#475569', date: target.date, start_time: target.end_time, end_time: target.end_time,
        duration_mins: 15, difficulty: 0, concentration_zone: 'low', is_break: true, dependencies: [], unlocks_tasks: [],
        status: 'pending', is_shifted: true, shift_reason: 'Auto-inserted recovery buffer after missed task', explainability: null,
      });
      changes.push('Inserted 15-min recovery buffer');
    }
  } else if (trigger === 'task_delayed') {
    const target = s.schedule.find(b => b.block_id === opts?.task_id && !b.is_break) ?? s.schedule.find(b => !b.is_break && b.status === 'pending');
    if (target) {
      target.status = 'delayed';
      changes.push(`Marked "${target.task_title}" as delayed (+30 min)`);
      const idx = s.schedule.indexOf(target);
      s.schedule.slice(idx + 1).filter(b => !b.is_break && b.status === 'pending').slice(0, 2).forEach(b => {
        markShifted(b.block_id, `Shifted +30m due to delayed "${target.task_title}"`);
      });
    }
  } else if (trigger === 'struggling_subject') {
    const sid = opts?.subject_id ?? 'phy';
    const sub = s.subjects.find(x => x.id === sid);
    if (sub) { sub.is_struggling = true; sub.priority = 5; }
    s.schedule.filter(b => b.subject_id === sid && !b.is_break && b.status === 'pending').forEach(b => {
      b.difficulty = Math.min(5, b.difficulty);
      markShifted(b.block_id, `Prioritized: struggling "${sub?.name}" moved earlier + split into focus chunks`);
      if (b.explainability) { b.explainability.priority_pct = 95; b.explainability.total_score = Math.min(99, b.explainability.total_score + 8); }
    });
    changes.unshift(`Boosted priority for struggling subject: ${sub?.name ?? sid}`);
  } else if (trigger === 'urgent_assignment') {
    const nb = {
      block_id: `b-urg-${Date.now()}`, task_id: 't-urg', task_title: 'URGENT: Assignment due tomorrow', subject_id: 'math',
      subject_name: 'Mathematics', subject_color: '#f43f5e', date: s.schedule[0]?.date ?? '2026-10-14',
      start_time: '08:00', end_time: '09:00', duration_mins: 60, difficulty: 4, concentration_zone: 'high' as const,
      is_break: false, dependencies: [] as string[], unlocks_tasks: [] as string[], status: 'pending' as const,
      is_shifted: true, shift_reason: 'Urgent assignment injected at top of day — highest urgency score',
      explainability: ex(99, 100, 50, 95, 100, 'URGENT override: deadline < 24h forces top placement in peak zone.'),
    };
    s.schedule.unshift(nb);
    shifted++;
    changes.push('Injected URGENT assignment at 08:00 peak zone');
    s.schedule.filter(b => !b.is_break && b.block_id !== nb.block_id && b.status === 'pending').slice(0, 3).forEach(b => {
      markShifted(b.block_id, 'Bumped later to make room for urgent assignment');
    });
    if (!s.tasks.find(t => t.id === 't-urg')) {
      s.tasks.unshift({ id: 't-urg', subject_id: 'math', subject_name: 'Mathematics', title: 'URGENT: Assignment due tomorrow', duration_mins: 60, difficulty: 4, deadline: '2026-10-15', dependencies: [], status: 'pending', planned_mins: 60, completed_mins: 0 });
    }
  }

  const labels: Record<RebalanceTrigger, string> = {
    task_missed: 'Missed task absorbed — dependents pushed, buffer added',
    task_delayed: 'Delay absorbed — downstream shifted +30m',
    struggling_subject: 'Struggling subject reprioritized into peak zones',
    urgent_assignment: 'Urgent assignment injected at top with max urgency',
  };
  s.last_rebalance = { trigger, timestamp: now, summary: labels[trigger], shifted_count: shifted, changes };
  return recomputeAnalytics(s);
}

export function localComplete(prev: PlannerState, blockIdOrTaskId: string, actualMins: number): PlannerState {
  const s = clone(prev);
  const b = s.schedule.find(x => x.block_id === blockIdOrTaskId) ?? s.schedule.find(x => x.task_id === blockIdOrTaskId && x.status === 'pending');
  if (b) { b.status = 'completed'; b.is_shifted = false; }
  return recomputeAnalytics(s);
}

export function localDecompose(prev: PlannerState, goal: string, subjectId: string, deadline: string, difficulty: number): PlannerState {
  const s = clone(prev);
  const sub = s.subjects.find(x => x.id === subjectId) ?? s.subjects[0];
  const tid = `t-${Date.now()}`;
  const chunks = [
    `${goal} — Part 1: Learn core concepts`,
    `${goal} — Part 2: Guided practice`,
    `${goal} — Part 3: Test + review`,
  ];
  s.tasks.push(...chunks.map((title, i) => ({
    id: `${tid}-${i}`, subject_id: sub.id, subject_name: sub.name, title,
    duration_mins: 45, difficulty, deadline, dependencies: i === 0 ? [] as string[] : [`${tid}-${i - 1}`],
    status: 'pending', planned_mins: 45, completed_mins: 0,
  })));
  const lastDate = s.schedule[s.schedule.length - 1]?.date ?? '2026-10-16';
  chunks.forEach((title, i) => {
    s.schedule.push({
      block_id: `b-${tid}-${i}`, task_id: `${tid}-${i}`, task_title: title, subject_id: sub.id,
      subject_name: sub.name, subject_color: sub.color, date: lastDate, start_time: `${13 + i}:00`, end_time: `${13 + i}:45`,
      duration_mins: 45, difficulty, concentration_zone: i === 0 ? 'high' : 'medium', is_break: false,
      dependencies: i === 0 ? [] : [`${tid}-${i - 1}`], unlocks_tasks: i < 2 ? [`${tid}-${i + 1}`] : [],
      status: 'pending', is_shifted: true, shift_reason: `Decomposed from goal "${goal}" — dependency-chained chunk ${i + 1}/3`,
      explainability: ex(80 - i * 5, 75, 90, 70, 80, `AI-decomposed chunk ${i + 1}/3. Chained so each unlocks the next.`),
    });
  });
  s.last_rebalance = { trigger: 'decompose', timestamp: new Date().toISOString(), summary: `Goal "${goal}" split into 3 chained blocks for ${sub.name}`, shifted_count: 3, changes: chunks };
  return recomputeAnalytics(s);
}

export function localReset(): PlannerState { return getInitialFallbackState(); }

export interface AiChunkInput { title: string; duration_mins: number; difficulty: number }

export function localDecomposeWithTasks(
  prev: PlannerState, goal: string, subjectId: string, deadline: string, chunks: AiChunkInput[], sourceLabel: string,
): PlannerState {
  const s = clone(prev);
  const sub = s.subjects.find(x => x.id === subjectId) ?? s.subjects[0];
  const tid = `t-ai-${Date.now()}`;
  const n = Math.max(1, Math.min(6, chunks.length));
  s.tasks.push(...chunks.slice(0, n).map((c, i) => ({
    id: `${tid}-${i}`, subject_id: sub.id, subject_name: sub.name, title: c.title,
    duration_mins: c.duration_mins, difficulty: c.difficulty, deadline,
    dependencies: i === 0 ? [] as string[] : [`${tid}-${i - 1}`],
    status: 'pending', planned_mins: c.duration_mins, completed_mins: 0,
  })));
  const lastDate = s.schedule[s.schedule.length - 1]?.date ?? '2026-10-16';
  chunks.slice(0, n).forEach((c, i) => {
    s.schedule.push({
      block_id: `b-${tid}-${i}`, task_id: `${tid}-${i}`, task_title: c.title, subject_id: sub.id,
      subject_name: sub.name, subject_color: sub.color, date: lastDate, start_time: `${13 + i}:00`, end_time: `${13 + i}:45`,
      duration_mins: c.duration_mins, difficulty: c.difficulty, concentration_zone: i === 0 ? 'high' : 'medium', is_break: false,
      dependencies: i === 0 ? [] : [`${tid}-${i - 1}`], unlocks_tasks: i < n - 1 ? [`${tid}-${i + 1}`] : [],
      status: 'pending', is_shifted: true, shift_reason: `AI-decomposed from "${goal}" (${sourceLabel}) — chunk ${i + 1}/${n}`,
      explainability: ex(82 - i * 4, 75, 90, 70, 80, `AI-planned chunk ${i + 1}/${n} by ${sourceLabel}. Chained so each unlocks the next.`),
    });
  });
  s.last_rebalance = { trigger: 'decompose', timestamp: new Date().toISOString(), summary: `Qwen (${sourceLabel}) split "${goal}" into ${n} chained blocks for ${sub.name}`, shifted_count: n, changes: chunks.slice(0, n).map(c => c.title) };
  return recomputeAnalytics(s);
}
