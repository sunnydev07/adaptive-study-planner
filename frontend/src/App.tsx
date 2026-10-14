import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Leaf, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import type { PlannerState, RebalanceTrigger } from './types';
import { api } from './api';
import { getInitialFallbackState, localDecomposeWithTasks } from './fallbackData';
import type { AiChunk } from './lib/groq';
import { Badge, Button } from './components/ui';
import { Hero } from './components/Hero';
import { Controls } from './components/Controls';
import { Timeline } from './components/Timeline';
import { Insights } from './components/Insights';

export default function App() {
  const [state, setState] = useState<PlannerState>(() => getInitialFallbackState());
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [decoOpen, setDecoOpen] = useState(false);

  useEffect(() => {
    api.getState(null).then(({ data, live }) => { setState(data); setLive(live); });
  }, []);

  const apply = useCallback(async (label: string, fn: (s: PlannerState) => Promise<{ data: PlannerState; live: boolean }>) => {
    setLoading(label);
    try {
      const { data, live } = await fn(state);
      setState(data); setLive(live);
    } finally { setLoading(null); }
  }, [state]);

  const pending = useMemo(() => state.schedule.filter(b => !b.is_break && b.status === 'pending'), [state]);
  const grouped = useMemo(() => {
    const m = new Map<string, typeof state.schedule>();
    for (const b of state.schedule) {
      if (!m.has(b.date)) m.set(b.date, []);
      m.get(b.date)!.push(b);
    }
    return [...m.entries()].sort() as [string, typeof state.schedule][];
  }, [state]);

  const busy = loading !== null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-paper/85 backdrop-blur-md">
        <div className="container flex h-14 items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper"><Leaf size={15} /></span>
          <p className="text-[15px] font-semibold tracking-tight">Adaptive <span className="font-display italic font-normal">Study Planner</span></p>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={live ? 'accent' : 'amber'}>
              {live ? <Wifi /> : <WifiOff />}{live ? 'Live' : 'Local'}
            </Badge>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => apply('reset', () => api.reset())}>
              <RotateCcw size={14} className={loading === 'reset' ? 'animate-spin' : ''} /> Reset
            </Button>
          </div>
        </div>
      </header>

      <main>
        <Hero state={state} live={live} onDecompose={() => setDecoOpen(true)} />

        <div className="container pt-6">
          <AnimatePresence mode="wait">
            <motion.div key={state.last_rebalance.timestamp + state.last_rebalance.trigger}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-emerald-800/20 bg-emerald-50/60 px-5 py-3.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-700" />
              <p className="text-sm">
                <span className="font-semibold">Latest rebalance · {state.last_rebalance.trigger.replace(/_/g, ' ')}</span>
                <span className="text-stone-500"> — {state.last_rebalance.summary}</span>
              </p>
              <span className="tabular ml-auto text-xs text-stone-500">
                {state.last_rebalance.shifted_count} shifted · {state.last_rebalance.changes.length} changes
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <Controls
          state={state} pending={pending} busy={busy} decoOpen={decoOpen} setDecoOpen={setDecoOpen}
          onRun={(label, trigger: RebalanceTrigger, ids) => apply(label, s => api.rebalance(s, trigger, ids))}
          onDecompose={(goal, sub, date, diff) => apply('decompose', s => api.decompose(s, goal, sub, date, diff))}
          onDecomposeAI={(chunks: AiChunk[], model, goal, sub, date) =>
            apply('ai-decompose', async s => ({ data: localDecomposeWithTasks(s, goal, sub, date, chunks, model), live }))}
        />

        <div className="container grid gap-8 pb-16 lg:grid-cols-[1.6fr_1fr]">
          <Timeline
            grouped={grouped} expanded={expanded} busy={busy}
            onToggle={id => setExpanded(p => ({ ...p, [id]: !p[id] }))}
            onComplete={id => apply('complete', s => {
              const blk = s.schedule.find(x => x.block_id === id);
              return api.complete(s, blk?.task_id ?? id, blk?.duration_mins ?? 45);
            })}
          />
          <div>
            <Insights
              state={state} busy={busy}
              onCompleteTask={(taskId, mins) => apply('complete', s => api.complete(s, taskId, mins))}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200/80">
        <div className="container flex flex-wrap items-center gap-2 py-6 text-xs text-stone-400">
          <span className="font-display text-base italic text-stone-500">Plan gently, focus deeply.</span>
          <span className="ml-auto">Track B · React + Tailwind · {live ? 'backend connected' : 'local fallback active'}</span>
        </div>
      </footer>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-ink py-2.5 pl-4 pr-5 text-sm font-medium text-paper shadow-xl">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
            Rebalancing your week…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
