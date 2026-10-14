export interface Explainability {
  total_score: number;
  urgency_pct: number;
  dependency_pct: number;
  energy_match_pct: number;
  priority_pct: number;
  reason: string;
}
export interface ScheduledBlock {
  block_id: string;
  task_id: string | null;
  task_title: string;
  subject_id: string | null;
  subject_name: string;
  subject_color: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_mins: number;
  difficulty: number;
  concentration_zone: 'high' | 'medium' | 'low';
  is_break: boolean;
  dependencies: string[];
  unlocks_tasks: string[];
  status: 'pending' | 'completed' | 'missed' | 'delayed';
  is_shifted: boolean;
  shift_reason: string | null;
  explainability: Explainability | null;
}
export interface PlannerState {
  subjects: { id: string; name: string; color: string; exam_date: string; priority: number; is_struggling: boolean }[];
  tasks: { id: string; subject_id: string; subject_name: string; title: string; duration_mins: number; difficulty: number; deadline: string; dependencies: string[]; status: string; planned_mins: number; completed_mins: number }[];
  schedule: ScheduledBlock[];
  last_rebalance: { trigger: string; timestamp: string; summary: string; shifted_count: number; changes: string[] };
  analytics: {
    adherence_pct: number;
    total_planned_mins: number;
    total_completed_mins: number;
    breaks_inserted: number;
    daily_load: { date: string; used_mins: number; max_mins: number; cognitive_score: number; max_cognitive: number }[];
    by_subject: { subject_id: string; subject_name: string; color: string; planned_mins: number; completed_mins: number }[];
  };
}
export type RebalanceTrigger = 'task_missed' | 'task_delayed' | 'struggling_subject' | 'urgent_assignment';
