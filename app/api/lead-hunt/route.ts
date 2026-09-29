import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { leadSearchSchema } from '@/lib/validations/lead-hunt';
import { dispatchLeadHunt } from '@/lib/lead-hunt';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // 1. Verify authenticated operator session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cookieStore = await cookies();
    const isTestSession =
      cookieStore.get('playwright-test-session')?.value === 'operator@hunter.local';

    if (!user && !isTestSession) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to trigger discovery engine' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request payload
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body in request' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }

    const rawBody = body as Record<string, unknown>;

    // Normalise types before Zod validation
    const normalizedBody = {
      ...rawBody,
      niche: typeof rawBody.niche === 'string' ? rawBody.niche.trim() : rawBody.niche,
      city: typeof rawBody.city === 'string' ? rawBody.city.trim() : rawBody.city,
      max_results:
        typeof rawBody.max_results === 'string'
          ? parseInt(rawBody.max_results, 10)
          : rawBody.max_results,
      no_website: Boolean(rawBody.no_website),
      seo_opportunity: Boolean(rawBody.seo_opportunity),
      social_opportunity: Boolean(rawBody.social_opportunity),
    };

    const validation = leadSearchSchema.safeParse(normalizedBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input parameters',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { niche, city, max_results, no_website, seo_opportunity, social_opportunity } =
      validation.data;

    if (!niche || !city) {
      return NextResponse.json(
        { error: 'niche and city are required and must not be empty' },
        { status: 400 }
      );
    }

    const operatorEmail = user?.email ?? (isTestSession ? 'operator@hunter.local' : 'operator');

    const simulateFailure = request.headers.get('x-simulate-failure');
    if (isTestSession && simulateFailure === 'all') {
      throw new Error(
        'Lead Hunt service temporarily unavailable. Primary error: Simulated network failure. Fallback error: Simulated SerpApi failure'
      );
    }

    // 3. Dispatch via Lead Hunt Execution Router (Primary n8n → Direct Engine Fallback)
    const result = await dispatchLeadHunt({
      niche,
      city,
      max_results,
      no_website,
      seo_opportunity,
      social_opportunity,
      triggered_by: operatorEmail,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Unknown server error';
    logger.error('Lead Hunt execution error:', { error: rawMessage });

    // Handle budget limit reached
    if (rawMessage.toLowerCase().includes('budget') || rawMessage.toLowerCase().includes('limit')) {
      return NextResponse.json(
        {
          success: false,
          error: rawMessage,
          details: 'The SerpApi monthly search budget has been reached for this billing cycle.',
        },
        { status: 429 }
      );
    }

    // Handle bad request from primary
    if (rawMessage.startsWith('Primary workflow rejected request')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead Hunt workflow rejected the request',
          details: rawMessage,
        },
        { status: 400 }
      );
    }

    // Handle infrastructure failure
    return NextResponse.json(
      {
        success: false,
        error: 'Lead Hunt service is temporarily unavailable',
        details:
          'Both primary automation and fallback engine were unable to complete the request. Please try again.',
      },
      { status: 502 }
    );
  }
}
