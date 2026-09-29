/**
 * Opportunity Hunter — Direct Next.js Lead Hunt Engine
 * Standalone, production-ready fallback engine capable of executing independently of n8n.
 */

import type { LeadHuntExecutionResult, LeadHuntInput } from './types';
import { checkLeadHuntBudget } from './budget';
import { fetchSerpApiGoogleMaps } from './serpapi';
import { processAndDeduplicateLeads } from './dedupe';
import {
  createSearchRun,
  loadDeduplicationContext,
  persistLeadBatch,
  updateSearchRun,
} from './persistence';
import { logger } from '@/lib/logger';

export async function executeDirectLeadHunt(
  input: LeadHuntInput
): Promise<LeadHuntExecutionResult> {
  const {
    niche,
    city,
    max_results,
    no_website,
    seo_opportunity,
    social_opportunity,
    triggered_by,
  } = input;
  const query = `${niche.trim()} businesses`;
  const location = city.trim();

  // 1. Shared Budget Enforcement
  const budget = await checkLeadHuntBudget();
  if (!budget.allowed) {
    logger.warn('Direct Lead Hunt aborted due to budget cap:', {
      month: budget.month,
      lead_searches_used: budget.lead_searches_used,
      total_searches_used: budget.total_searches_used,
      reason: budget.reason,
    });
    throw new Error(budget.reason || 'SerpApi monthly search budget exceeded');
  }

  // 2. Initialize Search Run
  const searchRun = await createSearchRun(query, location, 'serpapi_maps');
  const searchRunId = searchRun.id;

  try {
    // 3. Query SerpApi Google Maps with budget-conserving pagination
    const rawBusinesses = await fetchSerpApiGoogleMaps({
      query,
      location,
      max_results,
    });

    if (rawBusinesses.length === 0) {
      await updateSearchRun(searchRunId, 'completed', 0);
      return {
        success: true,
        engine: 'direct',
        search_run_id: searchRunId,
        results_count: 0,
        companies_created: 0,
        contacts_created: 0,
        opportunities_created: 0,
        message: 'Direct Lead Hunt engine completed with zero results found for query',
        query: { niche, city, max_results },
        filters: { no_website, seo_opportunity, social_opportunity },
        triggeredAt: new Date().toISOString(),
        triggeredBy: triggered_by,
      };
    }

    // 4. Load Database Context for Deduplication
    const context = await loadDeduplicationContext();

    // 5. Deduplicate and Qualify Leads
    const dedupeResult = processAndDeduplicateLeads(rawBusinesses, input, searchRunId, context);

    // 6. Relational Persistence
    const persistStats = await persistLeadBatch(searchRunId, dedupeResult);

    // 7. Update Search Run to Completed
    await updateSearchRun(searchRunId, 'completed', dedupeResult.qualifiedLeads.length);

    logger.info('Direct Lead Hunt engine successfully finished run:', {
      searchRunId,
      rawCount: persistStats.rawCount,
      qualifiedCount: dedupeResult.qualifiedLeads.length,
      companiesCount: persistStats.companiesCount,
      contactsCount: persistStats.contactsCount,
      opportunitiesCount: persistStats.opportunitiesCount,
    });

    return {
      success: true,
      engine: 'direct',
      search_run_id: searchRunId,
      results_count: dedupeResult.qualifiedLeads.length,
      companies_created: persistStats.companiesCount,
      contacts_created: persistStats.contactsCount,
      opportunities_created: persistStats.opportunitiesCount,
      message: 'Direct Lead Hunt engine completed successfully',
      details: `Discovered and qualified ${dedupeResult.qualifiedLeads.length} leads in ${location}.`,
      query: { niche, city, max_results },
      filters: { no_website, seo_opportunity, social_opportunity },
      triggeredAt: new Date().toISOString(),
      triggeredBy: triggered_by,
    };
  } catch (error) {
    // Record failed run on error
    await updateSearchRun(searchRunId, 'failed', 0);
    const message = error instanceof Error ? error.message : 'Unknown execution failure';
    logger.error('Direct Lead Hunt engine failed during execution:', {
      searchRunId,
      error: message,
    });
    throw error;
  }
}
