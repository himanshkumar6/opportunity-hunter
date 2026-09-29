import Link from 'next/link';
import { Target, ChevronLeft, ChevronRight, History, Sparkles } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui';
import { getLeads } from '@/lib/api/leads';
import { LeadHuntForm } from '@/components/leads/lead-hunt-form';
import { LeadFilters } from '@/components/leads/lead-filters';
import { LeadTable } from '@/components/leads/lead-table';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    location?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const result = await getLeads({
    search: params.search,
    location: params.location,
    status: params.status,
    page: isNaN(page) ? 1 : page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-emerald-900/40 bg-[#071318] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-800/60 bg-emerald-950 text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Lead Hunt AI Discovery
                </h1>
                <Badge variant="emerald" size="sm">
                  {result.total} {result.total === 1 ? 'Lead' : 'Leads'}
                </Badge>
                <Badge variant="emerald" size="sm" dot dotPulse>
                  ON-DEMAND SCRAPER
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Discover high-value commercial prospects with quantifiable website, SEO, and social
                media gaps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/search-runs">
              <Button variant="secondary" size="xs" leftIcon={<History className="h-3.5 w-3.5" />}>
                Scraper Logs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* On-Demand Lead Hunt Trigger Form */}
      <LeadHuntForm />

      {/* Filter Bar for Existing Leads */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase">
            Indexed Commercial Prospects
          </h2>
          <span className="font-mono text-[11px] text-slate-500">
            Showing {result.items.length} of {result.total} leads
          </span>
        </div>

        <LeadFilters
          initialSearch={params.search}
          initialLocation={params.location}
          initialStatus={params.status}
        />
      </div>

      {/* Main Table or Empty State */}
      {result.items.length === 0 ? (
        <EmptyState
          title="No commercial leads indexed yet"
          description={
            params.search || params.location || params.status
              ? 'No leads match your active filters. Try searching by a different city or status.'
              : 'Launch your first Lead Hunt using the automation form above. The scraper will query Google Maps, evaluate website gaps, and extract decision-maker contacts.'
          }
          icon={<Sparkles className="h-6 w-6 text-emerald-400" />}
          action={
            <div className="flex items-center gap-3">
              <Link href="/search-runs">
                <Button variant="secondary" size="sm" leftIcon={<History className="h-4 w-4" />}>
                  View Search Runs
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <LeadTable items={result.items} />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-2 py-3 font-mono text-xs text-slate-400">
              <span>
                Page {result.page} of {result.totalPages} ({result.total} total leads)
              </span>
              <div className="flex items-center gap-2">
                {result.page > 1 && (
                  <Link
                    href={`/leads?page=${result.page - 1}${params.search ? `&search=${params.search}` : ''}${params.location ? `&location=${params.location}` : ''}`}
                  >
                    <Button
                      variant="outline"
                      size="xs"
                      leftIcon={<ChevronLeft className="h-3 w-3" />}
                    >
                      Previous
                    </Button>
                  </Link>
                )}
                {result.page < result.totalPages && (
                  <Link
                    href={`/leads?page=${result.page + 1}${params.search ? `&search=${params.search}` : ''}${params.location ? `&location=${params.location}` : ''}`}
                  >
                    <Button
                      variant="outline"
                      size="xs"
                      rightIcon={<ChevronRight className="h-3 w-3" />}
                    >
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
