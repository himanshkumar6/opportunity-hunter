import { createAdminClient } from '@/lib/supabase/server';
import type { JobItem, JobFilterParams } from '@/types/jobs';
import type { Company, Opportunity } from '@/types/database';
import type { PaginatedResponse } from '@/types/api';

interface JobRow extends Opportunity {
  company: Company | null;
}

export async function getJobs(params: JobFilterParams = {}): Promise<PaginatedResponse<JobItem>> {
  const supabase = await createAdminClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('opportunities')
      .select('*, company:companies(*)', { count: 'exact' })
      .eq('type', 'job');

    if (params.search) {
      query = query.ilike('title', `%${params.search}%`);
    }

    if (params.location) {
      query = query.ilike('location', `%${params.location}%`);
    }

    if (params.source) {
      query = query.eq('source', params.source);
    }

    if (params.status && params.status !== 'ALL' && params.status !== 'all') {
      query = query.ilike('status', params.status);
    }

    if (params.minScore !== undefined) {
      query = query.gte('match_score', params.minScore);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      if (error.code === 'PGRST205') {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    const rows = (data || []) as unknown as JobRow[];
    const items: JobItem[] = rows.map((row) => ({
      id: row.id,
      company_id: row.company_id,
      title: row.title,
      type: row.type,
      location: row.location,
      description: row.description,
      source: row.source,
      source_url: row.source_url,
      posted_at: row.posted_at,
      status: row.status,
      match_score: row.match_score,
      created_at: row.created_at,
      updated_at: row.updated_at,
      company: row.company || null,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('schema cache') || message.includes('PGRST205')) {
      return { items: [], total: 0, page, pageSize, totalPages: 0 };
    }
    throw err;
  }
}

export async function getJob(id: string): Promise<JobItem | null> {
  const supabase = await createAdminClient();

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') return null;
      throw new Error(`Failed to fetch job details: ${error.message}`);
    }

    if (!data) return null;

    const row = data as unknown as JobRow;
    return {
      id: row.id,
      company_id: row.company_id,
      title: row.title,
      type: row.type,
      location: row.location,
      description: row.description,
      source: row.source,
      source_url: row.source_url,
      posted_at: row.posted_at,
      status: row.status,
      match_score: row.match_score,
      created_at: row.created_at,
      updated_at: row.updated_at,
      company: row.company || null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('schema cache') || message.includes('PGRST205')) {
      return null;
    }
    throw err;
  }
}
