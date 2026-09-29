import { Contact, Company, Opportunity } from './database';

export type { Contact };

export interface ContactWithCompany extends Contact {
  company: Company | null;
  opportunities?: Opportunity[];
  outreach_count?: number;
  last_outreach_status?: string | null;
  last_outreach_date?: string | null;
}

export interface ContactFilterParams {
  search?: string;
  companyName?: string;
  role?: string;
  confidence?: 'high' | 'medium' | 'low' | 'all';
  hasPhone?: boolean;
  hasEmail?: boolean;
  companyId?: string;
  sortBy?: 'newest' | 'name' | 'confidence';
  page?: number;
  pageSize?: number;
}
