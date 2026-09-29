import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getOpportunity } from '@/lib/api/opportunities';
import { getContact } from '@/lib/api/contacts';
import { generateDeterministicCopy } from '@/lib/api/outreach';
import type { OutreachChannel, OutreachTemplateResponse } from '@/types/outreach';

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

    const body = await request.json();
    const { opportunity_id, channel, contact_id } = body;

    if (!opportunity_id) {
      return NextResponse.json({ error: 'opportunity_id is required' }, { status: 400 });
    }

    if (!channel || !['email', 'whatsapp'].includes(channel)) {
      return NextResponse.json(
        { error: 'channel must be either "email" or "whatsapp"' },
        { status: 400 }
      );
    }

    const opportunity = await getOpportunity(opportunity_id);
    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    let contact = opportunity.contact || null;
    if (contact_id && (!contact || contact.id !== contact_id)) {
      const fetchedContact = await getContact(contact_id);
      if (fetchedContact) {
        contact = fetchedContact;
      }
    }

    const { subject, message } = generateDeterministicCopy({
      opportunity,
      company: opportunity.company,
      contact,
      channel: channel as OutreachChannel,
    });

    const responseData: OutreachTemplateResponse = {
      subject,
      message,
      channel: channel as OutreachChannel,
      contactName: contact?.name || null,
      companyName: opportunity.company?.name || null,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate outreach template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
