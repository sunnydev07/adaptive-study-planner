import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Brain, CalendarClock, CheckCircle2, ChevronDown, Clock, Coffee,
  Flag, FlaskConical, History, ListChecks, Plus, RotateCcw, Sparkles, Timer, TrendingUp,
  Wifi, WifiOff, Zap, BookOpen, Hourglass, Sigma,
} from 'lucide-react';
import type { PlannerState, ScheduledBlock } from './types';
import { api } from './api';
import { getInitialFallbackState } from './fallbackData';

function Ring({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r;
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f43f5e';
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 84 84" className="h-24 w-24 -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#1e293b" strokeWidth="9" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">adherence</span>
      </div>
    </div>
  );
}

function ScoreStack({ b }: { b: ScheduledBlock }) {
  const e = b.explainability;
  if (!e) return null;
  const segs = [
    { label: 'Urgency', v: e.urgency_pct, c: 'bg-rose-500' },
    { label: 'Dependency', v: e.dependency_pct, c: 'bg-sky-500' },
    { label: 'Energy', v: e.energy_match_pct, c: 'bg-emerald-500' },
    { label: 'Priority', v: e.priority_pct, c: 'bg-amber-500' },
  ];
  return (
    <div className="mt-3 rounded-xl bg-slate-900/70 border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Brain size={13} className="text-violet-400" /> Why this slot? <span className="ml-1 rounded-md bg-violet-500/20 text-violet-300 px-1.5 py-0.5 font-bold">{e.total_score}</span></span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        {segs.map(s => <div key={s.label} className={`${s.c} transition-all duration-700`} style={{ width: `${s.v / 4}%` }} title={`${s.label}: ${s.v}%`} />)}
      </div>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {segs.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className={`h-2 w-2 rounded-full ${s.c}`} />{s.label} <b className="text-slate-200">{s.v}%</b>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-300 italic">“{e.reason}”</p>
    </div>
  );
}

function BlockCard({ b, onComplete, expanded, onToggle }: { b: ScheduledBlock; onComplete: (id: string) => void; expanded: boolean; onToggle: () => void }) {
  if (b.is_break) return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-400 animate-fade-in">
      <Coffee size={15} className="shrink-0 text-slate-500" />
      <span className="font-medium">{b.task_title}</span>
      <span className="ml-auto text-xs tabular-nums">{b.duration_mins}m</span>
    </div>
  );
  const statusStyle = b.status === 'completed' ? 'border-emerald-700/60 bg-emerald-950/30'
    : b.status === 'missed' ? 'border-rose-700/60 bg-rose-950/30'
    : b.status === 'delayed' ? 'border-amber-600/60 bg-amber-950/20'
    : 'border-slate-700 bg-slate-900/70 hover:border-slate-600';
  const zoneColor = b.concentration_zone === 'high' ? 'text-rose-300 bg-rose-500/15' : b.concentration_zone === 'medium' ? 'text-amber-300 bg-amber-500/15' : 'text-sky-300 bg-sky-500/15';
  return (
    <div className={`rounded-xl border ${statusStyle} p-3 transition-all animate-slide-up ${b.is_shifted ? 'ring-1 ring-violet-500/50 shadow-[0_0_18px_-4px_rgba(139,92,246,0.5)]' : ''}`}>
      <div className="flex items-start gap-2.5">
        <span className="mt-1 h-8 w-1.5 rounded-full shrink-0" style={{ background: b.subject_color }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: b.subject_color }}>{b.subject_name}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${zoneColor}`}>{b.concentration_zone} focus</span>
            {b.is_shifted && <span className="rounded bg-violet-500/20 text-violet-300 px-1.5 py-0.5 text-[10px] font-bold uppercase animate-pulse-soft">⟡ shifted</span>}
            {b.status !== 'pending' && <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-300">{b.status}</span>}
          </div>
          <p className={`mt-0.5 font-semibold leading-snug ${b.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-100'}`}>{b.task_title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock size={12} />{b.start_time}–{b.end_time}</span>
            <span className="flex items-center gap-1"><Timer size={12} />{b.duration_mins}m</span>
            <span className="flex items-center gap-1"><Sigma size={12} />D{b.difficulty}</span>
            {b.dependencies.length > 0 && <span className="text-sky-300/90">⛓ {b.dependencies.join(', ')}</span>}
            {b.unlocks_tasks.length > 0 && <span className="text-emerald-300/90">→ unlocks {b.unlocks_tasks.join(', ')}</span>}
          </div>
          {b.shift_reason && <p className="mt-1 text-[11px] text-violet-300/90">↻ {b.shift_reason}</p>}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {b.status === 'pending' && (
            <button onClick={() => onComplete(b.block_id)} title="Complete task"
              className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-300 hover:bg-emerald-500/30 transition-colors">
              <CheckCircle2 size={16} />
            </button>
          )}
          <button onClick={onToggle} className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
            <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      {expanded && <ScoreStack b={b} />}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<PlannerState>(() => getInitialFallbackState());
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [missId, setMissId] = useState('');
  const [delayId, setDelayId] = useState('');
  const [strugId, setStrugId] = useState('phy');
  const [showDecomp, setShowDecomp] = useState(false);
  const [goal, setGoal] = useState('Master Thermodynamics');
  const [goalSub, setGoalSub] = useState('phy');
  const [goalDate, setGoalDate] = useState('2026-10-22');
  const [goalDiff, setGoalDiff] = useState(4);

  const load = useCallback(async () => {
    const { data, live } = await api.getState(null);
    setState(data); setLive(live);
  }, []);
  useEffect(() => { load(); }, [load]);

  const apply = async (label: string, fn: (s: PlannerState) => Promise<{ data: PlannerState; live: boolean }>) => {
    setLoading(label);
    try { const { data, live } = await fn(state); setState(data); setLive(live); }
    finally { setLoading(null); }
  };

  const pendingBlocks = useMemo(() => state.schedule.filter(b => !b.is_break && b.status === 'pending'), [state]);
  useEffect(() => {
    if (!missId && pendingBlocks[0]) { setMissId(pendingBlocks[0].block_id); setDelayId(pendingBlocks[0].block_id); }
  }, [pendingBlocks, missId]);

  const grouped = useMemo(() => {
    const m = new Map<string, ScheduledBlock[]>();
    for (const b of state.schedule) { if (!m.has(b.date)) m.set(b.date, []); m.get(b.date)!.push(b); }
    return [...m.entries()].sort();
  }, [state]);

  const maxDay = Math.max(1, ...state.analytics.daily_load.map(d => d.used_mins));

  return (
    <div className="min-h-screen bg-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2"><Zap size={18} className="text-white" /></div>
            <div>
              <h1 className="text-base font-extrabold leading-tight">Adaptive AI Study Planner</h1>
              <p className="text-[11px] text-slate-400">Energy-aware · Dependency-chained · Self-healing schedule</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${live ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
              {live ? <Wifi size={12} /> : <WifiOff size={12} />}{live ? 'LIVE · :8000' : 'LOCAL FALLBACK'}
            </span>
            <button onClick={() => apply('reset', () => api.reset())}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-700 transition-colors">
              <RotateCcw size={13} className={loading === 'reset' ? 'animate-spin' : ''} /> Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 space-y-5">
        {/* TOP STATS */}
        <div className="grid gap-3 md:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <Ring pct={state.analytics.adherence_pct} />
            <div className="text-xs text-slate-400 space-y-1">
              <p><b className="text-slate-100 text-sm">{state.analytics.total_completed_mins}</b> / {state.analytics.total_planned_mins} min done</p>
              <p className="flex items-center gap-1"><Coffee size={12} /> {state.analytics.breaks_inserted} smart breaks</p>
              <p className="flex items-center gap-1"><ListChecks size={12} /> {state.schedule.filter(b => b.status === 'completed').length}/{state.schedule.filter(b => !b.is_break).length} blocks</p>
            </div>
          </div>
          <div className="md:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold"><Activity size={14} className="text-violet-400" /> Disruption Simulator <span className="text-[11px] font-normal text-slate-500">— every button works offline too</span></h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-slate-800/70 p-1 pl-2">
                <select value={missId} onChange={e => setMissId(e.target.value)} className="bg-transparent text-xs max-w-[150px] outline-none text-slate-200">
                  {pendingBlocks.map(b => <option key={b.block_id} value={b.block_id} className="bg-slate-900">{b.task_title.slice(0, 28)}</option>)}
                </select>
                <button disabled={loading !== null} onClick={() => apply('missed', s => api.rebalance(s, 'task_missed', { task_id: missId }))}
                  className="flex items-center gap-1 rounded-lg bg-rose-500/20 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/35 transition-colors">
                  <AlertTriangle size={13} /> {loading === 'missed' ? '…' : 'Missed Task'}
                </button>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-slate-800/70 p-1 pl-2">
                <select value={delayId} onChange={e => setDelayId(e.target.value)} className="bg-transparent text-xs max-w-[150px] outline-none text-slate-200">
                  {pendingBlocks.map(b => <option key={b.block_id} value={b.block_id} className="bg-slate-900">{b.task_title.slice(0, 28)}</option>)}
                </select>
                <button disabled={loading !== null} onClick={() => apply('delayed', s => api.rebalance(s, 'task_delayed', { task_id: delayId }))}
                  className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/35 transition-colors">
                  <Hourglass size={13} /> {loading === 'delayed' ? '…' : 'Delayed Task'}
                </button>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-slate-800/70 p-1 pl-2">
                <select value={strugId} onChange={e => setStrugId(e.target.value)} className="bg-transparent text-xs outline-none text-slate-200">
                  {state.subjects.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                </select>
                <button disabled={loading !== null} onClick={() => apply('struggling', s => api.rebalance(s, 'struggling_subject', { subject_id: strugId }))}
                  className="flex items-center gap-1 rounded-lg bg-sky-500/20 px-2.5 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/35 transition-colors">
                  <TrendingUp size={13} /> {loading === 'struggling' ? '…' : 'Struggling Subject'}
                </button>
              </div>
              <button disabled={loading !== null} onClick={() => apply('urgent', s => api.rebalance(s, 'urgent_assignment'))}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity">
                <Flag size={13} /> {loading === 'urgent' ? '…' : 'Urgent Assignment'}
              </button>
              <button onClick={() => setShowDecomp(v => !v)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity">
                <Sparkles size={13} /> Goal Decomposer
              </button>
            </div>
            {showDecomp && (
              <div className="mt-3 grid gap-2 rounded-xl border border-violet-700/40 bg-violet-950/20 p-3 sm:grid-cols-5 animate-slide-up">
                <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Goal…" className="sm:col-span-2 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-violet-500" />
                <select value={goalSub} onChange={e => setGoalSub(e.target.value)} className="rounded-lg bg-slate-800 px-2 py-1.5 text-xs outline-none">
                  {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="date" value={goalDate} onChange={e => setGoalDate(e.target.value)} className="rounded-lg bg-slate-800 px-2 py-1.5 text-xs outline-none" />
                <div className="flex items-center gap-1">
                  <select value={goalDiff} onChange={e => setGoalDiff(Number(e.target.value))} className="flex-1 rounded-lg bg-slate-800 px-2 py-1.5 text-xs outline-none">
                    {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>Diff {d}</option>)}
                  </select>
                  <button disabled={loading !== null} onClick={() => { apply('decompose', s => api.decompose(s, goal, goalSub, goalDate, goalDiff)); setShowDecomp(false); }}
                    className="rounded-lg bg-violet-500 px-2.5 py-1.5 text-xs font-bold hover:bg-violet-400 transition-colors"><Plus size={13} /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REBALANCE BANNER */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-violet-800/40 bg-gradient-to-r from-violet-950/60 to-fuchsia-950/30 px-4 py-3 animate-fade-in">
          <Brain size={16} className="text-violet-300 shrink-0" />
          <p className="text-sm"><b className="text-violet-200">Last rebalance [{state.last_rebalance.trigger}]</b>
            <span className="text-slate-300"> — {state.last_rebalance.summary} </span>
            <span className="text-xs text-slate-400">· {state.last_rebalance.shifted_count} shifted · {new Date(state.last_rebalance.timestamp).toLocaleTimeString()}</span></p>
          {state.last_rebalance.changes.slice(0, 4).map((c, i) => (
            <span key={i} className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] text-slate-300">{c.slice(0, 70)}</span>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* TIMELINE */}
          <section className="lg:col-span-2 space-y-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-200"><CalendarClock size={15} className="text-emerald-400" /> Adaptive Timeline ({state.schedule.length} blocks)</h2>
            {grouped.map(([date, blocks]) => (
              <div key={date} className="space-y-2">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-200">{date}</span>
                  <span className="h-px flex-1 bg-slate-800" />
                  {blocks.filter(b => !b.is_break).reduce((a, b) => a + b.duration_mins, 0)} min
                </p>
                <div className="space-y-2">
                  {blocks.map(b => (
                    <BlockCard key={b.block_id} b={b} expanded={!!expanded[b.block_id]}
                      onToggle={() => setExpanded(p => ({ ...p, [b.block_id]: !p[b.block_id] }))}
                      onComplete={(id) => apply('complete', s => {
                        const blk = s.schedule.find(x => x.block_id === id);
                        return api.complete(s, blk?.task_id ?? id, blk?.duration_mins ?? 45);
                      })} />
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* SIDE PANEL */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold"><BookOpen size={14} className="text-sky-400" /> Subjects</h3>
              <div className="space-y-2.5">
                {state.subjects.map(s => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="font-medium">{s.name}</span>
                    {s.is_struggling && <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-300">struggling</span>}
                    <span className="ml-auto text-xs text-slate-400">P{s.priority} · {s.exam_date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold"><FlaskConical size={14} className="text-emerald-400" /> Progress by Subject</h3>
              <div className="space-y-3">
                {state.analytics.by_subject.map(s => {
                  const pct = s.planned_mins ? Math.round((s.completed_mins / s.planned_mins) * 100) : 0;
                  return (
                    <div key={s.subject_id} className="animate-fade-in">
                      <div className="mb-1 flex justify-between text-xs"><span className="font-semibold">{s.subject_name}</span><span className="text-slate-400 tabular-nums">{s.completed_mins}/{s.planned_mins}m · {pct}%</span></div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold"><Timer size={14} className="text-amber-400" /> Daily Load (native bars)</h3>
              <div className="flex items-end gap-3 h-28">
                {state.analytics.daily_load.map(d => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-bold tabular-nums text-slate-300">{d.used_mins}m</span>
                    <div className="flex w-full flex-1 items-end overflow-hidden rounded-lg bg-slate-800">
                      <div className={`w-full rounded-lg transition-all duration-700 ${d.used_mins > d.max_mins * 0.9 ? 'bg-gradient-to-t from-rose-600 to-rose-400' : 'bg-gradient-to-t from-violet-600 to-fuchsia-400'}`}
                        style={{ height: `${Math.max(6, (d.used_mins / maxDay) * 100)}%` }} title={`${d.date}: cognitive ${d.cognitive_score}/${d.max_cognitive}`} />
                    </div>
                    <span className="text-[10px] text-slate-500">{d.date.slice(5)}</span>
                    <span className="text-[9px] text-slate-500">🧠{d.cognitive_score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold"><History size={14} className="text-slate-400" /> Tasks</h3>
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {state.tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-2 py-1.5 text-xs">
                    <span className={`rounded px-1 py-0.5 text-[10px] font-bold uppercase ${t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : t.status === 'missed' ? 'bg-rose-500/20 text-rose-300' : t.status === 'delayed' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'}`}>{t.status}</span>
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    {t.status === 'pending' && (
                      <button onClick={() => apply('complete', s => api.complete(s, t.id, t.duration_mins))}
                        className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 font-bold text-emerald-300 hover:bg-emerald-500/35">Done</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <footer className="flex items-center justify-center gap-1.5 pb-4 text-[11px] text-slate-500">
          <Sparkles size={11} /> Track B · React + Tailwind + SVG meters (no heavy charts) · Backend {live ? 'connected' : 'offline — local fallback active'}
        </footer>
      </main>

      {loading && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-xl border border-violet-700/50 bg-slate-900 px-3 py-2 text-xs font-semibold shadow-xl animate-slide-up">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" /> Rebalancing…
        </div>
      )}
    </div>
  );
}
