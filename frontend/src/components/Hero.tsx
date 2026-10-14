import { motion, type Variants } from 'framer-motion';
import { ArrowDown, Sparkles, Wifi, WifiOff } from 'lucide-react';
import type { PlannerState } from '../types';
import { Badge, Button } from './ui';

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

function MiniRing({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r;
  const color = pct >= 80 ? '#166534' : pct >= 50 ? '#b45309' : '#be123c';
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 68 68" className="h-20 w-20 -rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="#e7e5e4" strokeWidth="7" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="tabular text-lg font-bold">{pct}<span className="text-xs font-medium text-stone-400">%</span></span>
      </div>
    </div>
  );
}

export function Hero({ state, live, onDecompose }: { state: PlannerState; live: boolean; onDecompose: () => void }) {
  const done = state.schedule.filter(b => b.status === 'completed' && !b.is_break).length;
  const total = state.schedule.filter(b => !b.is_break).length;
  const stats = [
    { v: `${state.analytics.total_completed_mins}m`, l: `of ${state.analytics.total_planned_mins}m focused` },
    { v: `${done}/${total}`, l: 'blocks complete' },
    { v: `${state.analytics.breaks_inserted}`, l: 'recovery breaks' },
    { v: `${state.schedule.filter(b => b.is_shifted).length}`, l: 'blocks reshuffled' },
  ];
  return (
    <section className="dotgrid relative overflow-hidden border-b border-stone-200/80">
      <div className="pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />
      <div className="container relative pb-10 pt-12 md:pb-14 md:pt-16">
        <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
          <Badge variant={live ? 'accent' : 'amber'} className="mb-5">
            {live ? <Wifi /> : <WifiOff />}
            {live ? 'Live · connected to :8000' : 'Offline mode · local planner active'}
          </Badge>
        </motion.div>
        <div className="grid items-end gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <motion.h1 variants={rise} initial="hidden" animate="show" custom={1}
              className="font-display text-[44px] leading-[1.02] tracking-tight md:text-[68px]">
              Study less frantically,<br />
              <span className="italic text-emerald-800">learn more deliberately.</span>
            </motion.h1>
            <motion.p variants={rise} initial="hidden" animate="show" custom={2}
              className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-500 md:text-base">
              An energy-aware planner that chains your prerequisites, guards against burnout,
              and quietly rebuilds the day when life interrupts — with a reason for every block.
            </motion.p>
            <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="mt-6 flex flex-wrap gap-2.5">
              <Button size="lg" variant="accent" onClick={onDecompose}>
                <Sparkles /> Decompose a goal
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' })}>
                Simulate a disruption <ArrowDown />
              </Button>
            </motion.div>
          </div>
          <motion.div variants={rise} initial="hidden" animate="show" custom={4}
            className="rounded-3xl border border-stone-200/90 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-4">
              <MiniRing pct={state.analytics.adherence_pct} />
              <div>
                <p className="eyebrow">Adherence</p>
                <p className="mt-1 text-sm leading-snug text-stone-500">
                  {state.last_rebalance.summary.length > 90 ? state.last_rebalance.summary.slice(0, 90) + '…' : state.last_rebalance.summary}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-200/60 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {stats.map(s => (
                <div key={s.l} className="bg-white px-3 py-2.5">
                  <p className="tabular text-[15px] font-bold">{s.v}</p>
                  <p className="text-[11px] leading-tight text-stone-500">{s.l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        {/* subject ticker */}
        <motion.div variants={rise} initial="hidden" animate="show" custom={5} className="mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-8 pr-8">
            {[...state.subjects, ...state.subjects].map((s, i) => (
              <span key={i} className="flex items-center gap-2 text-[13px] font-medium text-stone-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.name} · exam {s.exam_date.slice(5)}
                {s.is_struggling && <span className="rounded-full bg-sky-100 px-1.5 text-[10px] font-bold uppercase text-sky-800">struggling</span>}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
