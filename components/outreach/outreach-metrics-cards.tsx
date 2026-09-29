'use client';

import { FileEdit, CheckCircle2, Send, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui';
import type { OutreachMetrics } from '@/types/outreach';

interface OutreachMetricsCardsProps {
  metrics: OutreachMetrics;
}

export function OutreachMetricsCards({ metrics }: OutreachMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Drafts */}
      <Card className="flex items-center gap-4 border-slate-800 bg-[#0C1220] p-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/40 text-amber-400 shadow-sm">
          <FileEdit className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            Pending Drafts
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {metrics.totalDrafts}
            </span>
            <span className="text-[11px] font-medium text-amber-400">Needs Review</span>
          </div>
        </div>
      </Card>

      {/* Approved */}
      <Card className="flex items-center gap-4 border-slate-800 bg-[#0C1220] p-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            Approved Outreach
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {metrics.totalApproved}
            </span>
            <span className="text-[11px] font-medium text-emerald-400">Human Verified</span>
          </div>
        </div>
      </Card>

      {/* Total Pipeline */}
      <Card className="flex items-center gap-4 border-slate-800 bg-[#0C1220] p-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-950/40 text-sky-400 shadow-sm">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            Total Records
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {metrics.totalOutreach}
            </span>
            <span className="text-[11px] text-slate-400">All Channels</span>
          </div>
        </div>
      </Card>

      {/* Safety Guard */}
      <Card className="flex items-center gap-4 border-slate-800 bg-[#0C1220] p-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            Outreach Safety
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-white">Manual Mode</span>
            <span className="text-[11px] font-medium text-emerald-400">Zero Auto-Send</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
