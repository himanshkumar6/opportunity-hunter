export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LeadSearchRequest {
  niche: string;
  city: string;
  max_results: number;
  no_website?: boolean;
  seo_opportunity?: boolean;
  social_opportunity?: boolean;
}

export interface DashboardStats {
  totalJobs: number;
  totalLeads: number;
  newOpportunities: number;
  highPriorityLeads: number;
  totalCompanies: number;
  totalContacts: number;
}
