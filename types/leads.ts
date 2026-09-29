import { Company, Opportunity, Contact } from './database';

export interface LeadItem extends Opportunity {
  company?: Company | null;
  contacts?: Contact[];
  // Derived audit attributes for UI
  website_status?: 'found' | 'missing' | 'unknown';
  seo_opportunity?: boolean;
  social_opportunity?: boolean;
  priority?: 'high' | 'medium' | 'low';
  reasons?: string[];
}

export interface LeadFilterParams {
  search?: string;
  industry?: string;
  location?: string;
  website_status?: 'all' | 'with_website' | 'no_website';
  seo_opportunity?: boolean;
  social_opportunity?: boolean;
  priority?: 'all' | 'high' | 'medium' | 'low';
  status?: string;
  page?: number;
  pageSize?: number;
}
