import { createAdminClient } from '@/lib/supabase/server';
import type { SearchRun, RawSearchResult } from '@/types/database';
import type { PaginatedResponse } from '@/types/api';

export interface SearchRunFilterParams {
  source?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchRunWithResults extends SearchRun {
  raw_results?: RawSearchResult[];
}

export async function getSearchRuns(
  params: SearchRunFilterParams = {}
): Promise<PaginatedResponse<SearchRun>> {
  const supabase = await createAdminClient();
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase.from('search_runs').select('*', { count: 'exact' });

    if (params.source) {
      query = query.eq('source', params.source);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      if (error.code === 'PGRST205') {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      throw new Error(`Failed to fetch search runs: ${error.message}`);
    }

    const items = (data || []) as unknown as SearchRun[];
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

export async function getSearchRun(id: string): Promise<SearchRunWithResults | null> {
  const supabase = await createAdminClient();

  try {
    const { data: runData, error } = await supabase
      .from('search_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') return null;
      throw new Error(`Failed to fetch search run: ${error.message}`);
    }

    if (!runData) return null;

    let rawResults: RawSearchResult[] = [];
    try {
      const { data: rawData } = await supabase
        .from('raw_search_results')
        .select('*')
        .eq('search_run_id', id);
      rawResults = (((rawData || []) as unknown as RawSearchResult[]) || []).sort(
        (a, b) => a.position - b.position
      );
    } catch {
      rawResults = [];
    }

    const run = runData as unknown as SearchRun;

    return {
      ...run,
      raw_results: rawResults,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('schema cache') || message.includes('PGRST205')) {
      return null;
    }
    throw err;
  }
}
