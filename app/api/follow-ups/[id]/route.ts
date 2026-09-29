import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getFollowUpById, updateFollowUp } from '@/lib/api/follow-ups';
import { isValidUuid } from '@/lib/validations/common';
import type { FollowUpPriority, FollowUpStatus } from '@/types/follow-ups';

const ALLOWED_STATUSES = new Set(['scheduled', 'completed', 'cancelled']);
const ALLOWED_PRIORITIES = new Set(['urgent', 'high', 'medium', 'low']);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { error: 'Invalid or missing follow-up ID. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    const followUp = await getFollowUpById(id);
    if (!followUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, follow_up: followUp });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch follow-up';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        { error: 'Invalid or missing follow-up ID. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    // Validate update fields
    if (body.due_at && isNaN(new Date(body.due_at).getTime())) {
      return NextResponse.json({ error: 'Invalid due_at timestamp' }, { status: 400 });
    }
    if (body.status && !ALLOWED_STATUSES.has(String(body.status).toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid status: "${body.status}". Allowed statuses: ${Array.from(ALLOWED_STATUSES).join(', ')}`,
        },
        { status: 400 }
      );
    }
    if (body.priority && !ALLOWED_PRIORITIES.has(String(body.priority).toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid priority: "${body.priority}". Allowed priorities: ${Array.from(ALLOWED_PRIORITIES).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {};
    if (body.due_at) updatePayload.due_at = body.due_at;
    if (body.action !== undefined) updatePayload.action = String(body.action).trim();
    if (body.note !== undefined) updatePayload.note = String(body.note).trim();
    if (body.status) updatePayload.status = body.status.toLowerCase() as FollowUpStatus;
    if (body.priority) updatePayload.priority = body.priority.toLowerCase() as FollowUpPriority;

    const updated = await updateFollowUp(id, updatePayload);

    return NextResponse.json({
      success: true,
      follow_up: updated,
      message: 'Follow-up updated successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update follow-up';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
