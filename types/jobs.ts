import { Company, Opportunity } from './database';

export interface JobItem extends Opportunity {
  company?: Company | null;
}

export interface JobFilterParams {
  search?: string;
  location?: string;
  source?: string;
  status?: string;
  minScore?: number;
  dateRange?: string;
  page?: number;
  pageSize?: number;
}
