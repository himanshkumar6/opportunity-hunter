import { createAdminClient } from '@/lib/supabase/server';
import { sanitizeCompanyWebsite, resolveGoogleMapsUrl } from '@/lib/utils';
import type {
  CompanyWithStats,
  CompanyWithRelations,
  CompanyFilterParams,
} from '@/types/companies';
import type { Company, Opportunity, Contact, Outreach } from '@/types/database';
import type { PaginatedResponse } from '@/types/api';

interface SupabaseCompanyRow {
  id: string;
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
  description: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  opportunities?: { count: number }[];
  contacts?: { count: number }[];
}

export async function getCompanies(
  params: CompanyFilterParams = {}
): Promise<PaginatedResponse<CompanyWithStats>> {
  const supabase = await createAdminClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 50) : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('companies')
    .select('*, opportunities(count), contacts(count)', { count: 'exact' });

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  if (params.industry) {
    query = query.ilike('industry', `%${params.industry}%`);
  }

  if (params.location) {
    query = query.ilike('location', `%${params.location}%`);
  }

  if (params.sortBy === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (params.sortBy === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    // Default sort by name
    query = query.order('name', { ascending: true });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  const rows = (data || []) as unknown as SupabaseCompanyRow[];
  const items: CompanyWithStats[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    website: sanitizeCompanyWebsite(row.website),
    location: row.location,
    industry: row.industry,
    description: row.description,
    source_url: resolveGoogleMapsUrl({
      sourceUrl: row.source_url,
      name: row.name,
      location: row.location,
    }),
    created_at: row.created_at,
    updated_at: row.updated_at,
    opportunities_count: row.opportunities?.[0]?.count ?? 0,
    contacts_count: row.contacts?.[0]?.count ?? 0,
  }));

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

export async function getCompany(id: string): Promise<CompanyWithRelations | null> {
  const supabase = await createAdminClient();

  const { data: companyData, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch company details: ${error.message}`);
  }

  if (!companyData) return null;

  const [oppsRes, contactsRes] = await Promise.all([
    supabase
      .from('opportunities')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contacts')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const opportunities = (oppsRes.data || []) as unknown as Opportunity[];
  const contacts = (contactsRes.data || []) as unknown as Contact[];

  let outreachCount = 0;
  let lastOutreachStatus: string | null = null;
  let lastOutreachDate: string | null = null;

  const contactIds = contacts.map((c) => c.id).filter(Boolean);
  const oppIds = opportunities.map((o) => o.id).filter(Boolean);

  if (contactIds.length > 0 || oppIds.length > 0) {
    let outreachQuery = supabase.from('outreach').select('*');
    if (contactIds.length > 0 && oppIds.length > 0) {
      outreachQuery = outreachQuery.or(
        `contact_id.in.(${contactIds.join(',')}),opportunity_id.in.(${oppIds.join(',')})`
      );
    } else if (contactIds.length > 0) {
      outreachQuery = outreachQuery.in('contact_id', contactIds);
    } else {
      outreachQuery = outreachQuery.in('opportunity_id', oppIds);
    }

    const { data: outreachData } = await outreachQuery.order('created_at', { ascending: false });
    const outreachList = (outreachData || []) as unknown as Outreach[];
    if (outreachList.length > 0) {
      outreachCount = outreachList.length;
      const firstOutreach = outreachList[0];
      if (firstOutreach) {
        lastOutreachStatus = firstOutreach.status;
        lastOutreachDate = firstOutreach.sent_at || firstOutreach.created_at;
      }
    }
  }

  const company = companyData as unknown as Company;

  return {
    ...company,
    website: sanitizeCompanyWebsite(company.website),
    source_url: resolveGoogleMapsUrl({
      sourceUrl: company.source_url,
      name: company.name,
      location: company.location,
    }),
    opportunities,
    contacts,
    opportunities_count: opportunities.length,
    contacts_count: contacts.length,
    outreach_count: outreachCount,
    last_outreach_status: lastOutreachStatus,
    last_outreach_date: lastOutreachDate,
  };
}
