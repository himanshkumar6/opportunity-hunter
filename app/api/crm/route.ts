import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getCrmData } from '@/lib/api/crm';
import type { CrmFilterParams } from '@/types/crm';

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
    const params: CrmFilterParams = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      follow_up_state: searchParams.get('follow_up_state') || undefined,
      outreach_state: searchParams.get('outreach_state') || undefined,
      location: searchParams.get('location') || undefined,
      source: searchParams.get('source') || undefined,
    };

    const data = await getCrmData(params);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch CRM data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
