/**
 * Opportunity Hunter — Lead Hunt Database Persistence
 * Atomic, relational persistence into Supabase PostgreSQL.
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Company, Contact, Opportunity, SearchRun } from '@/types/database';
import type { DeduplicationContext, DeduplicationResult } from './dedupe';
import { logger } from '@/lib/logger';

/**
 * Creates an initial search run with 'running' status.
 */
export async function createSearchRun(
  query: string,
  location: string,
  source = 'serpapi_maps'
): Promise<SearchRun> {
  const supabase = await createAdminClient();

  const { data, error } = await (supabase.from('search_runs') as any)
    .insert({
      query,
      location,
      source,
      status: 'running',
      results_count: 0,
    })
    .select('*')
    .single();

  if (error || !data) {
    logger.error('Failed to create search_run record:', { error: error?.message, query, location });
    throw new Error(`Failed to create search_run: ${error?.message || 'Database error'}`);
  }

  return data as SearchRun;
}

/**
 * Updates search run final status and result count.
 */
export async function updateSearchRun(
  searchRunId: string,
  status: 'completed' | 'failed',
  resultsCount: number
): Promise<void> {
  const supabase = await createAdminClient();

  const { error } = await (supabase.from('search_runs') as any)
    .update({
      status,
      results_count: resultsCount,
    })
    .eq('id', searchRunId);

  if (error) {
    logger.error('Failed to update search_run status:', {
      error: error.message,
      searchRunId,
      status,
    });
  }
}

/**
 * Loads existing companies, contacts, and opportunities for relational deduplication.
 */
export async function loadDeduplicationContext(): Promise<DeduplicationContext> {
  const supabase = await createAdminClient();

  const [companiesRes, contactsRes, oppsRes] = await Promise.all([
    supabase.from('companies').select('id, name, website, location, industry, source_url'),
    supabase
      .from('contacts')
      .select('id, company_id, name, role, email, phone, whatsapp, source_url, confidence'),
    supabase
      .from('opportunities')
      .select(
        'id, company_id, title, type, location, description, source, source_url, status, match_score'
      ),
  ]);

  return {
    existingCompanies: (companiesRes.data || []) as Company[],
    existingContacts: (contactsRes.data || []) as Contact[],
    existingOpportunities: (oppsRes.data || []) as Opportunity[],
  };
}

/**
 * Persists evaluated lead batches (raw results, new companies, contacts, opportunities)
 * in safe relational sequence.
 */
export async function persistLeadBatch(
  searchRunId: string,
  dedupeResult: DeduplicationResult
): Promise<{
  rawCount: number;
  companiesCount: number;
  contactsCount: number;
  opportunitiesCount: number;
}> {
  const supabase = await createAdminClient();
  const { sanitizedRawResults, newCompanies, newContacts, newOpportunities } = dedupeResult;

  // 1. Persist raw search results (with sanitized URLs)
  if (sanitizedRawResults.length > 0) {
    const rawToInsert = sanitizedRawResults.map((r) => ({
      search_run_id: r.search_run_id,
      title: r.title,
      url: r.url || r.google_maps_url || '',
      snippet: r.snippet || '',
      position: r.position,
      raw_data: {
        ...r.raw_data,
        google_maps_url: r.google_maps_url,
      },
    }));

    const { error: rawError } = await (supabase.from('raw_search_results') as any).insert(
      rawToInsert
    );

    if (rawError) {
      logger.error('Failed to persist raw_search_results:', {
        error: rawError.message,
        searchRunId,
      });
    }
  }

  // 2. Persist new companies
  if (newCompanies.length > 0) {
    const { error: compError } = await (supabase.from('companies') as any).insert(newCompanies);

    if (compError) {
      logger.error('Failed to persist new companies:', { error: compError.message });
      throw new Error(`Failed to persist companies: ${compError.message}`);
    }
  }

  // 3. Persist new contacts
  if (newContacts.length > 0) {
    const { error: contactError } = await (supabase.from('contacts') as any).insert(newContacts);

    if (contactError) {
      logger.error('Failed to persist new contacts:', { error: contactError.message });
      throw new Error(`Failed to persist contacts: ${contactError.message}`);
    }
  }

  // 4. Persist new opportunities
  if (newOpportunities.length > 0) {
    const { error: oppError } = await (supabase.from('opportunities') as any).insert(
      newOpportunities
    );

    if (oppError) {
      logger.error('Failed to persist new opportunities:', { error: oppError.message });
      throw new Error(`Failed to persist opportunities: ${oppError.message}`);
    }
  }

  return {
    rawCount: sanitizedRawResults.length,
    companiesCount: newCompanies.length,
    contactsCount: newContacts.length,
    opportunitiesCount: newOpportunities.length,
  };
}
