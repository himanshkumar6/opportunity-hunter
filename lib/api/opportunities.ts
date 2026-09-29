import { createAdminClient } from '@/lib/supabase/server';
import { resolveGoogleMapsUrl, sanitizeCompanyWebsite, sanitizeExternalUrl } from '@/lib/utils';
import type {
  OpportunityWithCompany,
  OpportunityFilterParams,
  OpportunityStatus,
} from '@/types/opportunities';
import type { Company, Opportunity, Contact } from '@/types/database';
import type { PaginatedResponse } from '@/types/api';

interface OpportunityRow extends Opportunity {
  company: Company | null;
}

export async function getOpportunities(
  params: OpportunityFilterParams = {}
): Promise<PaginatedResponse<OpportunityWithCompany>> {
  const supabase = await createAdminClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('opportunities')
      .select('*, company:companies(*)', { count: 'exact' });

    if (params.type && params.type !== 'all') {
      query = query.eq('type', params.type.toLowerCase());
    }

    if (params.status && params.status !== 'all' && params.status !== 'ALL') {
      query = query.ilike('status', params.status);
    }

    if (params.location && params.location.trim().length > 0) {
      query = query.ilike('location', `%${params.location.trim()}%`);
    }

    if (params.search && params.search.trim().length > 0) {
      query = query.ilike('title', `%${params.search.trim()}%`);
    }

    if (params.sortBy === 'score') {
      query = query.order('match_score', { ascending: false, nullsFirst: false });
    } else if (params.sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      if (error.code === 'PGRST205') {
        // Table not in schema cache: return graceful empty set
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      throw new Error(`Failed to fetch opportunities: ${error.message}`);
    }

    const rows = (data || []) as unknown as OpportunityRow[];
    const items: OpportunityWithCompany[] = rows.map((row) => {
      const comp = row.company || null;
      const cleanWebsite = sanitizeCompanyWebsite(comp?.website);
      const cleanCompanySourceUrl = resolveGoogleMapsUrl({
        sourceUrl: comp?.source_url,
        name: comp?.name,
        location: comp?.location,
      });
      const cleanOppSourceUrl =
        row.source === 'serpapi_maps' ||
        row.source === 'google_maps' ||
        row.type === 'business_lead' ||
        row.type === 'website_opportunity'
          ? resolveGoogleMapsUrl({
              sourceUrl: row.source_url,
              name: comp?.name || row.title,
              location: row.location || comp?.location,
            })
          : sanitizeExternalUrl(row.source_url);

      const sanitizedCompany: Company | null = comp
        ? {
            ...comp,
            website: cleanWebsite,
            source_url: cleanCompanySourceUrl,
          }
        : null;

      return {
        id: row.id,
        company_id: row.company_id,
        title: row.title,
        type: row.type,
        location: row.location,
        description: row.description,
        source: row.source,
        source_url: cleanOppSourceUrl,
        posted_at: row.posted_at,
        status: row.status,
        match_score: row.match_score,
        created_at: row.created_at,
        updated_at: row.updated_at,
        company: sanitizedCompany,
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('schema cache') || message.includes('PGRST205')) {
      return { items: [], total: 0, page, pageSize, totalPages: 0 };
    }
    throw err;
  }
}

export async function getOpportunity(id: string): Promise<OpportunityWithCompany | null> {
  const supabase = await createAdminClient();

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') return null;
      throw new Error(`Failed to fetch opportunity details: ${error.message}`);
    }

    if (!data) return null;

    const row = data as unknown as OpportunityRow;

    // Fetch related contact if company exists
    let contact: Contact | null = null;
    if (row.company_id) {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', row.company_id)
        .limit(1)
        .single();
      contact = (contactData as unknown as Contact) || null;
    }

    const comp = row.company || null;
    const cleanWebsite = sanitizeCompanyWebsite(comp?.website);
    const cleanCompanySourceUrl = resolveGoogleMapsUrl({
      sourceUrl: comp?.source_url,
      name: comp?.name,
      location: comp?.location,
    });
    const cleanOppSourceUrl =
      row.source === 'serpapi_maps' ||
      row.source === 'google_maps' ||
      row.type === 'business_lead' ||
      row.type === 'website_opportunity'
        ? resolveGoogleMapsUrl({
            sourceUrl: row.source_url,
            name: comp?.name || row.title,
            location: row.location || comp?.location,
          })
        : sanitizeExternalUrl(row.source_url);

    const sanitizedCompany: Company | null = comp
      ? {
          ...comp,
          website: cleanWebsite,
          source_url: cleanCompanySourceUrl,
        }
      : null;

    return {
      id: row.id,
      company_id: row.company_id,
      title: row.title,
      type: row.type,
      location: row.location,
      description: row.description,
      source: row.source,
      source_url: cleanOppSourceUrl,
      posted_at: row.posted_at,
      status: row.status,
      match_score: row.match_score,
      created_at: row.created_at,
      updated_at: row.updated_at,
      company: sanitizedCompany,
      contact,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('schema cache') || message.includes('PGRST205')) {
      return null;
    }
    throw err;
  }
}

export async function updateOpportunityStatus(
  id: string,
  status: OpportunityStatus
): Promise<OpportunityWithCompany> {
  const supabase = await createAdminClient();

  // Explicit Postgrest builder type cast to circumvent SSR type inference collapse on mutation
  const builder = supabase.from('opportunities') as any;
  const { data, error } = await builder
    .update({
      status: status.toLowerCase(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, company:companies(*)')
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
      throw new Error('Opportunity not found');
    }
    throw new Error(`Failed to update opportunity status: ${error.message}`);
  }

  const row = data as unknown as OpportunityRow;
  const comp = row.company || null;
  const cleanWebsite = sanitizeCompanyWebsite(comp?.website);
  const cleanCompanySourceUrl = resolveGoogleMapsUrl({
    sourceUrl: comp?.source_url,
    name: comp?.name,
    location: comp?.location,
  });
  const cleanOppSourceUrl =
    row.source === 'serpapi_maps' ||
    row.source === 'google_maps' ||
    row.type === 'business_lead' ||
    row.type === 'website_opportunity'
      ? resolveGoogleMapsUrl({
          sourceUrl: row.source_url,
          name: comp?.name || row.title,
          location: row.location || comp?.location,
        })
      : sanitizeExternalUrl(row.source_url);

  const sanitizedCompany: Company | null = comp
    ? {
        ...comp,
        website: cleanWebsite,
        source_url: cleanCompanySourceUrl,
      }
    : null;

  return {
    id: row.id,
    company_id: row.company_id,
    title: row.title,
    type: row.type,
    location: row.location,
    description: row.description,
    source: row.source,
    source_url: cleanOppSourceUrl,
    posted_at: row.posted_at,
    status: row.status,
    match_score: row.match_score,
    created_at: row.created_at,
    updated_at: row.updated_at,
    company: sanitizedCompany,
  };
}
