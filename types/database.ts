export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SearchRun = {
  id: string;
  query: string;
  location: string;
  source: string;
  status: string;
  results_count: number;
  created_at: string;
  [key: string]: unknown;
};

export type RawSearchResult = {
  id: string;
  search_run_id: string;
  title: string;
  url: string;
  snippet: string;
  position: number;
  raw_data: Json;
  created_at: string;
  [key: string]: unknown;
};

export type Company = {
  id: string;
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
  description: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export type Opportunity = {
  id: string;
  company_id: string | null;
  title: string;
  type: string; // 'job' | 'lead' | etc.
  location: string | null;
  description: string | null;
  source: string;
  source_url: string | null;
  posted_at: string | null;
  status: string; // 'NEW' | 'QUALIFIED' | 'APPROVED' | 'CONTACTED' | 'REPLIED' | 'INTERESTED' | 'CLOSED'
  match_score: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export type Contact = {
  id: string;
  company_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  source_url: string | null;
  confidence: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export type Outreach = {
  id: string;
  opportunity_id: string;
  contact_id: string | null;
  channel: string; // 'email' | 'whatsapp' | 'linkedin'
  subject: string | null;
  message: string | null;
  status: string; // 'draft' | 'sent' | 'replied'
  sent_at: string | null;
  replied_at: string | null;
  created_at: string;
  [key: string]: unknown;
};

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      search_runs: {
        Row: SearchRun;
        Insert: Partial<SearchRun>;
        Update: Partial<SearchRun>;
        Relationships: GenericRelationship[];
      };
      raw_search_results: {
        Row: RawSearchResult;
        Insert: Partial<RawSearchResult>;
        Update: Partial<RawSearchResult>;
        Relationships: GenericRelationship[];
      };
      companies: {
        Row: Company;
        Insert: Partial<Company>;
        Update: Partial<Company>;
        Relationships: GenericRelationship[];
      };
      opportunities: {
        Row: Opportunity;
        Insert: Partial<Opportunity>;
        Update: Partial<Opportunity>;
        Relationships: GenericRelationship[];
      };
      contacts: {
        Row: Contact;
        Insert: Partial<Contact>;
        Update: Partial<Contact>;
        Relationships: GenericRelationship[];
      };
      outreach: {
        Row: Outreach;
        Insert: Partial<Outreach>;
        Update: Partial<Outreach>;
        Relationships: GenericRelationship[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
