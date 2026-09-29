/**
 * Opportunity Hunter — Lead Hunt Shared Budget Management
 * Enforces unified SerpApi monthly usage caps across n8n and Direct Engine.
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { BudgetStatus } from './types';
import { logger } from '@/lib/logger';

export const MONTHLY_LEAD_LIMIT = 125;
export const MONTHLY_TOTAL_LIMIT = 250;

/**
 * Checks the shared monthly budget in the search_runs table.
 * Both n8n and Direct Engine record their runs in this table, ensuring
 * a single source of truth for budget accounting.
 */
export async function checkLeadHuntBudget(): Promise<BudgetStatus> {
  const supabase = await createAdminClient();
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1)).toISOString();

  const { data: rawRuns, error } = await (supabase.from('search_runs') as any)
    .select('id, source, created_at')
    .gte('created_at', startOfMonth);

  if (error) {
    logger.error('Failed to query search_runs for budget check:', { error: error.message });
    // In the event of a database query error, default to allowing if cannot verify,
    // but log a warning.
    return {
      month: monthKey,
      lead_searches_used: 0,
      lead_search_limit: MONTHLY_LEAD_LIMIT,
      lead_searches_remaining: MONTHLY_LEAD_LIMIT,
      total_searches_used: 0,
      total_search_limit: MONTHLY_TOTAL_LIMIT,
      total_searches_remaining: MONTHLY_TOTAL_LIMIT,
      allowed: true,
    };
  }

  const runs = (rawRuns || []) as Array<{ id: string; source?: string; created_at?: string }>;
  let leadSearches = 0;
  let totalSearches = 0;

  for (const item of runs) {
    totalSearches++;
    if (item.source === 'serpapi_maps' || item.source === 'serpapi_leads') {
      leadSearches++;
    }
  }

  const remainingLeadSearches = Math.max(0, MONTHLY_LEAD_LIMIT - leadSearches);
  const remainingTotalSearches = Math.max(0, MONTHLY_TOTAL_LIMIT - totalSearches);

  const allowed = remainingLeadSearches > 0 && remainingTotalSearches > 0;
  let reason: string | undefined;

  if (remainingLeadSearches <= 0) {
    reason = `Monthly Lead Hunt search limit (${MONTHLY_LEAD_LIMIT}) has been reached for ${monthKey}.`;
  } else if (remainingTotalSearches <= 0) {
    reason = `Monthly total SerpApi search limit (${MONTHLY_TOTAL_LIMIT}) has been reached for ${monthKey}.`;
  }

  return {
    month: monthKey,
    lead_searches_used: leadSearches,
    lead_search_limit: MONTHLY_LEAD_LIMIT,
    lead_searches_remaining: remainingLeadSearches,
    total_searches_used: totalSearches,
    total_search_limit: MONTHLY_TOTAL_LIMIT,
    total_searches_remaining: remainingTotalSearches,
    allowed,
    reason,
  };
}
