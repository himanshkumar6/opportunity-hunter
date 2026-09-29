import { createAdminClient } from '@/lib/supabase/server';
import { sanitizeCompanyWebsite, resolveGoogleMapsUrl } from '@/lib/utils';
import type { LeadItem, LeadFilterParams } from '@/types/leads';

import type { Company, Contact, Opportunity } from '@/types/database';
import type { PaginatedResponse } from '@/types/api';

interface LeadRow extends Opportunity {
  company: Company | null;
}

export async function getLeads(
  params: LeadFilterParams = {}
): Promise<PaginatedResponse<LeadItem>> {
  const supabase = await createAdminClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('opportunities')
      .select('*, company:companies(*)', { count: 'exact' })
      .neq('type', 'job');

    if (params.search) {
      query = query.ilike('title', `%${params.search}%`);
    }

    if (params.location) {
      query = query.ilike('location', `%${params.location}%`);
    }

    if (params.status && params.status !== 'ALL' && params.status !== 'all') {
      query = query.ilike('status', params.status);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      if (error.code === 'PGRST205') {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }

    const rows = (data || []) as unknown as LeadRow[];
    const items: LeadItem[] = rows.map((row) => {
      const comp = row.company || null;
      const score = row.match_score ?? 0;

      const cleanWebsite = sanitizeCompanyWebsite(comp?.website);
      const cleanCompanySourceUrl = resolveGoogleMapsUrl({
        sourceUrl: comp?.source_url,
        name: comp?.name,
        location: comp?.location,
      });
      const cleanLeadSourceUrl = resolveGoogleMapsUrl({
        sourceUrl: row.source_url,
        name: comp?.name || row.title,
        location: row.location || comp?.location,
      });

      const sanitizedCompany: Company | null = comp
        ? {
            ...comp,
            website: cleanWebsite,
            source_url: cleanCompanySourceUrl,
          }
        : null;

      const hasWebsite = Boolean(cleanWebsite && cleanWebsite.trim().length > 0);
      const websiteStatus: 'found' | 'missing' | 'unknown' = comp
        ? hasWebsite
          ? 'found'
          : 'missing'
        : 'unknown';

      const priority: 'high' | 'medium' | 'low' =
        score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';

      const reasons: string[] = [];
      if (!hasWebsite) reasons.push('No functional website found');
      if (score >= 75) reasons.push('Strong growth & outreach potential');
      if (comp?.location) reasons.push(`Verified location in ${comp.location}`);

      return {
        id: row.id,
        company_id: row.company_id,
        title: row.title,
        type: row.type,
        location: row.location,
        description: row.description,
        source: row.source,
        source_url: cleanLeadSourceUrl,
        posted_at: row.posted_at,
        status: row.status,
        match_score: row.match_score,
        created_at: row.created_at,
        updated_at: row.updated_at,
        company: sanitizedCompany,
        website_status: websiteStatus,
        seo_opportunity: !hasWebsite || (row.description?.toLowerCase().includes('seo') ?? false),
        social_opportunity: row.description?.toLowerCase().includes('social') ?? false,
        priority,
        reasons,
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

export async function getLead(id: string): Promise<LeadItem | null> {
  const supabase = await createAdminClient();

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') return null;
      throw new Error(`Failed to fetch lead details: ${error.message}`);
    }

    if (!data) return null;

    const row = data as unknown as LeadRow;
    const comp = row.company || null;

    let contactsList: Contact[] = [];
    if (comp?.id) {
      try {
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('*')
          .eq('company_id', comp.id);
        contactsList = (contactsData || []) as Contact[];
      } catch {
        contactsList = [];
      }
    }

    const score = row.match_score ?? 0;
    const cleanWebsite = sanitizeCompanyWebsite(comp?.website);
    const cleanCompanySourceUrl = resolveGoogleMapsUrl({
      sourceUrl: comp?.source_url,
      name: comp?.name,
      location: comp?.location,
    });
    const cleanLeadSourceUrl = resolveGoogleMapsUrl({
      sourceUrl: row.source_url,
      name: comp?.name || row.title,
      location: row.location || comp?.location,
    });

    const sanitizedCompany: Company | null = comp
      ? {
          ...comp,
          website: cleanWebsite,
          source_url: cleanCompanySourceUrl,
        }
      : null;

    const hasWebsite = Boolean(cleanWebsite && cleanWebsite.trim().length > 0);
    const websiteStatus: 'found' | 'missing' | 'unknown' = comp
      ? hasWebsite
        ? 'found'
        : 'missing'
      : 'unknown';

    const priority: 'high' | 'medium' | 'low' =
      score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';

    const reasons: string[] = [];
    if (!hasWebsite) reasons.push('No website detected — prime candidate for web development');
    if (contactsList.some((c) => c.phone || c.whatsapp))
      reasons.push('Direct phone / WhatsApp contact available');
    if (contactsList.some((c) => c.email)) reasons.push('Direct email contact verified');
    if (score >= 80) reasons.push('High qualification match score based on market gap');

    return {
      id: row.id,
      company_id: row.company_id,
      title: row.title,
      type: row.type,
      location: row.location,
      description: row.description,
      source: row.source,
      source_url: cleanLeadSourceUrl,
      posted_at: row.posted_at,
      status: row.status,
      match_score: row.match_score,
      created_at: row.created_at,
      updated_at: row.updated_at,
      company: sanitizedCompany,
      contacts: contactsList,
      website_status: websiteStatus,
      seo_opportunity: !hasWebsite || (row.description?.toLowerCase().includes('seo') ?? false),
      social_opportunity: row.description?.toLowerCase().includes('social') ?? false,
      priority,
      reasons,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('schema cache') || message.includes('PGRST205')) {
      return null;
    }
    throw err;
  }
}
