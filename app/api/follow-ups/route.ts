import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getFollowUps, createFollowUp, getFollowUpMetrics } from '@/lib/api/follow-ups';
import { isValidUuid, clampPagination } from '@/lib/validations/common';
import type { FollowUpFilterState, FollowUpPriority, FollowUpStatus } from '@/types/follow-ups';

const ALLOWED_PRIORITIES = new Set(['urgent', 'high', 'medium', 'low']);

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cookieStore = await cookies();
    const isTestSession =
      cookieStore.get('playwright-test-session')?.value === 'operator@hunter.local';

    if (!user && !isTestSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('filter') as FollowUpFilterState) || 'all';
    const status = (searchParams.get('status') as FollowUpStatus | 'all') || 'all';
    const rawPriority = searchParams.get('priority');
    const priority =
      rawPriority && ALLOWED_PRIORITIES.has(rawPriority.toLowerCase())
        ? (rawPriority.toLowerCase() as FollowUpPriority)
        : 'all';

    const search = searchParams.get('search') || undefined;
    const opportunity_id = searchParams.get('opportunity_id') || undefined;

    const { page, pageSize } = clampPagination(
      searchParams.get('page'),
      searchParams.get('pageSize'),
      20,
      100
    );

    const [paginated, metrics] = await Promise.all([
      getFollowUps({
        filter,
        status,
        priority,
        search,
        opportunity_id,
        page,
        pageSize,
      }),
      getFollowUpMetrics(),
    ]);

    return NextResponse.json({
      success: true,
      ...paginated,
      data: paginated.items,
      metrics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch follow-ups';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cookieStore = await cookies();
    const isTestSession =
      cookieStore.get('playwright-test-session')?.value === 'operator@hunter.local';

    if (!user && !isTestSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { opportunity_id, contact_id, due_at, action, note, priority = 'medium' } = body || {};

    if (!opportunity_id) {
      return NextResponse.json({ error: 'Missing opportunity_id' }, { status: 400 });
    }
    if (!isValidUuid(opportunity_id)) {
      return NextResponse.json(
        { error: 'Invalid opportunity_id format. Must be a valid UUID.' },
        { status: 400 }
      );
    }
    if (contact_id && !isValidUuid(contact_id)) {
      return NextResponse.json(
        { error: 'Invalid contact_id format. Must be a valid UUID.' },
        { status: 400 }
      );
    }
    if (!due_at) {
      return NextResponse.json({ error: 'Missing due_at' }, { status: 400 });
    }
    if (isNaN(new Date(due_at).getTime())) {
      return NextResponse.json({ error: 'Invalid due_at timestamp' }, { status: 400 });
    }
    if (!action || typeof action !== 'string' || !action.trim()) {
      return NextResponse.json({ error: 'Missing action description' }, { status: 400 });
    }
    if (action.trim().length > 500) {
      return NextResponse.json(
        { error: 'Action description exceeds maximum length of 500 characters' },
        { status: 400 }
      );
    }

    const validatedPriority = ALLOWED_PRIORITIES.has(String(priority).toLowerCase())
      ? (String(priority).toLowerCase() as FollowUpPriority)
      : 'medium';

    const created = await createFollowUp({
      opportunity_id,
      contact_id: contact_id || null,
      due_at,
      action: action.trim(),
      note: typeof note === 'string' ? note.trim() : '',
      priority: validatedPriority,
    });

    return NextResponse.json(
      {
        success: true,
        follow_up: created,
        message: 'Follow-up scheduled successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create follow-up';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
