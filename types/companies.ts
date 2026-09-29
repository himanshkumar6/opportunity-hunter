import { Company, Opportunity, Contact } from './database';

export type { Company };

export interface CompanyWithStats extends Company {
  opportunities_count: number;
  contacts_count: number;
}

export interface CompanyWithRelations extends Company {
  opportunities: Opportunity[];
  contacts: Contact[];
  opportunities_count: number;
  contacts_count: number;
  outreach_count: number;
  last_outreach_status?: string | null;
  last_outreach_date?: string | null;
}

export interface CompanyFilterParams {
  search?: string;
  industry?: string;
  location?: string;
  sortBy?: 'newest' | 'name' | 'oldest';
  page?: number;
  pageSize?: number;
}
