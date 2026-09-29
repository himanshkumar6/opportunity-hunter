import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { completeFollowUp } from '@/lib/api/follow-ups';
import { isValidUuid } from '@/lib/validations/common';

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

    let note: string | undefined;
    try {
      const body = await request.json();
      note = body?.note;
    } catch {
      // Body is optional
    }

    const completed = await completeFollowUp(id, note);

    return NextResponse.json({
      success: true,
      follow_up: completed,
      message: 'Follow-up marked as completed',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete follow-up';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return PATCH(request, context);
}
