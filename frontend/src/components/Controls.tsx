import { useState } from 'react';
import { AlertTriangle, Flag, Hourglass, Plus, Sparkles, TrendingUp } from 'lucide-react';
import type { PlannerState, RebalanceTrigger, ScheduledBlock } from '../types';
import { Badge, Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, Field, inputCls } from './ui';

type Run = (label: string, trigger: RebalanceTrigger, ids?: { task_id?: string; subject_id?: string }) => void;

function TriggerCard({ icon, title, hint, action, children }: {
  icon: React.ReactNode; title: string; hint: string; action: React.ReactNode; children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(28,25,23,0.25)]">
      <div className="flex items-center gap-2.5">
        <span className="rounded-xl bg-stone-100 p-2 text-stone-700">{icon}</span>
        <div>
          <p className="text-[15px] font-semibold leading-tight">{title}</p>
          <p className="text-xs text-stone-500">{hint}</p>
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
      <div className="mt-3">{action}</div>
    </Card>
  );
}

const selCls = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-2 text-[13px] outline-none focus:border-emerald-700 cursor-pointer';

export function Controls({ state, pending, busy, decoOpen, setDecoOpen, onRun, onDecompose }: {
  state: PlannerState; pending: ScheduledBlock[]; busy: boolean;
  decoOpen: boolean; setDecoOpen: (v: boolean) => void;
  onRun: Run; onDecompose: (goal: string, sub: string, date: string, diff: number) => void;
}) {
  const [missId, setMissId] = useState(pending[0]?.block_id ?? '');
  const [delayId, setDelayId] = useState(pending[0]?.block_id ?? '');
  const [strugId, setStrugId] = useState('phy');
  const [goal, setGoal] = useState('Master Thermodynamics');
  const [goalSub, setGoalSub] = useState('phy');
  const [goalDate, setGoalDate] = useState('2026-10-22');
  const [goalDiff, setGoalDiff] = useState(4);

  return (
    <section id="simulator" className="container scroll-mt-20 py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">Disruption simulator</p>
          <h2 className="font-display mt-1 text-3xl md:text-4xl">Break the plan. <span className="italic text-emerald-800">Watch it heal.</span></h2>
        </div>
        <Badge variant="default">{pending.length} blocks pending</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TriggerCard icon={<AlertTriangle size={17} />} title="Missed task" hint="Absorb + buffer the gap"
          action={<Button variant="softRose" size="sm" className="w-full" disabled={busy || !missId} onClick={() => onRun('missed', 'task_missed', { task_id: missId })}>Mark missed → rebalance</Button>}>
          <select value={missId} onChange={e => setMissId(e.target.value)} className={selCls} aria-label="Task to miss">
            {pending.map(b => <option key={b.block_id} value={b.block_id}>{b.task_title.slice(0, 40)}</option>)}
          </select>
        </TriggerCard>
        <TriggerCard icon={<Hourglass size={17} />} title="Delayed task" hint="Stretch + shift downstream"
          action={<Button variant="softAmber" size="sm" className="w-full" disabled={busy || !delayId} onClick={() => onRun('delayed', 'task_delayed', { task_id: delayId })}>Add delay → rebalance</Button>}>
          <select value={delayId} onChange={e => setDelayId(e.target.value)} className={selCls} aria-label="Task to delay">
            {pending.map(b => <option key={b.block_id} value={b.block_id}>{b.task_title.slice(0, 40)}</option>)}
          </select>
        </TriggerCard>
        <TriggerCard icon={<TrendingUp size={17} />} title="Struggling subject" hint="Boost into peak focus"
          action={<Button variant="softSky" size="sm" className="w-full" disabled={busy} onClick={() => onRun('struggling', 'struggling_subject', { subject_id: strugId })}>Reprioritize subject</Button>}>
          <select value={strugId} onChange={e => setStrugId(e.target.value)} className={selCls} aria-label="Struggling subject">
            {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </TriggerCard>
        <TriggerCard icon={<Flag size={17} />} title="Urgent assignment" hint="Due tomorrow. Drops everything."
          action={<Button variant="default" size="sm" className="w-full" disabled={busy} onClick={() => onRun('urgent', 'urgent_assignment')}>Inject at 08:00 peak</Button>}>
          <p className="rounded-xl bg-stone-100/80 px-3 py-2 text-xs leading-relaxed text-stone-500">Preempts lower-priority blocks and cascades them forward safely.</p>
        </TriggerCard>
      </div>

      <Dialog open={decoOpen} onOpenChange={setDecoOpen}>
        <DialogTrigger asChild>
          <button className="group mt-3 flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl bg-ink px-6 py-5 text-left text-paper transition-transform duration-200 hover:scale-[1.005] cursor-pointer">
            <span>
              <span className="eyebrow !text-stone-400">Goal decomposer</span>
              <span className="font-display mt-1 block text-2xl md:text-[28px]">Turn “{goal || 'anything'}” into chained micro-tasks</span>
            </span>
            <span className="rounded-full bg-paper p-3 text-ink transition-transform duration-200 group-hover:rotate-90"><Plus size={18} /></span>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Decompose a goal</DialogTitle>
          <DialogDescription>Split one ambitious goal into small chained blocks with dependencies, then rebalance around them.</DialogDescription>
          <div className="mt-4 space-y-3">
            <Field label="Goal"><input value={goal} onChange={e => setGoal(e.target.value)} className={inputCls} placeholder="e.g. Master Thermodynamics" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Subject">
                <select value={goalSub} onChange={e => setGoalSub(e.target.value)} className={inputCls}>
                  {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Deadline"><input type="date" value={goalDate} onChange={e => setGoalDate(e.target.value)} className={inputCls} /></Field>
            </div>
            <Field label={`Difficulty — ${goalDiff}/5`}>
              <input type="range" min={1} max={5} value={goalDiff} onChange={e => setGoalDiff(Number(e.target.value))} className="w-full accent-emerald-800" aria-label="Difficulty" />
            </Field>
            <Button variant="accent" className="w-full" disabled={busy || !goal.trim()}
              onClick={() => { onDecompose(goal, goalSub, goalDate, goalDiff); setDecoOpen(false); }}>
              <Sparkles /> Decompose & rebalance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
