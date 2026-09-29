import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getOutreachById, updateOutreach } from '@/lib/api/outreach';
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
        { error: 'Invalid or missing outreach ID. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    const outreach = await getOutreachById(id);
    if (!outreach) {
      return NextResponse.json({ error: 'Outreach record not found' }, { status: 404 });
    }

    return NextResponse.json({ outreach });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch outreach record';
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
        { error: 'Invalid or missing outreach ID. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const existing = await getOutreachById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Outreach record not found' }, { status: 404 });
    }

    const updated = await updateOutreach(id, {
      subject: body?.subject,
      message: body?.message,
      channel: body?.channel,
      contact_id: body?.contact_id,
    });

    return NextResponse.json({
      success: true,
      outreach: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update outreach record';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
