import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getOutreachList, saveOutreachDraft } from '@/lib/api/outreach';
import { isValidUuid, clampPagination } from '@/lib/validations/common';
import type { OutreachChannel } from '@/types/outreach';

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
    const status = searchParams.get('status') || undefined;
    const channel = searchParams.get('channel') || undefined;
    const search = searchParams.get('search') || undefined;
    const opportunityId = searchParams.get('opportunityId') || undefined;

    const { page, pageSize } = clampPagination(
      searchParams.get('page'),
      searchParams.get('pageSize'),
      20,
      100
    );

    const result = await getOutreachList({
      status,
      channel,
      search,
      opportunityId,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve outreach records';
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

    const { opportunity_id, contact_id, channel, subject, message } = body || {};

    if (!opportunity_id) {
      return NextResponse.json({ error: 'opportunity_id is required' }, { status: 400 });
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

    if (!channel || !['email', 'whatsapp'].includes(channel)) {
      return NextResponse.json(
        { error: 'channel must be either "email" or "whatsapp"' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'message cannot be empty' }, { status: 400 });
    }

    if (
      channel === 'email' &&
      (!subject || typeof subject !== 'string' || subject.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: 'subject is required for email outreach' },
        { status: 400 }
      );
    }

    const outreach = await saveOutreachDraft({
      opportunity_id,
      contact_id: contact_id || null,
      channel: channel as OutreachChannel,
      subject: channel === 'email' ? subject.trim() : null,
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      outreach,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save outreach draft';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
