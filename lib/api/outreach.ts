import { createAdminClient } from '@/lib/supabase/server';
import type {
  OutreachWithRelations,
  OutreachFilterParams,
  OutreachCreateInput,
  OutreachUpdateInput,
  OutreachChannel,
  OutreachMetrics,
} from '@/types/outreach';
import type { Company, Contact, Opportunity, Outreach } from '@/types/database';
import type { PaginatedResponse } from '@/types/api';

interface OutreachRow extends Outreach {
  opportunity: (Opportunity & { company: Company | null }) | null;
  contact: Contact | null;
}

export function generateDeterministicCopy({
  opportunity,
  company,
  contact,
  channel,
}: {
  opportunity: Opportunity;
  company?: Company | null;
  contact?: Contact | null;
  channel: OutreachChannel;
}): { subject: string | null; message: string } {
  // Deterministic greeting: Never hallucinate or fabricate names.
  const hasValidContactName =
    contact?.name &&
    contact.name.trim().length > 0 &&
    !['n/a', 'unknown', 'none', 'null'].includes(contact.name.trim().toLowerCase());

  const greetingName = hasValidContactName
    ? contact!.name.trim()
    : company?.name
      ? `Team ${company.name.trim()}`
      : 'there';

  const companyName = company?.name?.trim() || 'your organization';
  const locationText = opportunity.location?.trim() || company?.location?.trim() || '';
  const industryText = company?.industry?.trim() || 'your sector';
  const isJob = opportunity.type?.toLowerCase() === 'job';

  if (channel === 'whatsapp') {
    if (isJob) {
      return {
        subject: null,
        message: `Hello ${greetingName}, I am reaching out regarding the ${opportunity.title || 'open'} position at ${companyName}. I have strong relevant experience and would appreciate connecting for a brief chat to discuss how I can contribute. Thank you!`,
      };
    }

    return {
      subject: null,
      message: `Hello ${greetingName}, I noticed ${companyName}${locationText ? ` in ${locationText}` : ''}. We help companies streamline customer acquisition and digital workflow automation. Would you be open to a quick 5-minute chat this week? Regards!`,
    };
  }

  // Channel: email
  if (isJob) {
    const subject = `Application: ${opportunity.title || 'Open Position'} - ${companyName}`;
    const message = `Hello ${greetingName},

I am writing to express my strong interest in the ${opportunity.title || 'open'} position at ${companyName}.

With demonstrated experience and a focus on high-impact execution, I would welcome the opportunity to discuss how my skill set aligns with your team's goals${locationText ? ` in ${locationText}` : ''}.

I have reviewed the role requirements and would appreciate the chance to connect for a brief 10-minute introductory conversation this week.

Thank you for your time and consideration.

Sincerely,
Candidate`;

    return { subject, message };
  }

  // Business Lead / Website Opportunity
  const subject = `Growth & digital systems inquiry for ${companyName}`;
  const message = `Hello ${greetingName},

I came across ${companyName}${locationText ? ` in ${locationText}` : ''} and was impressed by your presence in ${industryText}.

We specialize in helping businesses streamline customer acquisition, modern digital presence, and operational workflows. Given your current market footprint, I wanted to explore whether collaborating on your digital systems could create meaningful value for your team.

Would you be open to a brief 10-minute introductory conversation this week?

Best regards,
Business Development Team`;

  return { subject, message };
}

export async function getOutreachMetrics(): Promise<OutreachMetrics> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase.from('outreach').select('status');

  if (error || !data) {
    return {
      totalDrafts: 0,
      totalApproved: 0,
      totalSent: 0,
      totalReplied: 0,
      totalOutreach: 0,
    };
  }

  const rows = data as unknown as { status: string }[];
  let totalDrafts = 0;
  let totalApproved = 0;
  let totalSent = 0;
  let totalReplied = 0;

  for (const r of rows) {
    const s = (r.status || '').toLowerCase();
    if (s === 'draft') totalDrafts++;
    else if (s === 'approved') totalApproved++;
    else if (s === 'sent') totalSent++;
    else if (s === 'replied') totalReplied++;
  }

  return {
    totalDrafts,
    totalApproved,
    totalSent,
    totalReplied,
    totalOutreach: rows.length,
  };
}

export async function getOutreachList(
  params: OutreachFilterParams = {}
): Promise<PaginatedResponse<OutreachWithRelations> & { metrics: OutreachMetrics }> {
  const supabase = await createAdminClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('outreach')
      .select('*, opportunity:opportunities(*, company:companies(*)), contact:contacts(*)', {
        count: 'exact',
      });

    if (params.status && params.status !== 'all' && params.status !== 'ALL') {
      query = query.ilike('status', params.status.trim());
    }

    if (params.channel && params.channel !== 'all' && params.channel !== 'ALL') {
      query = query.ilike('channel', params.channel.trim());
    }

    if (params.opportunityId) {
      query = query.eq('opportunity_id', params.opportunityId);
    }

    query = query.order('created_at', { ascending: false });

    // If search is provided, we fetch a slightly larger window or filter
    if (params.search && params.search.trim().length > 0) {
      query = query.or(
        `subject.ilike.%${params.search.trim()}%,message.ilike.%${params.search.trim()}%`
      );
    }

    query = query.range(from, to);

    const [{ data, count, error }, metrics] = await Promise.all([query, getOutreachMetrics()]);

    if (error) {
      if (error.code === 'PGRST205') {
        return {
          items: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
          metrics: {
            totalDrafts: 0,
            totalApproved: 0,
            totalSent: 0,
            totalReplied: 0,
            totalOutreach: 0,
          },
        };
      }
      throw new Error(`Failed to fetch outreach records: ${error.message}`);
    }

    const rows = (data || []) as unknown as OutreachRow[];
    const items: OutreachWithRelations[] = rows.map((row) => ({
      id: row.id,
      opportunity_id: row.opportunity_id,
      contact_id: row.contact_id,
      channel: row.channel,
      subject: row.subject,
      message: row.message,
      status: row.status,
      sent_at: row.sent_at,
      replied_at: row.replied_at,
      created_at: row.created_at,
      opportunity: row.opportunity || null,
      contact: row.contact || null,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      metrics,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('schema cache') || message.includes('PGRST205')) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        metrics: {
          totalDrafts: 0,
          totalApproved: 0,
          totalSent: 0,
          totalReplied: 0,
          totalOutreach: 0,
        },
      };
    }
    throw err;
  }
}

export async function getOutreachById(id: string): Promise<OutreachWithRelations | null> {
  const supabase = await createAdminClient();

  try {
    const { data, error } = await supabase
      .from('outreach')
      .select('*, opportunity:opportunities(*, company:companies(*)), contact:contacts(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') return null;
      throw new Error(`Failed to fetch outreach by id: ${error.message}`);
    }

    if (!data) return null;
    const row = data as unknown as OutreachRow;

    return {
      id: row.id,
      opportunity_id: row.opportunity_id,
      contact_id: row.contact_id,
      channel: row.channel,
      subject: row.subject,
      message: row.message,
      status: row.status,
      sent_at: row.sent_at,
      replied_at: row.replied_at,
      created_at: row.created_at,
      opportunity: row.opportunity || null,
      contact: row.contact || null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('schema cache') || message.includes('PGRST205')) return null;
    throw err;
  }
}

export async function getOutreachByOpportunityId(
  opportunityId: string
): Promise<OutreachWithRelations[]> {
  const supabase = await createAdminClient();

  try {
    const { data, error } = await supabase
      .from('outreach')
      .select('*, opportunity:opportunities(*, company:companies(*)), contact:contacts(*)')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') return [];
      throw new Error(`Failed to fetch outreach for opportunity: ${error.message}`);
    }

    const rows = (data || []) as unknown as OutreachRow[];
    return rows.map((row) => ({
      id: row.id,
      opportunity_id: row.opportunity_id,
      contact_id: row.contact_id,
      channel: row.channel,
      subject: row.subject,
      message: row.message,
      status: row.status,
      sent_at: row.sent_at,
      replied_at: row.replied_at,
      created_at: row.created_at,
      opportunity: row.opportunity || null,
      contact: row.contact || null,
    }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('schema cache') || message.includes('PGRST205')) return [];
    throw err;
  }
}

/**
 * Saves or updates an outreach draft with idempotency and deduplication.
 * Prevents multiple active drafts for the same opportunity + contact + channel.
 */
export async function saveOutreachDraft(
  input: OutreachCreateInput
): Promise<OutreachWithRelations> {
  const supabase = await createAdminClient();

  if (!input.opportunity_id) {
    throw new Error('Opportunity ID is required to create an outreach draft.');
  }

  if (!input.channel || !['email', 'whatsapp'].includes(input.channel)) {
    throw new Error('Valid channel (email or whatsapp) is required.');
  }

  if (!input.message || input.message.trim().length === 0) {
    throw new Error('Outreach message body cannot be empty.');
  }

  // Check for existing draft or approved outreach for this opportunity + channel + contact
  let existingQuery = supabase
    .from('outreach')
    .select('id, status')
    .eq('opportunity_id', input.opportunity_id)
    .eq('channel', input.channel.toLowerCase())
    .in('status', ['draft', 'approved']);

  if (input.contact_id) {
    existingQuery = existingQuery.eq('contact_id', input.contact_id);
  } else {
    existingQuery = existingQuery.is('contact_id', null);
  }

  const { data: existingRows } = await existingQuery.limit(1);
  const rows = (existingRows || []) as Array<{ id: string; status: string }>;

  const builder = supabase.from('outreach') as any;

  if (rows.length > 0 && rows[0]) {
    // Update existing draft record
    const existingId = rows[0].id;
    const { data, error } = await builder
      .update({
        subject: input.channel === 'email' ? input.subject || null : null,
        message: input.message.trim(),
        contact_id: input.contact_id || null,
        status: 'draft', // Reset to draft when modified
      })
      .eq('id', existingId)
      .select('*, opportunity:opportunities(*, company:companies(*)), contact:contacts(*)')
      .single();

    if (error) {
      throw new Error(`Failed to update outreach draft: ${error.message}`);
    }

    const row = data as unknown as OutreachRow;
    return {
      id: row.id,
      opportunity_id: row.opportunity_id,
      contact_id: row.contact_id,
      channel: row.channel,
      subject: row.subject,
      message: row.message,
      status: row.status,
      sent_at: row.sent_at,
      replied_at: row.replied_at,
      created_at: row.created_at,
      opportunity: row.opportunity || null,
      contact: row.contact || null,
    };
  }

  // Insert new draft record
  const { data, error } = await builder
    .insert({
      opportunity_id: input.opportunity_id,
      contact_id: input.contact_id || null,
      channel: input.channel.toLowerCase(),
      subject: input.channel === 'email' ? input.subject || null : null,
      message: input.message.trim(),
      status: 'draft',
      created_at: new Date().toISOString(),
    })
    .select('*, opportunity:opportunities(*, company:companies(*)), contact:contacts(*)')
    .single();

  if (error) {
    throw new Error(`Failed to create outreach draft: ${error.message}`);
  }

  const row = data as unknown as OutreachRow;
  return {
    id: row.id,
    opportunity_id: row.opportunity_id,
    contact_id: row.contact_id,
    channel: row.channel,
    subject: row.subject,
    message: row.message,
    status: row.status,
    sent_at: row.sent_at,
    replied_at: row.replied_at,
    created_at: row.created_at,
    opportunity: row.opportunity || null,
    contact: row.contact || null,
  };
}

export async function updateOutreach(
  id: string,
  input: OutreachUpdateInput
): Promise<OutreachWithRelations> {
  const supabase = await createAdminClient();
  const builder = supabase.from('outreach') as any;

  const updatePayload: Record<string, unknown> = {};
  if (input.subject !== undefined) updatePayload.subject = input.subject;
  if (input.message !== undefined) updatePayload.message = input.message;
  if (input.channel !== undefined) updatePayload.channel = input.channel;
  if (input.contact_id !== undefined) updatePayload.contact_id = input.contact_id;

  const { data, error } = await builder
    .update(updatePayload)
    .eq('id', id)
    .select('*, opportunity:opportunities(*, company:companies(*)), contact:contacts(*)')
    .single();

  if (error) {
    throw new Error(`Failed to update outreach: ${error.message}`);
  }

  const row = data as unknown as OutreachRow;
  return {
    id: row.id,
    opportunity_id: row.opportunity_id,
    contact_id: row.contact_id,
    channel: row.channel,
    subject: row.subject,
    message: row.message,
    status: row.status,
    sent_at: row.sent_at,
    replied_at: row.replied_at,
    created_at: row.created_at,
    opportunity: row.opportunity || null,
    contact: row.contact || null,
  };
}

/**
 * Human Approval Endpoint:
 * Explicitly transitions a draft into approved status.
 * MANDATORY: NO AUTOMATIC SENDING OCCURS.
 */
export async function approveOutreach(id: string): Promise<OutreachWithRelations> {
  const supabase = await createAdminClient();
  const builder = supabase.from('outreach') as any;

  const { data, error } = await builder
    .update({
      status: 'approved',
    })
    .eq('id', id)
    .select('*, opportunity:opportunities(*, company:companies(*)), contact:contacts(*)')
    .single();

  if (error) {
    throw new Error(`Failed to approve outreach: ${error.message}`);
  }

  const row = data as unknown as OutreachRow;
  return {
    id: row.id,
    opportunity_id: row.opportunity_id,
    contact_id: row.contact_id,
    channel: row.channel,
    subject: row.subject,
    message: row.message,
    status: row.status,
    sent_at: row.sent_at,
    replied_at: row.replied_at,
    created_at: row.created_at,
    opportunity: row.opportunity || null,
    contact: row.contact || null,
  };
}
