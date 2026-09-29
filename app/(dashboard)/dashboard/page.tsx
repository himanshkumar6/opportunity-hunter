import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Target,
  Sparkles,
  Search,
  Database,
  Terminal,
  Activity,
  History,
  Building2,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  EmptyState,
} from '@/components/ui';
import { getDashboardStats } from '@/lib/api/stats';
import { getOpportunities } from '@/lib/api/opportunities';
import { getSearchRuns } from '@/lib/api/search-runs';
import { formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  const [stats, oppsResult, runsResult] = await Promise.all([
    getDashboardStats(),
    getOpportunities({ page: 1, pageSize: 5 }),
    getSearchRuns({ page: 1, pageSize: 5 }),
  ]);

  const totalOpps = stats.totalJobs + stats.totalLeads;

  return (
    <div className="space-y-6">
      {/* Telemetry / Operator Welcome Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="emerald" dot dotPulse>
                OPERATOR TELEMETRY LIVE
              </Badge>
              <Badge variant="outline" size="sm">
                v0.1.0-mvp
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Opportunity Hunter Command Center
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Unified intelligence workspace coordinating automated discovery across developer job
              markets and high-intent commercial B2B prospects.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/leads">
              <Button variant="primary" size="sm" leftIcon={<Target className="h-4 w-4" />}>
                Lead Hunt AI
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="sky" size="sm" leftIcon={<Briefcase className="h-4 w-4" />}>
                Job Hunt AI
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Real Database Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Opportunities */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Opportunities</span>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-white">{totalOpps}</p>
          <p className="mt-1 text-[10px] text-slate-500">Aggregated pipeline records</p>
        </Card>

        {/* Metric 2: New / Unreviewed */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">New / Unreviewed</span>
            <TrendingUp className="h-4 w-4 text-sky-400" />
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-white">
            {stats.newOpportunities}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Awaiting operator qualification</p>
        </Card>

        {/* Metric 3: Job Hunt Positions */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Job Positions</span>
            <Briefcase className="h-4 w-4 text-sky-400" />
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-white">
            {stats.totalJobs}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Ingested technical jobs</p>
        </Card>

        {/* Metric 4: Commercial Leads */}
        <Card className="bg-[#090E1B] p-4">
          <div className="mb-2 flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Commercial Leads</span>
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-white">
            {stats.totalLeads}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Qualified B2B companies</p>
        </Card>
      </div>

      {/* Primary Discovery Engines */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Job Hunt AI Engine Card */}
        <Card hoverable className="border-sky-900/30 bg-[#0A1120]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-800/60 bg-sky-950 text-sky-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Job Hunt AI</CardTitle>
                  <CardDescription>Engineering & Tech Careers Pipeline</CardDescription>
                </div>
              </div>
              <Badge variant="sky" size="sm" dot>
                HOURLY ENGINE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-slate-400">
              Discovers and normalizes high-value engineering, technical sales, and design openings
              from automated web scraper streams.
            </p>
          </CardContent>
          <CardFooter className="justify-between border-slate-800/60 bg-slate-900/20">
            <span className="font-mono text-[11px] text-slate-500">
              Filters: Remote, Salary, Tech Stack
            </span>
            <Link href="/jobs">
              <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="h-3 w-3" />}>
                Explore Jobs
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Lead Hunt AI Engine Card */}
        <Card hoverable className="border-emerald-900/30 bg-[#071318]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-800/60 bg-emerald-950 text-emerald-400">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Lead Hunt AI</CardTitle>
                  <CardDescription>B2B High-Intent Prospecting</CardDescription>
                </div>
              </div>
              <Badge variant="emerald" size="sm" dot>
                ON-DEMAND SCRAPER
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-slate-400">
              Surfaces high-margin local businesses with measurable digital gaps (missing websites,
              outdated tech, poor SEO, unverified listings).
            </p>
          </CardContent>
          <CardFooter className="justify-between border-slate-800/60 bg-slate-900/20">
            <span className="font-mono text-[11px] text-slate-500">
              Features: Decision-maker enrichment
            </span>
            <Link href="/leads">
              <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="h-3 w-3" />}>
                Find Prospects
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Real Pipeline Feeds */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Opportunities Feed */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Recent Opportunities
              </CardTitle>
              <Link href="/opportunities">
                <Button variant="ghost" size="xs">
                  View all ({oppsResult.total})
                </Button>
              </Link>
            </div>
            <CardDescription>Latest incoming job and lead discovery records</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center">
            {oppsResult.items.length === 0 ? (
              <EmptyState
                compact
                icon={<Search className="h-5 w-5 text-emerald-400" />}
                title="No opportunities indexed yet"
                description="Trigger an automated search run from Job Hunt AI or Lead Hunt AI to populate your pipeline."
                action={
                  <div className="flex items-center gap-2">
                    <Link href="/leads">
                      <Button variant="primary" size="xs">
                        Start Lead Hunt
                      </Button>
                    </Link>
                  </div>
                }
              />
            ) : (
              <div className="space-y-2">
                {oppsResult.items.map((opp) => (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#080D19] p-3 text-xs"
                  >
                    <div className="max-w-[240px] space-y-0.5 truncate">
                      <Link
                        href={opp.type === 'job' ? `/jobs/${opp.id}` : `/leads/${opp.id}`}
                        className="block truncate font-medium text-white transition-colors hover:text-emerald-400"
                      >
                        {opp.title}
                      </Link>
                      <p className="truncate text-[11px] text-slate-400">
                        {opp.company?.name || opp.location || 'Direct Opportunity'}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Badge variant={opp.type === 'job' ? 'sky' : 'emerald'} size="sm">
                        {opp.type}
                      </Badge>
                      <span className="font-mono text-[10px] text-slate-500">
                        {formatDate(opp.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Search Runs Feed */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-emerald-400" />
                Recent Search Runs
              </CardTitle>
              <Link href="/search-runs">
                <Button variant="ghost" size="xs">
                  View all ({runsResult.total})
                </Button>
              </Link>
            </div>
            <CardDescription>Scraper audit logs and automation batches</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center">
            {runsResult.items.length === 0 ? (
              <EmptyState
                compact
                icon={<Terminal className="h-5 w-5 text-slate-400" />}
                title="No search runs executed yet"
                description="Execution logs for scheduled hourly jobs and on-demand scraper triggers will appear here."
                action={
                  <Link href="/leads">
                    <Button variant="secondary" size="xs">
                      Run First Search
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2">
                {runsResult.items.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#080D19] p-3 text-xs"
                  >
                    <div className="max-w-[240px] truncate">
                      <p className="truncate font-semibold text-white">{run.query}</p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {run.location || 'Global'} • {run.source}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Badge variant="emerald" size="sm">
                        {Number(run.results_count ?? run.total_results ?? 0)} found
                      </Badge>
                      <span className="font-mono text-[10px] text-slate-500">
                        {formatDate(run.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backend Infrastructure Telemetry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-emerald-400" />
            Connected Infrastructure Telemetry
          </CardTitle>
          <CardDescription>Live health status of integrated cloud services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#080D19] p-3">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-white">Supabase PostgreSQL</p>
                  <p className="font-mono text-[10px] text-slate-500">SSR Engine Mode</p>
                </div>
              </div>
              <Badge variant="emerald" size="sm" dot>
                CONNECTED
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#080D19] p-3">
              <div className="flex items-center gap-2.5">
                <Terminal className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-white">n8n Automation</p>
                  <p className="font-mono text-[10px] text-slate-500">Trigger Proxy Ready</p>
                </div>
              </div>
              <Badge variant="sky" size="sm" dot>
                ONLINE
              </Badge>
            </div>

            <Link
              href="/companies"
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#080D19] p-3 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-medium text-white">Companies</p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {stats.totalCompanies} Indexed
                  </p>
                </div>
              </div>
              <Badge variant="emerald" size="sm">
                VIEW
              </Badge>
            </Link>

            <Link
              href="/contacts"
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#080D19] p-3 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-medium text-white">Contacts</p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {stats.totalContacts} Enriched
                  </p>
                </div>
              </div>
              <Badge variant="emerald" size="sm">
                VIEW
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
