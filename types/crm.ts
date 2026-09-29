import type { Company, Contact } from './database';
import type { OpportunityStatus } from './opportunities';

export type FollowUpState = 'overdue' | 'due_today' | 'upcoming' | 'completed' | 'none';
export type OutreachState = 'draft' | 'approved' | 'sent' | 'replied' | 'failed' | 'none';

export interface CrmOpportunityCard {
  id: string;
  company_id: string | null;
  title: string;
  type: string;
  location: string | null;
  description: string | null;
  source: string | null;
  source_url: string | null;
  status: OpportunityStatus;
  match_score: number | null;
  created_at: string;
  updated_at: string;
  company: Company | null;
  contact: Contact | null;
  latest_outreach: {
    id: string;
    channel: string;
    status: string;
    subject?: string | null;
    message?: string | null;
    updated_at: string;
  } | null;
  next_follow_up: {
    id: string;
    due_at: string;
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'scheduled' | 'completed' | 'cancelled';
    is_overdue: boolean;
    is_due_today: boolean;
  } | null;
  follow_up_state: FollowUpState;
  outreach_state: OutreachState;
}

export interface CrmMetrics {
  total: number;
  new: number;
  qualified: number;
  approved: number;
  contacted: number;
  replied: number;
  interested: number;
  closed: number;
  rejected: number;
  overdue_follow_ups: number;
}

export interface CrmFilterParams {
  search?: string;
  status?: string;
  follow_up_state?: string;
  outreach_state?: string;
  location?: string;
  source?: string;
  view?: 'kanban' | 'list';
}

export interface CrmPipelineColumn {
  id: OpportunityStatus;
  title: string;
  description: string;
  badgeVariant: 'sky' | 'amber' | 'emerald' | 'purple' | 'slate' | 'rose' | 'default';
  count: number;
  items: CrmOpportunityCard[];
}
