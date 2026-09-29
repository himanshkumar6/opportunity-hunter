import { createAdminClient } from '@/lib/supabase/server';
import type { ContactWithCompany, ContactFilterParams } from '@/types/contacts';
import type { Company, Contact, Opportunity, Outreach } from '@/types/database';
import type { PaginatedResponse } from '@/types/api';

interface ContactRow extends Contact {
  company: Company | null;
}

export async function getContacts(
  params: ContactFilterParams = {}
): Promise<PaginatedResponse<ContactWithCompany>> {
  const supabase = await createAdminClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 50) : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('contacts').select('*, company:companies(*)', { count: 'exact' });

  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,role.ilike.%${params.search}%,phone.ilike.%${params.search}%`
    );
  }

  if (params.role) {
    query = query.ilike('role', `%${params.role}%`);
  }

  if (params.confidence) {
    if (params.confidence === 'high') {
      query = query.gte('confidence', 0.7);
    } else if (params.confidence === 'medium') {
      query = query.gte('confidence', 0.4).lt('confidence', 0.7);
    } else if (params.confidence === 'low') {
      query = query.lt('confidence', 0.4);
    }
  }

  if (params.hasPhone) {
    query = query.not('phone', 'is', null).neq('phone', '');
  }

  if (params.hasEmail) {
    query = query.not('email', 'is', null).neq('email', '');
  }

  if (params.companyId) {
    query = query.eq('company_id', params.companyId);
  }

  if (params.sortBy === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (params.sortBy === 'confidence') {
    query = query.order('confidence', { ascending: false, nullsFirst: false });
  } else {
    query = query.order('name', { ascending: true, nullsFirst: false });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  const rows = (data || []) as unknown as ContactRow[];

  let items: ContactWithCompany[] = rows.map((row) => ({
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    source_url: row.source_url,
    confidence: row.confidence,
    created_at: row.created_at,
    updated_at: row.updated_at,
    company: row.company || null,
  }));

  if (params.companyName) {
    const q = params.companyName.toLowerCase();
    items = items.filter((item) => item.company?.name?.toLowerCase().includes(q));
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getContact(id: string): Promise<ContactWithCompany | null> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('contacts')
    .select('*, company:companies(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch contact details: ${error.message}`);
  }

  if (!data) return null;

  const row = data as unknown as ContactRow;

  let opportunities: Opportunity[] = [];
  if (row.company_id) {
    const { data: oppsData } = await supabase
      .from('opportunities')
      .select('*')
      .eq('company_id', row.company_id)
      .order('created_at', { ascending: false });

    opportunities = (oppsData || []) as unknown as Opportunity[];
  }

  const { data: outreachData } = await supabase
    .from('outreach')
    .select('*')
    .eq('contact_id', id)
    .order('created_at', { ascending: false });

  let lastOutreachStatus: string | null = null;
  let lastOutreachDate: string | null = null;
  const outreachList = (outreachData || []) as unknown as Outreach[];
  const outreachCount = outreachList.length;
  if (outreachList.length > 0) {
    const firstOutreach = outreachList[0];
    if (firstOutreach) {
      lastOutreachStatus = firstOutreach.status;
      lastOutreachDate = firstOutreach.sent_at || firstOutreach.created_at;
    }
  }

  return {
    id: row.id,
    company_id: row.company_id,
    name: row.name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    source_url: row.source_url,
    confidence: row.confidence,
    created_at: row.created_at,
    updated_at: row.updated_at,
    company: row.company || null,
    opportunities,
    outreach_count: outreachCount,
    last_outreach_status: lastOutreachStatus,
    last_outreach_date: lastOutreachDate,
  };
}
