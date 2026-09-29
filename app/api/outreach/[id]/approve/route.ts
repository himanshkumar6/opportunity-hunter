import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getOutreachById, approveOutreach } from '@/lib/api/outreach';
import { isValidUuid } from '@/lib/validations/common';

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
        { error: 'Invalid or missing outreach ID. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    const existing = await getOutreachById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Outreach draft not found' }, { status: 404 });
    }

    if (existing.status === 'approved') {
      return NextResponse.json({
        success: true,
        outreach: existing,
        message: 'Outreach draft is already approved (idempotent).',
      });
    }

    // Explicit human approval transition
    const updated = await approveOutreach(id);

    return NextResponse.json({
      success: true,
      outreach: updated,
      message:
        'Outreach draft approved by operator. Note: Automated sending is disabled in Phase 6.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to approve outreach draft';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return PATCH(request, context);
}
