import Link from 'next/link';
import { Sparkles, Target, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui';
import { getOpportunities } from '@/lib/api/opportunities';
import { OpportunityFilters } from '@/components/opportunities/opportunity-filters';
import { OpportunityTable } from '@/components/opportunities/opportunity-table';

interface PageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    location?: string;
    search?: string;
    sortBy?: 'newest' | 'score' | 'oldest';
    page?: string;
  }>;
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const result = await getOpportunities({
    type: params.type,
    status: params.status,
    location: params.location,
    search: params.search,
    sortBy: params.sortBy,
    page: isNaN(page) ? 1 : page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-800/40 bg-emerald-950/80 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Unified Opportunities Pipeline
                </h1>
                <Badge variant="emerald" size="sm">
                  {result.total} {result.total === 1 ? 'Record' : 'Records'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Track, filter, and qualify incoming jobs and B2B prospect opportunities across all
                discovery channels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/leads">
              <Button variant="primary" size="xs" leftIcon={<Target className="h-3.5 w-3.5" />}>
                Run Lead Hunt
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="sky" size="xs" leftIcon={<Briefcase className="h-3.5 w-3.5" />}>
                Explore Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <OpportunityFilters
        initialType={params.type}
        initialStatus={params.status}
        initialLocation={params.location}
        initialSearch={params.search}
        initialSortBy={params.sortBy}
      />

      {/* Main Table or Empty State */}
      {result.items.length === 0 ? (
        <EmptyState
          title="No opportunities found"
          description={
            params.search || params.type || params.status || params.location
              ? 'No opportunities match your selected filter criteria. Try adjusting or resetting your search filters.'
              : 'The opportunities pipeline is currently empty. Run an automated discovery query from Lead Hunt AI or wait for the next scheduled Job Hunt cycle.'
          }
          action={
            <div className="flex items-center gap-3">
              <Link href="/leads">
                <Button variant="primary" size="sm" leftIcon={<Target className="h-4 w-4" />}>
                  Start Lead Hunt
                </Button>
              </Link>
              <Link href="/jobs">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Briefcase className="h-4 w-4 text-sky-400" />}
                >
                  View Job Hunt
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <OpportunityTable items={result.items} />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-2 py-3 font-mono text-xs text-slate-400">
              <span>
                Page {result.page} of {result.totalPages} ({result.total} total opportunities)
              </span>
              <div className="flex items-center gap-2">
                {result.page > 1 && (
                  <Link
                    href={`/opportunities?page=${result.page - 1}${params.type ? `&type=${params.type}` : ''}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}`}
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
                    href={`/opportunities?page=${result.page + 1}${params.type ? `&type=${params.type}` : ''}${params.status ? `&status=${params.status}` : ''}${params.search ? `&search=${params.search}` : ''}`}
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
