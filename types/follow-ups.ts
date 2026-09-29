import type { Company, Contact, Opportunity } from './database';
import type { OutreachWithRelations } from './outreach';

export type FollowUpStatus = 'scheduled' | 'completed' | 'cancelled';
export type FollowUpPriority = 'urgent' | 'high' | 'medium' | 'low';
export type FollowUpFilterState = 'all' | 'due' | 'overdue' | 'upcoming' | 'completed';

export interface FollowUp {
  id: string;
  opportunity_id: string;
  contact_id: string | null;
  due_at: string;
  action: string;
  note: string;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUpWithRelations extends FollowUp {
  opportunity: (Opportunity & { company: Company | null }) | null;
  contact: Contact | null;
  latest_outreach?: OutreachWithRelations | null;
  is_overdue: boolean;
  is_due_today: boolean;
}

export interface FollowUpMetrics {
  total: number;
  due_today: number;
  overdue: number;
  upcoming: number;
  completed: number;
}

export interface FollowUpFilterParams {
  filter?: FollowUpFilterState;
  status?: FollowUpStatus | 'all';
  priority?: FollowUpPriority | 'all';
  search?: string;
  opportunity_id?: string;
  page?: number;
  pageSize?: number;
}

export interface FollowUpCreateInput {
  opportunity_id: string;
  contact_id?: string | null;
  due_at: string;
  action: string;
  note?: string;
  priority?: FollowUpPriority;
}

export interface FollowUpUpdateInput {
  due_at?: string;
  action?: string;
  note?: string;
  status?: FollowUpStatus;
  priority?: FollowUpPriority;
  completed_at?: string | null;
}

export type ActivityType =
  | 'opportunity_created'
  | 'outreach_draft_created'
  | 'outreach_approved'
  | 'follow_up_created'
  | 'follow_up_rescheduled'
  | 'follow_up_completed'
  | 'status_changed'
  | 'note_added';

export interface Activity {
  id: string;
  opportunity_id: string;
  contact_id?: string | null;
  company_id?: string | null;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
