import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Check, ChevronDown, Coffee } from 'lucide-react';
import type { ScheduledBlock } from '../types';
import { cn } from '../lib/utils';
import { Badge } from './ui';

function Factors({ b }: { b: ScheduledBlock }) {
  const e = b.explainability;
  if (!e) return null;
  const rows = [
    { l: 'Urgency', v: e.urgency_pct, c: 'bg-rose-400' },
    { l: 'Dependency', v: e.dependency_pct, c: 'bg-sky-500' },
    { l: 'Energy fit', v: e.energy_match_pct, c: 'bg-emerald-600' },
    { l: 'Priority', v: e.priority_pct, c: 'bg-amber-500' },
  ];
  return (
    <div className="mt-3 rounded-xl bg-stone-50 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="eyebrow">Why this slot</p>
        <span className="tabular rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-paper">{e.total_score}</span>
      </div>
      <div className="space-y-1.5">
        {rows.map(r => (
          <div key={r.l} className="flex items-center gap-2.5 text-xs">
            <span className="w-20 shrink-0 text-stone-500">{r.l}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200/80">
              <div className={cn('h-full rounded-full transition-all duration-700', r.c)} style={{ width: `${r.v}%` }} />
            </div>
            <span className="tabular w-9 text-right font-semibold">{r.v}%</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 border-l-2 border-emerald-700/40 pl-2.5 font-display text-[15px] italic leading-snug text-stone-600">“{e.reason}”</p>
    </div>
  );
}

export function Timeline({ grouped, expanded, onToggle, onComplete, busy }: {
  grouped: [string, ScheduledBlock[]][];
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onComplete: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock size={16} className="text-emerald-800" />
        <h2 className="font-display text-3xl">The week, <span className="italic text-emerald-800">composed.</span></h2>
      </div>
      <div className="space-y-7">
        {grouped.map(([date, blocks]) => (
          <div key={date}>
            <div className="mb-2.5 flex items-center gap-3">
              <p className="tabular rounded-full bg-ink px-3 py-1 text-xs font-semibold text-paper">{date}</p>
              <span className="h-px flex-1 bg-stone-200" />
              <p className="tabular text-xs text-stone-500">{blocks.filter(b => !b.is_break).reduce((a, b) => a + b.duration_mins, 0)} min</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
              {blocks.map((b, i) => {
                if (b.is_break) return (
                  <div key={b.block_id} className={cn('flex items-center gap-3 px-4 py-2 text-[13px] text-stone-400', i !== blocks.length - 1 && 'border-b border-dashed border-stone-200')}>
                    <Coffee size={14} /><span className="italic">{b.task_title}</span>
                    <span className="tabular ml-auto text-xs">{b.duration_mins}m</span>
                  </div>
                );
                const open = !!expanded[b.block_id];
                return (
                  <div key={b.block_id} className={cn('px-4 py-3 transition-colors hover:bg-stone-50/70', i !== blocks.length - 1 && 'border-b border-stone-100')}>
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-9 w-1 rounded-full shrink-0" style={{ background: b.subject_color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="tabular text-xs font-semibold text-stone-400">{b.start_time} – {b.end_time}</span>
                          <span className="text-xs font-semibold" style={{ color: b.subject_color }}>{b.subject_name}</span>
                          {b.is_shifted && <Badge variant="violet">shifted</Badge>}
                          {b.status !== 'pending' && (
                            <Badge variant={b.status === 'completed' ? 'accent' : b.status === 'missed' ? 'rose' : 'amber'}>{b.status}</Badge>
                          )}
                        </div>
                        <p className={cn('mt-0.5 text-[15px] font-medium leading-snug', b.status === 'completed' && 'text-stone-400 line-through')}>
                          {b.task_title}
                        </p>
                        <p className="tabular mt-0.5 text-xs text-stone-400">
                          {b.duration_mins} min · difficulty {b.difficulty}/5 · {b.concentration_zone} focus
                          {b.dependencies.length > 0 && ` · after ${b.dependencies.join(', ')}`}
                        </p>
                        {b.shift_reason && <p className="mt-1 text-xs text-violet-800">↻ {b.shift_reason}</p>}
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                              <Factors b={b} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {b.status === 'pending' && (
                          <button onClick={() => onComplete(b.block_id)} disabled={busy} aria-label={`Complete ${b.task_title}`}
                            className="rounded-full border border-emerald-200 bg-emerald-50 p-2 text-emerald-800 transition-all hover:bg-emerald-800 hover:text-white disabled:opacity-40 cursor-pointer">
                            <Check size={14} />
                          </button>
                        )}
                        <button onClick={() => onToggle(b.block_id)} aria-label={open ? 'Collapse reasoning' : 'Expand reasoning'}
                          className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink cursor-pointer">
                          <ChevronDown size={15} className={cn('transition-transform duration-200', open && 'rotate-180')} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
