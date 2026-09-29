import Link from 'next/link';
import { CalendarClock, Sparkles, Send } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { getFollowUps, getFollowUpMetrics } from '@/lib/api/follow-ups';
import { FollowUpsView } from '@/components/follow-ups/follow-ups-view';
import type { FollowUpFilterState, FollowUpPriority, FollowUpStatus } from '@/types/follow-ups';

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    status?: string;
    priority?: string;
    search?: string;
    page?: string;
    opportunity_id?: string;
  }>;
}

export default async function FollowUpsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const [result, metrics] = await Promise.all([
    getFollowUps({
      filter: (params.filter as FollowUpFilterState) || 'all',
      status: (params.status as FollowUpStatus | 'all') || 'all',
      priority: (params.priority as FollowUpPriority | 'all') || 'all',
      search: params.search,
      opportunity_id: params.opportunity_id,
      page: isNaN(page) ? 1 : page,
      pageSize: 20,
    }),
    getFollowUpMetrics(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-800/40 bg-sky-950/80 text-sky-400">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Follow-ups & Activity
                </h1>
                <Badge variant="sky" size="sm">
                  {result.total} {result.total === 1 ? 'Action' : 'Actions'}
                </Badge>
                {metrics.overdue > 0 && (
                  <Badge variant="rose" size="sm" className="animate-pulse">
                    {metrics.overdue} Overdue
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Track operator follow-ups, overdue milestones, and unified activity history with
                zero automatic sending.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/outreach">
              <Button variant="outline" size="xs" leftIcon={<Send className="h-3.5 w-3.5" />}>
                Outreach Drafts
              </Button>
            </Link>
            <Link href="/opportunities">
              <Button variant="secondary" size="xs" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <FollowUpsView initialResult={result} metrics={metrics} />
    </div>
  );
}
