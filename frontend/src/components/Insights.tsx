import { BarChart3 } from 'lucide-react';
import type { PlannerState } from '../types';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger } from './ui';
import { useState } from 'react';
import { cn } from '../lib/utils';

export function Insights({ state, onCompleteTask, busy }: {
  state: PlannerState; onCompleteTask: (taskId: string, mins: number) => void; busy: boolean;
}) {
  const [tab, setTab] = useState('subjects');
  const maxDay = Math.max(1, ...state.analytics.daily_load.map(d => d.used_mins));
  return (
    <Card className="overflow-hidden lg:sticky lg:top-20">
      <CardHeader>
        <p className="eyebrow flex items-center gap-1.5"><BarChart3 size={13} /> Insights</p>
        <CardTitle>Where the hours go</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="subjects" className="flex-1">Subjects</TabsTrigger>
            <TabsTrigger value="days" className="flex-1">Days</TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === 'subjects' && (
          <div className="mt-4 space-y-4 animate-fade-up">
            {state.analytics.by_subject.map(s => {
              const pct = s.planned_mins ? Math.round((s.completed_mins / s.planned_mins) * 100) : 0;
              return (
                <div key={s.subject_id}>
                  <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.subject_name}
                    </span>
                    <span className="tabular text-stone-500">{s.completed_mins}/{s.planned_mins}m · {pct}%</span>
                  </div>
                  <div className="-mt-0 h-2 w-full overflow-hidden rounded-full bg-stone-200/70">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
            <p className="text-xs leading-relaxed text-stone-500">Bars fill as you complete blocks. Struggling subjects are auto-boosted into morning focus.</p>
          </div>
        )}
        {tab === 'days' && (
          <div className="mt-4 animate-fade-up">
            <div className="flex h-36 items-end gap-4">
              {state.analytics.daily_load.map(d => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="tabular text-xs font-bold">{d.used_mins}m</span>
                  <div className="flex w-full max-w-12 flex-1 items-end overflow-hidden rounded-lg bg-stone-100">
                    <div className={cn('w-full rounded-lg transition-all duration-700', d.used_mins > d.max_mins * 0.9 ? 'bg-rose-400' : 'bg-emerald-700')}
                      style={{ height: `${Math.max(8, (d.used_mins / maxDay) * 100)}%` }} />
                  </div>
                  <span className="tabular text-[11px] text-stone-500">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {state.analytics.daily_load.map(d => (
                <div key={d.date} className="flex justify-between text-xs text-stone-500">
                  <span className="tabular">{d.date}</span>
                  <span className="tabular">cognitive {d.cognitive_score}/{d.max_cognitive}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'tasks' && (
          <div className="mt-4 max-h-72 space-y-1.5 overflow-y-auto pr-1 animate-fade-up">
            {state.tasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 rounded-xl bg-stone-50 px-2.5 py-2 text-[13px]">
                <Badge variant={t.status === 'completed' ? 'accent' : t.status === 'missed' ? 'rose' : t.status === 'delayed' ? 'amber' : 'default'}>{t.status}</Badge>
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                {t.status === 'pending' && (
                  <Button size="sm" variant="outline" className="!h-7 !px-2.5 !text-xs" disabled={busy}
                    onClick={() => onCompleteTask(t.id, t.duration_mins)}>Done</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
