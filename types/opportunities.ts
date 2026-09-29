import { Opportunity, Company, Contact } from './database';

export type OpportunityType = 'job' | 'business_lead' | 'website_opportunity';

export type OpportunityStatus =
  'new' | 'qualified' | 'rejected' | 'approved' | 'contacted' | 'replied' | 'interested' | 'closed';

export interface OpportunityWithCompany extends Opportunity {
  company?: Company | null;
  contact?: Contact | null;
}

export interface OpportunityFilterParams {
  type?: string;
  status?: string;
  location?: string;
  search?: string;
  sortBy?: 'newest' | 'score' | 'oldest';
  page?: number;
  pageSize?: number;
}
