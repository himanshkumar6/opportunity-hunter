/**
 * Opportunity Hunter — Lead Hunt Engine Types
 * Unified data contracts for n8n Primary and Direct Fallback engines.
 */

export interface LeadHuntInput {
  niche: string;
  city: string;
  max_results: number;
  no_website: boolean;
  seo_opportunity: boolean;
  social_opportunity: boolean;
  triggered_by: string;
  execution_id?: string;
}

export type ExecutionEngine = 'n8n' | 'direct';

export interface BudgetStatus {
  month: string;
  lead_searches_used: number;
  lead_search_limit: number;
  lead_searches_remaining: number;
  total_searches_used: number;
  total_search_limit: number;
  total_searches_remaining: number;
  allowed: boolean;
  reason?: string;
}

export interface RawLocalBusiness {
  position?: number;
  title: string;
  place_id?: string;
  data_id?: string;
  address?: string;
  phone?: string;
  website?: string | null;
  link?: string | null;
  description?: string;
  type?: string;
  types?: string[];
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  latitude?: number;
  longitude?: number;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  x?: string;
  social_links?: string[];
  [key: string]: unknown;
}

export interface SanitizedRawResult {
  search_run_id: string;
  title: string;
  url: string | null;
  google_maps_url: string | null;
  snippet: string | null;
  position: number;
  raw_data: Record<string, unknown>;
}

export interface EvaluatedLead {
  search_run_id: string;
  company_id: string;
  contact_id: string | null;
  opportunity_id: string | null;
  is_new_company: boolean;
  is_new_contact: boolean;
  is_new_opportunity: boolean;

  company_name: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  location: string | null;
  industry: string | null;
  source_url: string | null;
  raw_data: Record<string, unknown>;

  website_status: 'found' | 'not_found' | 'unknown';
  website_opportunity: boolean;

  google_rating: number | null;
  google_reviews: number;
  seo_opportunity: boolean;
  seo_reason: string;

  social_status: 'found' | 'not_found';
  social_opportunity: boolean;
  social_links: string[];
  social_reason: string;

  lead_score: number;
  lead_priority: 'high' | 'medium' | 'low';
  score_reasons: string;

  contact_name: string | null;
  contact_role: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_confidence: number | null;

  opp_title: string;
  opp_type: 'business_lead';
  opp_match_score: number;
}

export interface LeadHuntExecutionResult {
  success: boolean;
  engine: ExecutionEngine;
  message: string;
  details?: string;
  search_run_id?: string;
  results_count?: number;
  companies_created?: number;
  contacts_created?: number;
  opportunities_created?: number;
  query: {
    niche: string;
    city: string;
    max_results: number;
  };
  filters: {
    no_website: boolean;
    seo_opportunity: boolean;
    social_opportunity: boolean;
  };
  fallback_triggered?: boolean;
  fallback_reason?: string;
  triggeredAt: string;
  triggeredBy: string;
}
