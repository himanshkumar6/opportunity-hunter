import Link from 'next/link';
import { Briefcase, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui';
import { getJobs } from '@/lib/api/jobs';
import { JobFilters } from '@/components/jobs/job-filters';
import { JobTable } from '@/components/jobs/job-table';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    location?: string;
    source?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const result = await getJobs({
    search: params.search,
    location: params.location,
    source: params.source,
    status: params.status,
    page: isNaN(page) ? 1 : page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-sky-900/30 bg-[#0A1120] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-800/60 bg-sky-950 text-sky-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Job Hunt AI Discovery
                </h1>
                <Badge variant="sky" size="sm">
                  {result.total} {result.total === 1 ? 'Job' : 'Jobs'}
                </Badge>
                <Badge variant="sky" size="sm" dot dotPulse>
                  HOURLY ENGINE
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Continuous ingestion of tech and engineering positions across Google Jobs & indexed
                sources
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/search-runs">
              <Button variant="secondary" size="xs" leftIcon={<History className="h-3.5 w-3.5" />}>
                Ingestion Logs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <JobFilters
        initialSearch={params.search}
        initialLocation={params.location}
        initialSource={params.source}
        initialStatus={params.status}
      />

      {/* Main Table or Empty State */}
      {result.items.length === 0 ? (
        <EmptyState
          title="No job opportunities indexed yet"
          description={
            params.search || params.location || params.source || params.status
              ? 'No jobs match your filter criteria. Try broadening your location or search query.'
              : 'The automated hourly scraper runs continuously to ingest opportunities. Records will appear here as soon as the ingestion pipeline indexes matching roles.'
          }
          action={
            <div className="flex items-center gap-3">
              <Link href="/search-runs">
                <Button variant="secondary" size="sm" leftIcon={<History className="h-4 w-4" />}>
                  View Search Runs & Ingestion Audit
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <JobTable items={result.items} />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-2 py-3 font-mono text-xs text-slate-400">
              <span>
                Page {result.page} of {result.totalPages} ({result.total} total jobs)
              </span>
              <div className="flex items-center gap-2">
                {result.page > 1 && (
                  <Link
                    href={`/jobs?page=${result.page - 1}${params.search ? `&search=${params.search}` : ''}${params.location ? `&location=${params.location}` : ''}`}
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
                    href={`/jobs?page=${result.page + 1}${params.search ? `&search=${params.search}` : ''}${params.location ? `&location=${params.location}` : ''}`}
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
