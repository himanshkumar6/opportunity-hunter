import type { Opportunity, Company, Contact, Outreach } from './database';

export type OutreachChannel = 'email' | 'whatsapp';

export type OutreachStatus = 'draft' | 'approved' | 'sent' | 'replied' | 'failed';

export interface OpportunityWithCompanyAndContact extends Opportunity {
  company: Company | null;
  contact?: Contact | null;
}

export interface OutreachWithRelations extends Outreach {
  channel: OutreachChannel | string;
  status: OutreachStatus | string;
  opportunity?: OpportunityWithCompanyAndContact | null;
  contact?: Contact | null;
}

export interface OutreachFilterParams {
  status?: string;
  channel?: string;
  search?: string;
  opportunityId?: string;
  page?: number;
  pageSize?: number;
}

export interface OutreachCreateInput {
  opportunity_id: string;
  contact_id?: string | null;
  channel: OutreachChannel;
  subject?: string | null;
  message: string;
}

export interface OutreachUpdateInput {
  contact_id?: string | null;
  channel?: OutreachChannel;
  subject?: string | null;
  message?: string;
}

export interface OutreachTemplateRequest {
  opportunity_id: string;
  channel: OutreachChannel;
  contact_id?: string | null;
}

export interface OutreachTemplateResponse {
  subject: string | null;
  message: string;
  channel: OutreachChannel;
  contactName: string | null;
  companyName: string | null;
}

export interface OutreachMetrics {
  totalDrafts: number;
  totalApproved: number;
  totalSent: number;
  totalReplied: number;
  totalOutreach: number;
}
