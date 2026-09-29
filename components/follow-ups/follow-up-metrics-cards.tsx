import { CalendarClock, AlertTriangle, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import type { FollowUpMetrics } from '@/types/follow-ups';

interface FollowUpMetricsCardsProps {
  metrics: FollowUpMetrics;
}

export function FollowUpMetricsCards({ metrics }: FollowUpMetricsCardsProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5"
      data-testid="follow-up-metrics-grid"
    >
      {/* Total Follow-ups */}
      <Card className="border-slate-800 bg-[#0C1220]">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-sky-800/40 bg-sky-950/80 text-sky-400">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium text-slate-400 uppercase">
              Total Follow-ups
            </p>
            <p className="text-xl font-bold tracking-tight text-white">{metrics.total}</p>
          </div>
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card
        className={`border-slate-800 bg-[#0C1220] ${
          metrics.overdue > 0 ? 'border-rose-500/30 bg-rose-950/10' : ''
        }`}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border ${
              metrics.overdue > 0
                ? 'border-rose-800/60 bg-rose-950/80 text-rose-400'
                : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium text-slate-400 uppercase">Overdue</p>
            <p
              className={`text-xl font-bold tracking-tight ${
                metrics.overdue > 0 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {metrics.overdue}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Due Today */}
      <Card className="border-slate-800 bg-[#0C1220]">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-amber-800/40 bg-amber-950/80 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium text-slate-400 uppercase">Due Today</p>
            <p className="text-xl font-bold tracking-tight text-amber-400">{metrics.due_today}</p>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card className="border-slate-800 bg-[#0C1220]">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium text-slate-400 uppercase">Upcoming</p>
            <p className="text-xl font-bold tracking-tight text-white">{metrics.upcoming}</p>
          </div>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card className="col-span-2 border-slate-800 bg-[#0C1220] sm:col-span-1">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-800/40 bg-emerald-950/80 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium text-slate-400 uppercase">Completed</p>
            <p className="text-xl font-bold tracking-tight text-emerald-400">{metrics.completed}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
