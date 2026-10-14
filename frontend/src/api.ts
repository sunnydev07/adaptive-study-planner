import type { PlannerState, RebalanceTrigger } from './types';
import { getInitialFallbackState, localComplete, localDecompose, localRebalance, localReset } from './fallbackData';

const BASE = 'http://localhost:8000';

async function tryFetch<T>(fn: () => Promise<T>, fallback: () => T): Promise<{ data: T; live: boolean }> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const data = await fn();
    clearTimeout(t);
    return { data, live: true };
  } catch {
    return { data: fallback(), live: false };
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getState: (local: PlannerState | null) =>
    tryFetch(
      () => fetch(`${BASE}/api/state`).then(parse<PlannerState>),
      () => local ?? getInitialFallbackState(),
    ),
  rebalance: (local: PlannerState, trigger: RebalanceTrigger, ids?: { task_id?: string; subject_id?: string }) =>
    tryFetch(
      () => fetch(`${BASE}/api/rebalance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trigger, ...ids }) }).then(parse<PlannerState>),
      () => localRebalance(local, trigger, ids),
    ),
  complete: (local: PlannerState, task_id: string, actual_mins: number) =>
    tryFetch(
      () => fetch(`${BASE}/api/tasks/${task_id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actual_mins }) }).then(parse<PlannerState>),
      () => localComplete(local, task_id, actual_mins),
    ),
  decompose: (local: PlannerState, goal: string, subject_id: string, deadline: string, difficulty: number) =>
    tryFetch(
      () => fetch(`${BASE}/api/decompose`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal, subject_id, deadline, difficulty }) }).then(parse<PlannerState>),
      () => localDecompose(local, goal, subject_id, deadline, difficulty),
    ),
  reset: () =>
    tryFetch(
      () => fetch(`${BASE}/api/reset`, { method: 'POST' }).then(parse<PlannerState>),
      () => localReset(),
    ),
};
