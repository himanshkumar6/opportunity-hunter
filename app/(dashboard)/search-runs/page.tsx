import Link from 'next/link';
import {
  History,
  Terminal,
  Target,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
  EmptyState,
} from '@/components/ui';
import { getSearchRuns } from '@/lib/api/search-runs';
import { formatDate } from '@/lib/utils';

interface PageProps {
  searchParams: Promise<{
    source?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function SearchRunsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const result = await getSearchRuns({
    source: params.source,
    status: params.status,
    page: isNaN(page) ? 1 : page,
    pageSize: 20,
  });

  const STALE_THRESHOLD_MS = 30 * 60 * 1000;

  const getIsStaleRun = (run: { status: string; created_at: string }) => {
    if (run.status?.toLowerCase() !== 'running') return false;
    const runAge = new Date().getTime() - new Date(run.created_at).getTime();
    return runAge > STALE_THRESHOLD_MS;
  };

  const getStatusBadge = (status: string, createdAt?: string) => {
    const s = status?.toLowerCase() || '';
    const isStale = createdAt
      ? new Date().getTime() - new Date(createdAt).getTime() > STALE_THRESHOLD_MS
      : false;

    switch (s) {
      case 'completed':
      case 'success':
        return (
          <Badge variant="emerald" size="sm" dot>
            Completed
          </Badge>
        );
      case 'running':
      case 'in_progress':
        return isStale ? (
          <Badge variant="amber" size="sm">
            Stale / Timed Out
          </Badge>
        ) : (
          <Badge variant="sky" size="sm" dot dotPulse>
            Running
          </Badge>
        );
      case 'failed':
      case 'error':
        return (
          <Badge variant="rose" size="sm">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" size="sm">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    const s = source?.toLowerCase() || '';
    if (s.includes('maps') || s.includes('lead')) {
      return (
        <Badge variant="emerald" size="sm" className="gap-1">
          <Target className="h-2.5 w-2.5" />
          serpapi_maps
        </Badge>
      );
    }
    if (s.includes('job')) {
      return (
        <Badge variant="sky" size="sm" className="gap-1">
          <Briefcase className="h-2.5 w-2.5" />
          google_jobs
        </Badge>
      );
    }
    return (
      <Badge variant="outline" size="sm">
        {source || 'automation'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-800/40 bg-emerald-950/80 text-emerald-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Automation Search Runs & Audit Trail
                </h1>
                <Badge variant="emerald" size="sm">
                  {result.total} {result.total === 1 ? 'Run' : 'Runs'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Audit logs of scraper queries, extracted raw results count, and n8n orchestration
                status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/leads">
              <Button variant="primary" size="xs" leftIcon={<Target className="h-3.5 w-3.5" />}>
                New Lead Hunt
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stale Running Runs Warning Banner */}
      {result.items.some(getIsStaleRun) && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-800/60 bg-amber-950/30 p-4 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-300">Stale search runs detected</p>
            <p className="mt-0.5 opacity-80">
              {result.items.filter(getIsStaleRun).length} search run
              {result.items.filter(getIsStaleRun).length === 1 ? '' : 's'} have been stuck in{' '}
              <span className="font-mono">running</span> state for over 30 minutes. This typically
              means the n8n workflow completed but did not update the search_runs status back to{' '}
              <span className="font-mono">completed</span>. The raw results and company data may
              still have been extracted successfully. Check your n8n workflow&apos;s error handling
              node to ensure it always writes a final status.
            </p>
          </div>
        </div>
      )}

      {/* Main Table or Empty State */}
      {result.items.length === 0 ? (
        <EmptyState
          title="No automation search runs recorded yet"
          description="Every scheduled Job Hunt scraping cycle and on-demand Lead Hunt creates an auditable record in this table. Trigger your first search to generate execution telemetry."
          icon={<Terminal className="h-6 w-6 text-slate-400" />}
          action={
            <div className="flex items-center gap-3">
              <Link href="/leads">
                <Button variant="primary" size="sm" leftIcon={<Target className="h-4 w-4" />}>
                  Run Lead Hunt
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Query</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Source / Engine</TableHead>
                <TableHead>Raw Extracted</TableHead>
                <TableHead>Execution Status</TableHead>
                <TableHead className="text-right">Run Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((run) => (
                <TableRow key={run.id} className={getIsStaleRun(run) ? 'opacity-60' : undefined}>
                  <TableCell className="font-semibold text-white">{run.query}</TableCell>
                  <TableCell className="text-slate-300">
                    {run.location || 'Global / Unspecified'}
                  </TableCell>
                  <TableCell>{getSourceBadge(run.source)}</TableCell>
                  <TableCell className="font-mono text-[11px] text-slate-300">
                    {Number(run.results_count ?? run.total_results ?? 0)} results
                  </TableCell>
                  <TableCell>{getStatusBadge(run.status, run.created_at)}</TableCell>
                  <TableCell className="text-right font-mono text-[11px] text-slate-400">
                    {formatDate(run.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-2 py-3 font-mono text-xs text-slate-400">
              <span>
                Page {result.page} of {result.totalPages} ({result.total} total runs)
              </span>
              <div className="flex items-center gap-2">
                {result.page > 1 && (
                  <Link href={`/search-runs?page=${result.page - 1}`}>
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
                  <Link href={`/search-runs?page=${result.page + 1}`}>
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
