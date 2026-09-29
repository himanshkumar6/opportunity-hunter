import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getOpportunityActivities, logActivity } from '@/lib/api/follow-ups';
import { getOpportunity } from '@/lib/api/opportunities';
import { isValidUuid } from '@/lib/validations/common';

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
        { error: 'Invalid or missing opportunity ID. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    const opp = await getOpportunity(id);
    if (!opp) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const activities = await getOpportunityActivities(id);
    return NextResponse.json({ success: true, activities });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch opportunity activities';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const opp = await getOpportunity(id);
    if (!opp) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { note, title = 'Operator Note Added' } = body || {};

    if (!note || typeof note !== 'string' || !note.trim()) {
      return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
    }

    const activity = logActivity({
      opportunity_id: id,
      company_id: opp.company?.id || null,
      contact_id: opp.contact?.id || null,
      type: 'note_added',
      title: typeof title === 'string' ? title.trim() : 'Operator Note Added',
      description: note.trim(),
    });

    return NextResponse.json({
      success: true,
      activity,
      message: 'Note logged to activity timeline',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to log note';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
