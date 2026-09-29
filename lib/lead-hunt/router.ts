/**
 * Opportunity Hunter — Lead Hunt Execution Router
 * Manages Primary (n8n Webhook) and Fallback (Direct Engine) routing with zero duplicate risk.
 */

import type { LeadHuntExecutionResult, LeadHuntInput } from './types';
import { checkLeadHuntBudget } from './budget';
import { executeDirectLeadHunt } from './engine';
import { logger } from '@/lib/logger';

const N8N_TIMEOUT_MS = 6_000; // 6s timeout for primary n8n acknowledgment

export interface RouterDispatchOptions {
  forceEngine?: 'n8n' | 'direct';
}

/**
 * Dispatches Lead Hunt request through the Primary (n8n) or Fallback (Direct Engine).
 */
export async function dispatchLeadHunt(
  input: LeadHuntInput,
  options?: RouterDispatchOptions
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

  // 1. Unified Budget Check
  const budget = await checkLeadHuntBudget();
  if (!budget.allowed) {
    logger.warn('Lead Hunt rejected due to monthly search budget cap:', {
      month: budget.month,
      lead_searches_used: budget.lead_searches_used,
      total_searches_used: budget.total_searches_used,
      reason: budget.reason,
    });
    throw new Error(budget.reason || 'SerpApi monthly search budget limit reached');
  }

  // Allow explicit engine override for testing or manual maintenance
  const forced = options?.forceEngine || process.env.LEAD_HUNT_FORCE_ENGINE;
  if (forced === 'direct') {
    logger.info('Lead Hunt explicitly executing via Direct Fallback engine');
    const directResult = await executeDirectLeadHunt(input);
    return {
      ...directResult,
      fallback_triggered: false,
    };
  }

  const webhookUrl = process.env.N8N_LEAD_HUNT_WEBHOOK_URL;

  // 2. Attempt PRIMARY: n8n Webhook
  let n8nFailureReason: string | null = null;

  if (!webhookUrl || webhookUrl.trim() === '' || webhookUrl === 'disabled') {
    n8nFailureReason = 'N8N_LEAD_HUNT_WEBHOOK_URL is not configured';
  } else {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (process.env.N8N_WEBHOOK_SECRET) {
        headers['X-Webhook-Secret'] = process.env.N8N_WEBHOOK_SECRET;
      }

      const payload = {
        niche: niche.trim(),
        city: city.trim(),
        max_results,
        no_website,
        seo_opportunity,
        social_opportunity,
        triggered_by,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        // Primary succeeded! n8n accepted the workflow execution
        return {
          success: true,
          engine: 'n8n',
          message: 'Lead Hunt workflow dispatched successfully via primary engine',
          details: 'The n8n automation pipeline is executing asynchronously.',
          query: { niche, city, max_results },
          filters: { no_website, seo_opportunity, social_opportunity },
          triggeredAt: new Date().toISOString(),
          triggeredBy: triggered_by,
        };
      }

      // Check if it's a client error (4xx other than 404)
      if (response.status >= 400 && response.status < 500 && response.status !== 404) {
        let errBody = '';
        try {
          errBody = await response.text();
        } catch {
          errBody = 'Bad request';
        }
        // Client validation error: do NOT fallback
        throw new Error(`Primary workflow rejected request: ${errBody.slice(0, 200)}`);
      }

      // 404 (webhook missing) or 5xx (server failure) -> Trigger Fallback
      n8nFailureReason = `n8n webhook returned HTTP ${response.status}`;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith('Primary workflow rejected request')) {
        // Business / validation rejection — rethrow without falling back
        throw err;
      }

      const isAbort =
        err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort'));
      if (isAbort) {
        n8nFailureReason = `n8n webhook connection timed out after ${N8N_TIMEOUT_MS}ms`;
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        n8nFailureReason = `n8n infrastructure failure: ${msg}`;
      }
    }
  }

  // If forced to n8n only, do not fallback
  if (forced === 'n8n') {
    throw new Error(`Primary n8n engine failed: ${n8nFailureReason}`);
  }

  // 3. FALLBACK: Direct Next.js Lead Hunt Engine
  logger.warn('Primary n8n execution failed; initiating Direct Lead Hunt Fallback:', {
    reason: n8nFailureReason,
    niche,
    city,
  });

  try {
    const directResult = await executeDirectLeadHunt(input);

    return {
      ...directResult,
      fallback_triggered: true,
      fallback_reason: n8nFailureReason || 'Primary engine failure',
      message: 'Lead Hunt completed successfully via Direct Fallback engine',
    };
  } catch (fallbackError) {
    const fallbackMsg =
      fallbackError instanceof Error ? fallbackError.message : 'Direct Engine execution failed';
    logger.error('Both Primary (n8n) and Fallback (Direct Engine) failed:', {
      primaryFailure: n8nFailureReason,
      fallbackFailure: fallbackMsg,
    });
    throw new Error(
      `Lead Hunt service temporarily unavailable. Primary error: ${n8nFailureReason || 'unknown'}. Fallback error: ${fallbackMsg}`
    );
  }
}
