import Link from 'next/link';
import { Send, Target, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui';
import { getOutreachList } from '@/lib/api/outreach';
import { OutreachFilters } from '@/components/outreach/outreach-filters';
import { OutreachTable } from '@/components/outreach/outreach-table';
import { OutreachMetricsCards } from '@/components/outreach/outreach-metrics-cards';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    channel?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function OutreachDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const result = await getOutreachList({
    status: params.status,
    channel: params.channel,
    search: params.search,
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
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Outreach & Human Approval
                </h1>
                <Badge variant="emerald" size="sm">
                  {result.total} {result.total === 1 ? 'Draft' : 'Drafts'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Compose, review, and approve targeted outreach for discovered opportunities with
                mandatory human verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/opportunities">
              <Button variant="outline" size="xs" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                View Opportunities
              </Button>
            </Link>
            <Link href="/leads">
              <Button variant="primary" size="xs" leftIcon={<Target className="h-3.5 w-3.5" />}>
                Discover Leads
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <OutreachMetricsCards metrics={result.metrics} />

      {/* Filters Bar */}
      <OutreachFilters
        initialStatus={params.status}
        initialChannel={params.channel}
        initialSearch={params.search}
      />

      {/* Main Outreach Table or Empty State */}
      {result.items.length === 0 ? (
        <EmptyState
          title="No outreach drafts found"
          description={
            params.search || params.status || params.channel
              ? 'No outreach records match your active search and filter criteria. Try resetting your filters.'
              : 'No outreach drafts have been generated yet. Open an opportunity from the pipeline and click "Review & Outreach" to draft verified copy.'
          }
          action={
            <div className="flex items-center gap-3">
              <Link href="/opportunities">
                <Button variant="primary" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
                  Explore Opportunities
                </Button>
              </Link>
              <Link href="/outreach">
                <Button variant="outline" size="sm">
                  Clear Filters
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <OutreachTable items={result.items} />

          {/* Pagination Controls */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-2 py-3 font-mono text-xs text-slate-400">
              <span>
                Page {result.page} of {result.totalPages} ({result.total} total outreach records)
              </span>
              <div className="flex items-center gap-2">
                {result.page > 1 && (
                  <Link
                    href={`/outreach?page=${result.page - 1}${params.status ? `&status=${params.status}` : ''}${params.channel ? `&channel=${params.channel}` : ''}${params.search ? `&search=${params.search}` : ''}`}
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
                    href={`/outreach?page=${result.page + 1}${params.status ? `&status=${params.status}` : ''}${params.channel ? `&channel=${params.channel}` : ''}${params.search ? `&search=${params.search}` : ''}`}
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
