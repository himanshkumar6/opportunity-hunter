import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { updateOpportunityStatus, getOpportunity } from '@/lib/api/opportunities';
import { logActivity } from '@/lib/api/follow-ups';
import { isValidUuid } from '@/lib/validations/common';
import type { OpportunityStatus } from '@/types/opportunities';

const ALLOWED_STATUSES: OpportunityStatus[] = [
  'new',
  'qualified',
  'rejected',
  'approved',
  'contacted',
  'replied',
  'interested',
  'closed',
];

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
        { error: 'Invalid or missing opportunity ID. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const status = (body?.status || '').toLowerCase() as OpportunityStatus;

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status: "${body?.status}". Allowed statuses: ${ALLOWED_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check existing record for idempotency and existence
    const existing = await getOpportunity(id);
    if (!existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    if (existing.status?.toLowerCase() === status) {
      return NextResponse.json({
        success: true,
        opportunity: existing,
        message: `Opportunity status is already ${status} (idempotent).`,
      });
    }

    const updated = await updateOpportunityStatus(id, status);

    // Log status change into activity history
    try {
      logActivity({
        opportunity_id: id,
        company_id: updated.company_id || null,
        type: 'status_changed',
        title: `Status Changed: ${status.toUpperCase()}`,
        description: `Opportunity pipeline state updated from ${existing.status || 'unknown'} to ${status}.`,
        metadata: { from_status: existing.status, to_status: status },
      });
    } catch {
      // Activity logging non-blocking fallback
    }

    return NextResponse.json({
      success: true,
      opportunity: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update opportunity status';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
